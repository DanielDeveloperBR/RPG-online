import { expect, jest, test } from '@jest/globals';
import Classes from '../src/backend/classes'

const classe1 = {
    nome: "teste",
    energia: 100,
    ataque: 10,
    defesa: 10,
    habilidade: 10,
    efeito: false,
    descricao: "teste 1"
}

function cadastrarClasse(classe: any): any {
    return {
        nome: classe.nome,
        energia: classe.energia,
        ataque: classe.ataque,
        defesa: classe.defesa,
        habilidade: classe.habilidade,
        efeito: classe.efeito,
        descricao: classe.descricao
    }
}
const teste = new Classes(classe1)
test('Testando métodos da classe Classes', () => {
    // Testando o método getNome
    expect(teste.getNome()).toBe("teste");

    // Testando o método getEnergia
    expect(teste.getEnergia()).toBe(100);

    // Testando o método setEnergia
    teste.setEnergia(-20);
    expect(teste.getEnergia()).toBe(80);
    teste.setEnergia(50);
    expect(teste.getEnergia()).toBe(100); // Não pode ultrapassar maxEnergia

    // Testando o método getEfeito e setEfeito
    expect(teste.getEfeito()).toBe(false);
    teste.setEfeito(true);
    expect(teste.getEfeito()).toBe(true);

    // Testando o método getDescricao
    expect(teste.getDescricao()).toBe("teste 1");

    // Testando o método atacar
    const ataque = teste.atacar();
    expect(ataque).toBeGreaterThanOrEqual(10); // Ataque base
    expect(ataque).toBeLessThanOrEqual(26); // Ataque máximo com ataque pesado

    // Testando o método estaDefendendo
    expect(teste.estaDefendendo()).toBe(false);
    teste.defesaAtiva();
    expect(teste.estaDefendendo()).toBe(true);
    teste.limparDefesa();
    expect(teste.estaDefendendo()).toBe(false);

    // Testando o método reiniciarEnergia
    teste.setEnergia(-50);
    expect(teste.getEnergia()).toBe(50);
    teste.reiniciarEnergia();
    expect(teste.getEnergia()).toBe(100);
});

test('Testando criação de classe estática', () => {
    const novaClasse = Classes.criarClasse(
        "novaClasse",
        120,
        15,
        12,
        8,
        "Descrição da nova classe"
    );

    expect(novaClasse.nome).toBe("novaClasse");
    expect(novaClasse.energia).toBe(120);
    expect(novaClasse.ataque).toBe(15);
    expect(novaClasse.defesa).toBe(12);
    expect(novaClasse.habilidade).toBe(8);
    expect(novaClasse.efeito).toBe(true);
    expect(novaClasse.descricao).toBe("Descrição da nova classe");
});