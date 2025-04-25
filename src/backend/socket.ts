import { Server } from 'socket.io';
import server from './server';
import Classes from './classes';
import Jogador from "./jogador";
import { RPG } from "./jogo";

const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    methods: ['GET', 'POST']
  }
});
let salas: {
  [nomeDaSala: string]: {
    jogadores: { [id: string]: Jogador };
    jogo: RPG | null;
    intervaloReset?: NodeJS.Timeout | null;
    status: 'esperando' | 'completa' | 'emJogo' | 'resetando';
  };
} = {};

const barbaro = Classes.criarClasse("barbaro", 80, 20, 50, 70, 'Fúria, Valor de ataque alto e paralisa o inimigo por 1 turno.',)
const mago = Classes.criarClasse("mago", 100, 10, 80, 60, 'Bola de Fogo: Dano em área e ignora defesa.',)
const arqueiro = Classes.criarClasse("arqueiro", 90, 15, 40, 50, 'Tiro Certeiro: Ataque preciso, chance de crítico e ignora defesa.',)

io.on('connection', (socket) => {

  // console.log('Novo jogador conectado:', socket.id);

  // Registrar jogador
  socket.on('registrarJogador', (nome: string, classe: string) => {

    if (typeof nome !== 'string' || nome.trim().length === 0 || typeof classe !== 'string') {
      socket.emit('erro', 'Nome ou classe inválidos.');
      return;
    }

    let salaEncontrada = Object.entries(salas).find(([_, sala]) => {
      // Limpa jogadores desconectados ou sessões duplicadas antes de aceitar novo
      for (const [id, jogador] of Object.entries(sala.jogadores)) {
        const aindaConectado = io.sockets.sockets.get(id);
        if (!aindaConectado) {
          delete sala.jogadores[id];
        }
      }

      return sala.status === 'esperando' && Object.keys(sala.jogadores).length < 2;
    });

    // Esperando quando não encontrar uma sala
    if (!salaEncontrada) {
      const novaSala = `sala-${socket.id}`;
      salas[novaSala] = {
        jogadores: {},
        jogo: null,
        intervaloReset: null,
        status: 'esperando'
      };

      salaEncontrada = [novaSala, salas[novaSala]];
    }

    const [nomeSala, sala] = salaEncontrada;
    socket.join(nomeSala);

    const id = Object.keys(sala.jogadores).length + 1;
    let classeEscolhida;

    switch (classe) {
      case 'barbaro':
        classeEscolhida = Classes.criarClasse("barbaro", 80, 20, 50, 70, 'Fúria, Valor de ataque alto e paralisa o inimigo por 1 turno.')
        break;
      case 'mago':
        classeEscolhida = Classes.criarClasse("mago", 100, 10, 80, 60, 'Bola de Fogo: Dano em área e ignora defesa.')
        break;
      case 'arqueiro':
        classeEscolhida = Classes.criarClasse("arqueiro", 90, 15, 40, 50, 'Tiro Certeiro: Ataque preciso, chance de crítico e ignora defesa.')
        break;
      default:
        socket.emit('erro', 'Classe inválida.');
        return;
    }

    const novoJogador = new Jogador(id, socket.id, nome, 200, classeEscolhida)

    sala.jogadores[socket.id] = novoJogador;

    socket.emit('registrado', novoJogador);
    socket.emit('aguardando', 'Aguardando outro jogador entrar...');


    if (Object.keys(sala.jogadores).length === 2) {
      sala.status = 'emJogo';
      const [j1, j2] = Object.values(sala.jogadores);
      sala.jogo = new RPG(j1, j2);
      sala.jogo.iniciarTurno();

      //  Verificar energia
      sala.jogo.on('estadoEnergia', ({ jogadorId, energiaAtual }) => {
        io.to(jogadorId).emit('estadoEnergia', { jogadorId, energiaAtual });
      });

      // Quando usa a habilidade
      sala.jogo.on('efeitoAtualizado', (dados) => {
        for (const [id, efeito] of Object.entries(dados)) {
          io.to(id).emit('estadoHabilidade', efeito);
        }
      });

      io.to(nomeSala).emit('estadoAtual', {
        j1,
        j2,
        turno: sala.jogo.turno,
        mensagem: 'Jogo iniciado!'
      });


      // Contador
      sala.jogo.on('tempo', (contagem) => {
        io.to(nomeSala).emit('tempo', contagem);
      });

      sala.jogo.on('turnoPulado', ({ mensagem }) => {
        io.to(nomeSala).emit('estadoAtual', {
          j1: sala.jogo!.jogador1,
          j2: sala.jogo!.jogador2,
          turno: sala.jogo!.turno,
          mensagem,
          trocarTurno: true
        });
      })
      sala.jogo.on('jogadorAtordoado', ({ jogadorId }) => {

        io.to(jogadorId).emit('jogadorAtordoado');
      });

    }

  });

  socket.on('acaoDoJogador', ({ tipo }) => {
    if (typeof tipo !== 'string') return;

    const salaDoJogador = Object.entries(salas).find(([_, sala]) => sala.jogadores[socket.id]);
    if (!salaDoJogador) return;

    const [nomeSala, sala] = salaDoJogador;
    const jogo = sala.jogo;
    const jogador = sala?.jogadores[socket.id];
    if (!jogo || !jogador) return;


    const mensagem = jogo.aplicarAcao(socket.id, tipo);

    const vencedor = jogo.verificarVitoria();

    if (vencedor) {
      sala.jogo?.removerContador()
      io.to(nomeSala).emit('estadoAtual', {
        j1: jogo.jogador1,
        j2: jogo.jogador2,
        turno: null,
        mensagem: `🏆 ${vencedor.nome} venceu a partida!`
      });
      io.to(nomeSala).emit('mostrarBotaoReiniciar');
      return;
    }
    socket.emit('mensagem', `🔒 ${mensagem}`);
  });

  socket.on('pularTurno', () => {
    const salaDoJogador = Object.entries(salas).find(([_, sala]) => sala.jogadores[socket.id]);
    if (!salaDoJogador) return;

    const [nomeSala, sala] = salaDoJogador;
    const jogo = sala.jogo;
    if (!jogo) return;

    const mensagem = jogo.pularTurno(socket.id);

    const vencedor = jogo.verificarVitoria();
    if (vencedor) {
      io.to(nomeSala).emit('estadoAtual', {
        j1: jogo.jogador1,
        j2: jogo.jogador2,
        turno: null,
        mensagem: `🏆 ${vencedor.nome} venceu a partida!`
      });
      jogo.removerContador();
      io.to(nomeSala).emit('mostrarBotaoReiniciar');
      return;
    }

    io.to(nomeSala).emit('estadoAtual', {
      j1: jogo.jogador1,
      j2: jogo.jogador2,
      turno: jogo.turno,
      mensagem,
      trocarTurno: true
    });
  });

  // Acabou o tempo aí tem que pular o turno ou quando está atordoado
  socket.on('turnoPulado', () => {
    const salaDoJogador = Object.entries(salas).find(([_, sala]) => sala.jogadores[socket.id]);
    if (!salaDoJogador) return;

    const [nomeSala, sala] = salaDoJogador;
    const jogo = sala.jogo;
    if (!jogo) return;
    const mensagem = jogo.pularTurno(socket.id);
    io.to(nomeSala).emit('estadoAtual', {
      j1: jogo.jogador1,
      j2: jogo.jogador2,
      turno: jogo.turno,
      mensagem,
      trocarTurno: true
    });
  })

  socket.on('reiniciarPartida', () => {
    const salaDoJogador = Object.entries(salas).find(([_, sala]) => sala.jogadores[socket.id]);
    if (!salaDoJogador) return;

    const [nomeSala, sala] = salaDoJogador;
    const jogo = sala.jogo;
    if (!jogo) return;

    jogo.reiniciar(socket.id);
    jogo.reiniciarContador();
    jogo.on('tempo', (contagem) => {
      io.to(nomeSala).emit('tempo', contagem);
    });
    io.to(nomeSala).emit('reinciarPartida')
    io.to(nomeSala).emit('estadoAtual', {
      j1: jogo.jogador1,
      j2: jogo.jogador2,
      turno: jogo.turno,
      mensagem: '🔄 Jogo reiniciado!'
    });
    jogo.iniciarTurno()
  });

  socket.on('disconnect', () => {
    const salaDoJogador = Object.entries(salas).find(([_, sala]) => sala.jogadores[socket.id]);
    if (!salaDoJogador) return;

    const [nomeSala, sala] = salaDoJogador;
    const jogador = sala.jogadores[socket.id];
    const nome = jogador ? jogador.nome : 'Desconhecido';
    // console.log(`Jogador desconectado: ${socket.id} - Nome: ${nome}`);
    if (sala.jogo) {
      sala.jogo.removerContador();
    }
    if (sala.intervaloReset) {
      clearInterval(sala.intervaloReset);
      sala.intervaloReset = null;
    }
    delete sala.jogadores[socket.id];
    if (Object.keys(sala.jogadores).length === 0) {
      delete salas[nomeSala];
      // console.log(`Sala ${nomeSala} removida.`);
    } else {
      sala.jogo = null;
      sala.status = 'resetando'; 
      io.to(nomeSala).emit('mensagem', 'Um jogador saiu. A partida foi encerrada.');
      
      let contagem = 3;
      if (!sala.intervaloReset) {
        sala.intervaloReset = setInterval(() => {
          io.to(nomeSala).emit('mensagem', `Voltando para tela inicial em ${contagem}...`);
          if (contagem <= 0) {
            sala.jogo?.removerContador()
            clearInterval(sala.intervaloReset!);
            sala.intervaloReset = null;
            io.to(nomeSala).emit('resetarParaEntrada');
            sala.status = 'esperando'; 
          }
          contagem--;
        }, 1000);
      }
    }
  });
});
export { io }