interface classe {
    nome: string
    energia: number
    ataque: number
    efeito: boolean
    descricao: string
}

class Classes {
    classe: classe

    constructor(jogador: classe) {
        this.classe = jogador

    }

    getNome(): string {
        return this.classe.nome
    }

    getEnergia(): number {
        return this.classe.energia
    }

    getEfeito(): boolean {
        return this.classe.efeito
    }

    getDescricao(): string {
        return this.classe.descricao
    }

    static criarClasse(nome: string, energia: number, ataque: number, descricao: string): classe {
        return {
            nome,
            energia,
            ataque,
            efeito: false,
            descricao
        }
    }


}

export default Classes