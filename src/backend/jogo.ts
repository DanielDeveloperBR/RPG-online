import Jogador from "./jogador";

  class RPG {
    jogador1: Jogador;
    jogador2: Jogador;
    turno: string;
  
    constructor(j1: Jogador, j2: Jogador) {
      this.jogador1 = j1;
      this.jogador2 = j2;
      this.turno = j1.socketId;
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
    reiniciar(id: string): void {
      const jogador = this.getJogador(id)
      const oponente = this.getOponente(id)
      jogador.vida = 100
      oponente.vida = 100
      jogador.habilidadeUsada = false
      oponente.habilidadeUsada = false
      this.turno = id
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

  export {RPG}