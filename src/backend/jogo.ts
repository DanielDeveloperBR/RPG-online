import Jogador from "./jogador";
import { EventEmitter } from 'events';
class RPG extends EventEmitter {
  jogador1: Jogador;
  jogador2: Jogador;
  turno: string;
  jaAgiu: { [id: string]: boolean } = {}
  acoesPendentes: { [id: string]: string } = {};
  private tempoRestante: number = 60;
  private temporizador?: NodeJS.Timeout;
  private jogoEncerrado: boolean = false;
  constructor(j1: Jogador, j2: Jogador) {
    super()
    this.jogador1 = j1;
    this.jogador2 = j2;
    this.turno = j1.socketId;
    this.jaAgiu[j1.socketId] = false;
    this.jaAgiu[j2.socketId] = false
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

  reiniciar(id: string): void {
    const jogador = this.getJogador(id)
    const oponente = this.getOponente(id)
    jogador.vida = 100
    jogador.reiniciarEnergia()
    oponente.reiniciarEnergia()
    oponente.vida = 100
    this.turno = id
    this.removerContador()
    this.reiniciarContador()
  }

  aplicarAcao(socketId: string, acao: string): string {
    if (socketId !== this.turno) return 'Não é sua vez!';
    if (this.jaAgiu[socketId]) {
      this.acoesPendentes[socketId] = acao;
      return `Ação alterada para: ${acao}. Agora pule o turno para executar.`;
    }


    this.acoesPendentes[socketId] = acao;
    this.jaAgiu[socketId] = true;

    return `Ação escolhida: ${acao}. Agora pule o turno para executar.`;
  }

  pularTurno(id: string) {
    const vencedor = this.verificarVitoria();
    if (vencedor) return false;
    if (!this.jaAgiu[id]) {
      this.turno = this.getOponente(id).socketId;
      this.getOponente(id).setEnergia(20);
      this.iniciarTurno();
      return `${this.getJogador(id).nome} não fez nada. Turno perdido.`;
    }


    const acao = this.acoesPendentes[id];
    const atacante = this.getJogador(id);
    const defensor = this.getOponente(id);
    let mensagem = '';

    if (acao === 'atacar' && atacante.getEnergia() >= 30) {
      const dano = atacante.atacar()
      defensor.vida -= dano;
      atacante.setEnergia(-30);
      mensagem = `${atacante.nome} atacou causando ${dano} de dano!`;
    } else if (acao === 'defender' && atacante.getEnergia() >= 20) {
      atacante.getDefesa();
      atacante.setEnergia(-20);
      mensagem = `${atacante.nome} está se defendendo.`;
    } else if (acao === 'habilidade' && atacante.getEnergia() > 50) {
      if (atacante.getEfeito() === true) {
        atacante.setEnergia(-50);
        defensor.vida -= atacante.getHabilidade();
        atacante.setEfeito(false);
        mensagem = `${atacante.nome} usou a habilidade: ${atacante.getDescricao()} causando ${atacante.getHabilidade()} de dano!`;
      }
    } else {
      mensagem = `Ação inválida ou energia insuficiente.`;
    }

    this.turno = defensor.socketId;
    defensor.setEnergia(20);
    this.jaAgiu[id] = false;
    delete this.acoesPendentes[id];
    this.iniciarTurno();

    return mensagem;
  }
  removerContador(): void {
    clearInterval(this.temporizador);
    this.temporizador = undefined;
    this.tempoRestante = 60;
    this.jogoEncerrado = true;
    this.removeAllListeners();
  }
  

  reiniciarContador(): void {
    this.tempoRestante = 60
    this.jogoEncerrado = false
    this.iniciarTurno()
  }
  iniciarTurno() {
    if (this.jogoEncerrado) return;

    if (this.temporizador) clearInterval(this.temporizador);
    this.tempoRestante = 60;
    this.emit('tempo', this.tempoRestante);

    this.temporizador = setInterval(() => {
      this.tempoRestante--;
      this.emit('tempo', this.tempoRestante);

      if (this.tempoRestante <= 0) {
        clearInterval(this.temporizador);
        this.temporizador = undefined;

        if (this.jogoEncerrado) return; // <-- nova verificação

        const turnoAnterior = this.turno;
        const mensagem = this.pularTurno(turnoAnterior);

        this.emit('turnoPulado', {
          jogadorId: turnoAnterior,
          mensagem
        });

        this.iniciarTurno();
      }
    }, 1000);
  }
}

export { RPG }