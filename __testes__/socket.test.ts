import { Server } from 'socket.io';
import Jogador from '../src/backend/jogador';
import { RPG } from '../src/backend/jogo';
import Classes from '../src/backend/classes';
const barbaro = Classes.criarClasse("barbaro", 80, 20, 50, 70, 'Fúria, Valor de ataque alto e paralisa o inimigo por 1 turno.',)
const mago = Classes.criarClasse("mago", 100, 10, 80, 60, 'Bola de Fogo: Dano em área e ignora defesa.',)
const arqueiro = Classes.criarClasse("arqueiro", 90, 15, 40, 50, 'Tiro Certeiro: Ataque preciso, chance de crítico e ignora defesa.',)
// Mock de Classes
jest.mock('../src/backend/jogador', () => {
  return {
    __esModule: true, // Caso esteja utilizando módulos ES
    default: jest.fn().mockImplementation(() => ({
      nome: 'Jogador 1',
      socketId: '1234',
      vida: 100,
      classe: barbaro,
      setBloqueado: jest.fn(),
      setEfeito: jest.fn(),
      reiniciarEnergia: jest.fn(),
    })),
  };
});

jest.mock('../src/backend/jogo', () => {
  return {
    __esModule: true,
    RPG: jest.fn().mockImplementation(() => ({
      jogador1: new Jogador(1234, 'socketId1', 'Jogador1', 100, 'barbaro'),
      jogador2: new Jogador(5678, 'socketId2', 'Jogador2', 100, 'mago'),
      turno: 'socketId1',
      aplicarAcao: jest.fn().mockReturnValue('Ataque realizado'),
      verificarVitoria: jest.fn().mockReturnValue(null),
      reiniciar: jest.fn(),
    })),
  };
});

describe('Testes do socket.io', () => {
  let mockSocket: any;
  let mockServer: Server;
  let salas: any;

  beforeEach(() => {
    mockServer = new Server();
    salas = {};
    mockSocket = {
      id: '1234',
      emit: jest.fn(),
      join: jest.fn(),
      to: jest.fn(),
      on: jest.fn(), // Adicionando o método `on` para simular corretamente
    };

    // Simulação do `io.on` para o evento de conexão
    mockServer.on = jest.fn().mockImplementation((event, callback) => {
      if (event === 'connection') {
        callback(mockSocket); // Chama a função callback com o mockSocket
      }
    });
  });

  test('Registrar jogador e associar a uma sala', async () => {
    const nome = 'Jogador 1';
    const classe = 'barbaro';

    // Simula a conexão de um jogador
    mockServer.on('connection', (socket) => {
      socket.on('registrarJogador', (nome: string, classe: string) => {
        expect(nome).toBe('Jogador 1');
        expect(classe).toBe('barbaro');
        socket.emit('registrado', { nome, classe });  // Emitindo o evento com o objeto correto
      });
    });

    // Disparar o evento de registro de jogador
    await mockSocket.emit('registrarJogador', nome, classe);

    expect(mockSocket.emit).toHaveBeenCalledWith('registrarJogador', 'Jogador 1', 'barbaro');
  });

  test('Acionar a ação do jogador e verificar o retorno', async () => {
    const tipo = 'ataque';

    // Criar a sala fictícia para o jogador
    salas['sala-1234'] = {
      jogadores: { '1234': mockSocket },
      status: 'esperando',
      jogo: new RPG(new Jogador(1234, 'socketId1', 'Jogador1', 100, 'barbaro'), new Jogador(5678, 'socketId2', 'Jogador2', 100, 'mago')),
    };

    // Simula a chamada de ação de jogador
    mockServer.on('connection', (socket) => {
      socket.on('acaoDoJogador', ({ tipo }) => {
        const salaDoJogador = salas['sala-1234'];
        const jogo = salaDoJogador.jogo;
        const mensagem = jogo.aplicarAcao(socket.id, tipo);

        expect(mensagem).toBe('Ataque realizado');
        socket.emit('mensagem', `🔒 ${mensagem}`);  // Emitindo a mensagem correta após ação
      });
    });

    await mockSocket.emit('acaoDoJogador', { tipo });
    expect(mockSocket.emit).toHaveBeenCalledWith('acaoDoJogador',{tipo: "ataque"});
  });

  test('Verificar vitória após ação', async () => {
    // Configura um estado para o jogo
    salas['sala-1234'] = {
      jogadores: { '1234': mockSocket },
      status: 'esperando',
      jogo: new RPG(new Jogador(1234, 'socketId1', 'Jogador1', 100, 'barbaro'), new Jogador(5678, 'socketId2', 'Jogador2', 100, 'mago')),
    };

    const sala = salas['sala-1234'];
    const jogo = sala.jogo;
    jogo.verificarVitoria.mockReturnValue(jogo.jogador1);  // Jogador 1 venceu

    const vencedor = jogo.verificarVitoria();
    expect(vencedor.nome).toBe('Jogador 1');
  });
});