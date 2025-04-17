import { Server } from 'socket.io';
import Jogador from "./jogador";
import { RPG } from "./jogo";
import server from './server';

const io = new Server(server, {
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
    };
  } = {};
  
  io.on('connection', (socket) => {
console.log('Novo jogador conectado:', socket.id);
socket.on('registrarJogador', (nome: string) => {
      console.log("usuario: "+nome)
      if (typeof nome !== 'string' || nome.trim().length === 0) {
        socket.emit('erro', 'Nome inválido.');
        return;
      }
  
      let salaEncontrada = Object.entries(salas).find(([_, sala]) => Object.keys(sala.jogadores).length < 2);
  
      if (!salaEncontrada) {
        const novaSala = `sala-${socket.id}`;
        salas[novaSala] = {
          jogadores: {},
          jogo: null,
          intervaloReset: null
        };
        salaEncontrada = [novaSala, salas[novaSala]];
      }
  
      const [nomeSala, sala] = salaEncontrada;
      socket.join(nomeSala);
  
      // Novo jogador
      const novoJogador: Jogador = {
        id: Object.keys(sala.jogadores).length + 1,
        socketId: socket.id,
        nome,
        vida: 100,
        ataque: 0,
        defesa: 0,
        habilidadeUsada: false
      };
  
      sala.jogadores[socket.id] = novoJogador;
  
      socket.emit('registrado', novoJogador);
      socket.emit('aguardando', 'Aguardando outro jogador entrar...');
  
      if (Object.keys(sala.jogadores).length === 2) {
        const [j1, j2] = Object.values(sala.jogadores);
        sala.jogo = new RPG(j1, j2);
  
        io.to(nomeSala).emit('estadoAtual', {
          j1,
          j2,
          turno: sala.jogo.turno,
          mensagem: 'Jogo iniciado!'
        });
      }
    });
  
    socket.on('acaoDoJogador', ({ tipo }) => {
      if (typeof tipo !== 'string') return;
  
      const salaDoJogador = Object.entries(salas).find(([_, sala]) => sala.jogadores[socket.id]);
      if (!salaDoJogador) return;
  
      const [nomeSala, sala] = salaDoJogador;
      const jogo = sala.jogo;
      if (!jogo) return;
  
      const mensagem = jogo.aplicarAcao(socket.id, tipo);
      const vencedor = jogo.verificarVitoria();
  
      if (vencedor) {
        io.to(nomeSala).emit('estadoAtual', {
          j1: jogo.jogador1,
          j2: jogo.jogador2,
          turno: null,
          mensagem: `🏆 ${vencedor.nome} venceu a partida!`
        });
        io.to(nomeSala).emit('mostrarBotaoReiniciar');
        return;
      }
  
      io.to(nomeSala).emit('estadoAtual', {
        j1: jogo.jogador1,
        j2: jogo.jogador2,
        turno: jogo.turno,
        mensagem
      });
    });
  
    socket.on('reiniciarPartida', () => {
      const salaDoJogador = Object.entries(salas).find(([_, sala]) => sala.jogadores[socket.id]);
      if (!salaDoJogador) return;
  
      const [nomeSala, sala] = salaDoJogador;
      const jogo = sala.jogo;
      if (!jogo) return;
  
      jogo.reiniciar(socket.id);
  
      io.to(nomeSala).emit('estadoAtual', {
        j1: jogo.jogador1,
        j2: jogo.jogador2,
        turno: jogo.turno,
        mensagem: '🔄 Jogo reiniciado!'
      });
    });
  
    socket.on('disconnect', () => {
      const salaDoJogador = Object.entries(salas).find(([_, sala]) => sala.jogadores[socket.id]);
      if (!salaDoJogador) return;
      
  
      const [nomeSala, sala] = salaDoJogador;
      const jogador = sala.jogadores[socket.id];
      const nome = jogador ? jogador.nome : 'Desconhecido';
      console.log(`Jogador desconectado: ${socket.id} - Nome: ${nome}`);
  
      delete sala.jogadores[socket.id];
  
      if (sala.jogo && (sala.jogo.jogador1.socketId === socket.id || sala.jogo.jogador2.socketId === socket.id)) {
        sala.jogo = null;
        io.to(nomeSala).emit('mensagem', 'Um jogador saiu. A partida foi encerrada.');
  
        let contagem = 3;
        if (!sala.intervaloReset) {
          sala.intervaloReset = setInterval(() => {
            if (contagem > 0) {
              io.to(nomeSala).emit('mensagem', `Voltando para tela inicial em ${contagem}...`);
              contagem--;
            } else {
              clearInterval(sala.intervaloReset!);
              sala.intervaloReset = null;
              io.to(nomeSala).emit('resetarParaEntrada');
            }
          }, 1000);
        }
      }
 
      if (Object.keys(sala.jogadores).length === 0) {
        delete salas[nomeSala];
        console.log(`Sala ${nomeSala} removida.`);
      }
    });
  });
  export {io}