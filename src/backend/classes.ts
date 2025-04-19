interface classe {
    nome: string
    energia: number
    ataque: number
    defesa: number;
    habilidade: number;
    efeito: boolean
    descricao: string
}

class Classes {
    classe: classe
    energia: number

    constructor(jogador: classe) {
        this.classe = jogador
        this.energia = jogador.energia

    }

    getNome(): string {
        return this.classe.nome
    }

    getEnergia(): number {
        return this.classe.energia
    }
    setEnergia(energia: number): number {
        this.classe.energia += energia
        return this.classe.energia;
      }

    getEfeito(): boolean {
        return this.classe.efeito
    }
    setEfeito(efeito: boolean): boolean{
        return this.classe.efeito = efeito
    }

    getDescricao(): string {
        return this.classe.descricao
    }
    atacar(): number {
        let ataque = this.getAtaque()
        const tipo = Math.floor(Math.random() * 3);
        if (tipo === 0) return ataque + Math.floor(Math.random() * 6);     // leve
        if (tipo === 1) return ataque + Math.floor(Math.random() * 11);   // médio
        return ataque + Math.floor(Math.random() * 16);                   // pesado
      }
    getAtaque():number{
        return this.classe.ataque
    }
    getDefesa():number{
        return this.classe.defesa
        
    }
    getHabilidade():number{
        return this.classe.habilidade

    }
    reiniciarEnergia():number{
        this.classe.energia = this.energia 
        return this.classe.energia
    }
    
    static criarClasse(nome: string, energia: number, ataque: number, defesa: number, habilidade: number, descricao: string): classe {
        return {
            nome,
            energia,
            ataque: ataque,
            defesa: defesa,
            habilidade: habilidade,
            efeito: true,
            descricao
        }
    }

}

export default Classes