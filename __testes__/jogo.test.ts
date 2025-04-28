import {RPG} from '../src/backend/jogo';
import Jogador from '../src/backend/jogador';
import Classes from '../src/backend/classes';
const barbaro = Classes.criarClasse("barbaro", 80, 20, 50, 70, 'Fúria, Valor de ataque alto e paralisa o inimigo por 1 turno.',)
const mago = Classes.criarClasse("mago", 100, 10, 80, 60, 'Bola de Fogo: Dano em área e ignora defesa.',)
const arqueiro = Classes.criarClasse("arqueiro", 90, 15, 40, 50, 'Tiro Certeiro: Ataque preciso, chance de crítico e ignora defesa.',)
const jogador = new Jogador(1, 'socketId', 'nome', 200, barbaro);
describe('chamar os jogadores', () => {
    test('deve retornar os jogadores', ()=>{
        const jogador1 = new Jogador(1, 'socketId1', 'nome1', 200, barbaro);
        const jogador2 = new Jogador(2, 'socketId2', 'nome2', 200, mago);
        const rpg = new RPG(jogador1, jogador2);
        expect(rpg.getJogador(jogador1.socketId)).toBeTruthy()
        expect(rpg.getJogador(jogador2.socketId)).toBeTruthy()
    })
})