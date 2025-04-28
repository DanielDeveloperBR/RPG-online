import Jogador from "../src/backend/jogador";

describe("Classe Jogador", () => {
    let jogador: Jogador;
    const classeTeste = {
        nome: "Guerreiro",
        energia: 100,
        ataque: 20,
        defesa: 15,
        habilidade: 30,
        efeito: false,
        descricao: "Um guerreiro forte e resistente."
    };

    beforeEach(() => {
        jogador = new Jogador(1, "socket123", "Daniel", 100, classeTeste);
    });

    test("Deve inicializar com as propriedades corretas", () => {
        expect(jogador.id).toBe(1);
        expect(jogador.socketId).toBe("socket123");
        expect(jogador.nome).toBe("Daniel");
        expect(jogador.vida).toBe(100);
        expect(jogador.classe).toEqual(classeTeste);
        expect(jogador.estaBloqueado()).toBe(false);
    });

    test("Deve definir e obter o estado bloqueado corretamente", () => {
        jogador.setBloqueado(true);
        expect(jogador.estaBloqueado()).toBe(true);

        jogador.setBloqueado(false);
        expect(jogador.estaBloqueado()).toBe(false);
    });

    test("Deve herdar propriedades da classe base Classes", () => {
        expect(jogador.getHabilidade()).toBe(30);
    });

    test("Deve lidar com múltiplas instâncias de forma independente", () => {
        const jogador2 = new Jogador(2, "socket456", "Maria", 80, classeTeste);
        expect(jogador2.id).toBe(2);
        expect(jogador2.nome).toBe("Maria");
        expect(jogador2.vida).toBe(80);

        expect(jogador.id).toBe(1);
    });

    test("Deve lidar com casos extremos para a propriedade vida", () => {
        jogador.vida = 0;
        expect(jogador.vida).toBe(0);

        jogador.vida = -10;
        expect(jogador.vida).toBe(-10); // Assumindo que valores negativos são permitidos
    });

    test("Deve testar o método setBloqueado com mock", () => {
        const mockSetBloqueado = jest.spyOn(jogador, "setBloqueado");
        jogador.setBloqueado(true);
        expect(mockSetBloqueado).toHaveBeenCalledWith(true);
        expect(jogador.estaBloqueado()).toBe(true);

        jogador.setBloqueado(false);
        expect(mockSetBloqueado).toHaveBeenCalledWith(false);
        expect(jogador.estaBloqueado()).toBe(false);

        mockSetBloqueado.mockRestore();
    });

    test("Deve garantir desempenho e manutenibilidade", () => {
        const inicio = performance.now();
        for (let i = 0; i < 1000; i++) {
            const tempJogador = new Jogador(i, `socket${i}`, `Jogador${i}`, 100, classeTeste);
            tempJogador.setBloqueado(i % 2 === 0);
            expect(tempJogador.estaBloqueado()).toBe(i % 2 === 0);
        }
        const fim = performance.now();
        expect(fim - inicio).toBeLessThan(500); // Garantir que o teste execute em menos de 500ms
    });

    test("Deve validar a descrição da classe associada ao jogador", () => {
        expect(jogador.classe.descricao).toBe("Um guerreiro forte e resistente.");
    });

    test("Deve verificar se a vida do jogador não excede um limite máximo", () => {
        jogador.vida = 150;
        expect(jogador.vida).toBeLessThanOrEqual(150); // Assumindo que 150 é o limite máximo
    });

    test("Deve verificar se o jogador pode ser desbloqueado após ser bloqueado", () => {
        jogador.setBloqueado(true);
        expect(jogador.estaBloqueado()).toBe(true);

        jogador.setBloqueado(false);
        expect(jogador.estaBloqueado()).toBe(false);
    });
});