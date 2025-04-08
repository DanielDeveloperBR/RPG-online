import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname, '../../public')));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

interface Jogador {
  id: number;
  socketId: string;
  nome: string;
  vida: number;
  ataque: number;
  defesa: number;
  habilidadeUsada: boolean;
}

class RPG {
  jogador1: Jogador;
  jogador2: Jogador;
  turno: string; // socket.id do jogador da vez

  constructor(j1: Jogador, j2: Jogador) {
    this.jogador1 = j1;
    this.jogador2 = j2;
    this.turno = j1.socketId; // jogador1 começa
  }
  verificarVitoria(): Jogador | null {
    if (this.jogador1.vida <= 0) return this.jogador2;
    if (this.jogador2.vida <= 0) return this.jogador1;
    return null;
  }


  getJogador(socketId: string): Jogador {
    return this.jogador1.socketId === socketId ? this.jogador1 : this.jogador2;
  }

  getOponente(socketId: string): Jogador {
    return this.jogador1.socketId === socketId ? this.jogador2 : this.jogador1;
  }

  atacar(): number {
    const tipo = Math.floor(Math.random() * 3);
    if (tipo === 0) return 5 + Math.floor(Math.random() * 6);     // leve
    if (tipo === 1) return 10 + Math.floor(Math.random() * 11);   // médio
    return 20 + Math.floor(Math.random() * 16);                   // pesado
  }

  aplicarAcao(socketId: string, acao: string): string {
    if (socketId !== this.turno) return 'Não é sua vez!';

    const atacante = this.getJogador(socketId);
    const defensor = this.getOponente(socketId);
    let mensagem = '';

    if (acao === 'atacar') {
      const dano = this.atacar();
      defensor.vida -= dano;
      mensagem = `${atacante.nome} atacou causando ${dano} de dano!`;
    } else if (acao === 'defender') {
      atacante.defesa = 1;
      mensagem = `${atacante.nome} está se defendendo.`;
    } else if (acao === 'habilidade') {
      if (!atacante.habilidadeUsada) {
        defensor.vida -= 30;
        atacante.habilidadeUsada = true;
        mensagem = `${atacante.nome} usou a habilidade especial causando 30 de dano!`;
      } else {
        mensagem = `${atacante.nome} já usou sua habilidade especial.`;
      }
    }

    // Trocar turno
    this.turno = defensor.socketId;
    return mensagem;
  }
}

// Estado global
let jogadores: { [id: string]: Jogador } = {};
let jogo: RPG | null = null;

io.on('connection', (socket) => {
  console.log(`Jogador conectado: ${socket.id}`);

  socket.on('registrarJogador', (nome: string) => {
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

    jogadores[socket.id] = novoJogador;
    socket.emit('registrado', novoJogador);

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
      jogo = null;
      jogadores = {};
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

  socket.on('disconnect', () => {
    console.log(`Jogador desconectado: ${socket.id}`);
    delete jogadores[socket.id];
    jogo = null;
    io.emit('mensagem', 'Um jogador saiu. A partida foi encerrada.');
  });
});

export default server;
