import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import path from 'path';
import helmet from 'helmet';
import dotenv from 'dotenv'
import {RPG} from './jogo';
import Jogador from './jogador';
dotenv.config()

const app = express();
app.use(helmet())
app.use(express.static(path.join(__dirname, '../../public')));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.use(cors());
app.get("/ping", (req: any, res: any) => {
  res.send('pong')
})

// Estado global
let jogadores: { [id: string]: Jogador } = {};
let jogo: RPG | null = null;
let intervaloReset: any = null;



io.on('connection', (socket) => {
  socket.on('registrarJogador', (nome: string) => {
    console.log(`Jogador registrado: ${socket.id} - Nome: ${nome}`);

    if (Object.keys(jogadores).length >= 2) {
      socket.emit('erro', 'Sala cheia!');
      return;
    }

    const novoJogador: Jogador = {
      id: Object.keys(jogadores).length + 1,
      socketId: socket.id,
      nome,
      vida: 100,
      ataque: 0,
      defesa: 0,
      habilidadeUsada: false
    };
    if (intervaloReset) {
      clearInterval(intervaloReset);
      intervaloReset = null;
      io.emit('mensagem', 'Temos um novo desafiante! 🎮 A reinicialização foi interrompida.');
    }
    jogadores[socket.id] = novoJogador;
    socket.emit('registrado', novoJogador);
    socket.emit("aguardando", "Aguardando outro jogador entrar...");
    if (Object.keys(jogadores).length === 2) {
      const [j1, j2] = Object.values(jogadores);
      jogo = new RPG(j1, j2);

      io.emit('estadoAtual', {
        j1,
        j2,
        turno: jogo.turno,
        mensagem: 'Jogo iniciado!'
      });
    }

  });


  // Ações dos jogadores
  socket.on('acaoDoJogador', ({ tipo }) => {
    if (!jogo) return;

    const mensagem = jogo.aplicarAcao(socket.id, tipo);
    const vencedor = jogo.verificarVitoria();

    if (vencedor) {
      io.emit('estadoAtual', {
        j1: jogo.jogador1,
        j2: jogo.jogador2,
        turno: null,
        mensagem: `🏆 ${vencedor.nome} venceu a partida!`
      });

      io.emit('mostrarBotaoReiniciar');
      return;
    }

    const estado = {
      j1: jogo.jogador1,
      j2: jogo.jogador2,
      turno: jogo.turno,
      mensagem
    };

    io.emit('estadoAtual', estado);

  });
  socket.on('reiniciarPartida', () => {
    if (!jogo) return;

    jogo.reiniciar(socket.id);

    io.emit('estadoAtual', {
      j1: jogo.jogador1,
      j2: jogo.jogador2,
      turno: jogo.turno,
      mensagem: '🔄 Jogo reiniciado!'
    });
  });

  socket.on('disconnect', () => {
    const jogador = jogadores[socket.id];
    const nome = jogador ? jogador.nome : 'Desconhecido';
    console.log(`Jogador desconectado: ${socket.id} - Nome: ${nome}`);
    delete jogadores[socket.id];
  
    // Verificar se o jogador fazia parte da partida atual
    if (jogo && (jogo.jogador1.socketId === socket.id || jogo.jogador2.socketId === socket.id)) {
      jogo = null;
  
      io.emit('mensagem', 'Um jogador saiu. A partida foi encerrada.');
  
      let contagem = 3;
      if (!intervaloReset) {
        intervaloReset = setInterval(() => {
          if (contagem > 0) {
            io.emit('mensagem', `Voltando para tela inicial em ${contagem}...`);
            contagem--;
          } else {
            clearInterval(intervaloReset);
            intervaloReset = null;
            io.emit('resetarParaEntrada');
          }
        }, 1000);
      }
    } else {
      console.log(`Jogador ${nome} não fazia parte da partida ativa.`);
    }
  });
  
});

export default server;