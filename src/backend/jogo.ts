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
    this.removerContador()
    this.turno = id
    const jogador = this.getJogador(id)
    const oponente = this.getOponente(id)
    jogador.setBloqueado(false)
    oponente.setBloqueado(false)
    jogador.efeitoTime = 2
    oponente.efeitoTime = 2
    oponente.setEfeito(true)
    jogador.setEfeito(true)
    jogador.vida = 200
    oponente.vida = 200
    jogador.reiniciarEnergia()
    oponente.reiniciarEnergia()
    this.reiniciarContador()
  }

  aplicarAcao(socketId: string, acao: string) {
    if (socketId !== this.turno) return 'Não é sua vez!';
    const jogador = this.getJogador(socketId);
    // if (this.acoesPendentes[socketId]) {
    //   return 'Você já escolheu uma ação neste turno!';
    // }
    if (jogador.estaBloqueado()) {
      return 'Você está atordoado e não pode agir neste turno!';
    }
    this.acoesPendentes[socketId] = acao;
    this.jaAgiu[socketId] = true;

    return `Ação escolhida: ${acao}. Agora pule o turno para executar.`;

  }

  pularTurno(id: string) {
    const vencedor = this.verificarVitoria();
    if (vencedor) return false;
    const atacante = this.getJogador(id);
    if (atacante.estaBloqueado() === true) {
      atacante.setBloqueado(false)

      // limpa ação e evita qualquer execução forçada via console
      delete this.acoesPendentes[id];
      this.jaAgiu[id] = false;

      // muda o turno normalmente
      this.turno = this.getOponente(id).socketId;
      this.getOponente(id).setEnergia(10); // benefício de turno passado
      this.iniciarTurno();

      return `${atacante.nome} está atordoado e perdeu o turno!`;
    }
    // if (!this.acoesPendentes[id]) {
    //   return 'Você não tem nenhuma ação registrada para este turno!';
    // }
    
    const acao = this.acoesPendentes[id];
    // if (acao === null || acao === undefined) {
    //   this.turno = this.getOponente(id).socketId;
    //   this.getOponente(id).setEnergia(20);
    //   return `${this.getJogador(id).nome} pulou o turno.`;
    // }
  
    if (!this.jaAgiu[id]) {
      this.turno = this.getOponente(id).socketId;
      this.getOponente(id).setEnergia(20);
      this.iniciarTurno();
      return `${this.getJogador(id).nome} não fez nada. Turno perdido.`;
    }

    if (atacante.efeitoTime === 2) {
      atacante.setEfeito(true)
    }

    const defensor = this.getOponente(id);
    let mensagem = '';

    if (acao === 'atacar' && atacante.getEnergia() >= 30) {
      let dano = atacante.atacar()
      if (defensor.estaDefendendo()) {
        const fatorRandomico = Math.random() * 100; // valor entre 0 e 100

        let porcentagemReducao = (defensor.getDefesa() + fatorRandomico) / 2; // média da defesa com o valor aleatório
        if (porcentagemReducao > 100) porcentagemReducao = 100;

        const danoReduzido = dano * (1 - porcentagemReducao / 100);
        dano = Math.floor(Math.max(0, danoReduzido))

        defensor.limparDefesa();
      }
      defensor.vida -= dano;
      atacante.setEnergia(-30);
      mensagem = `${atacante.nome} atacou causando ${dano} de dano!`;
    } else if (acao === 'defender' && atacante.getEnergia() >= 20) {
      atacante.defesaAtiva()
      atacante.setEnergia(-10);
      mensagem = `${atacante.nome} está se defendendo.`;
    } else if (acao === 'habilidade' && atacante.getEnergia() > 50) {
      if (atacante.getEfeito() === true) {
        atacante.setEnergia(-50);
        atacante.efeitoTime = 0
        atacante.setEfeito(false)

        const classe = atacante.classe.nome;
        switch (classe) {
          case 'barbaro':
            if (defensor.estaDefendendo() === true) {
              mensagem = `${defensor.nome} defendeu a habilidade!`;
              break
            }
            defensor.setBloqueado(true);
            defensor.vida -= atacante.classe.habilidade;
            mensagem = `${atacante.nome} usou Fúria: causou ${atacante.classe.habilidade} de dano e paralisou o inimigo!`;
            break;

          case 'mago':
            // Ignora defesa
            const danoMago = atacante.classe.habilidade;
            defensor.vida -= danoMago;
            mensagem = `${atacante.nome} lançou Bola de Fogo: causou ${danoMago} de dano ignorando a defesa!`;
            break;

          case 'arqueiro':
            // Ignora defesa e chance de crítico
            let danoArqueiro = atacante.classe.habilidade;
            const critico = Math.random() < 0.3; // 30% chance de crítico
            if (critico) {
              danoArqueiro *= 2;
              mensagem = `${atacante.nome} fez um Tiro Certeiro CRÍTICO! Causou ${danoArqueiro} de dano ignorando defesa!`;
            } else {
              mensagem = `${atacante.nome} fez um Tiro Certeiro: causou ${danoArqueiro} de dano ignorando defesa!`;
            }
            defensor.vida -= danoArqueiro;
            danoArqueiro = 50
            break;

          default:
            mensagem = `${atacante.nome} tentou usar uma habilidade desconhecida.`;
        }

        this.emit('efeitoAtualizado', {
          [atacante.socketId]: atacante.getEfeito()
        });


      }
    } else {
        // Impede a troca de turno se a energia for insuficiente
        this.emit('energiaInsuficiente', {
          jogadorId: atacante.socketId,
        energiaAtual: atacante.getEnergia(),
        acao: this.acoesPendentes[id]

      });
      this.jaAgiu[id] = false;
      delete this.acoesPendentes[id];
      
      return `Energia insuficiente para realizar a ação.`;
    }

    this.turno = defensor.socketId;
    this.jaAgiu[id] = false;
    delete this.acoesPendentes[id];

    atacante.efeitoTime++
    defensor.setEnergia(10);
    this.iniciarTurno();

    return mensagem;
  }

  removerContador(): void {
    clearInterval(this.temporizador);
    this.temporizador = undefined;
    this.tempoRestante = 60;
    this.jogoEncerrado = true;
  // const eventos = this.eventNames(); // Obtém todos os nomes de eventos registrados
  // eventos.forEach(evento => {
  //   if (evento !== 'efeitoAtualizado') {
  //     this.removeAllListeners(evento); 
  //   }
  //   // this.removeAllListeners();
  // })
  }

  reiniciarContador(): void {
    this.tempoRestante = 60
    this.jogoEncerrado = false
    // this.iniciarTurno()
  }

  iniciarTurno() {
    if (this.jogoEncerrado) return;
    const jogador = this.getJogador(this.turno);

    this.emit('estadoEnergia', {
      jogadorId: jogador.socketId,
      energiaAtual: jogador.getEnergia()
    });

    let mensagem = `${jogador.nome} estava atordoado e perdeu o turno!`;

    // Se está atordoado 1 turno
    if (jogador.estaBloqueado() === true) {
      this.emit('jogadorAtordoado', {
        jogadorId: jogador.socketId,
        duracao: 1
      });

      this.emit('turnoPulado', {
        jogadorId: jogador.socketId,
        mensagem
      });

      return;
    }

    // Iniciar time
    if (this.temporizador) clearInterval(this.temporizador);
    this.tempoRestante = 60;
    this.emit('tempo', this.tempoRestante);
    this.temporizador = setInterval(() => {
      this.tempoRestante--;
      this.emit('tempo', this.tempoRestante);

      if (this.tempoRestante <= 0) {
        clearInterval(this.temporizador);
        this.temporizador = undefined;

        if (this.jogoEncerrado) return;

        const turnoAnterior = this.turno;
        
        // const jogador = this.getJogador(turnoAnterior);
        // if (!this.jaAgiu[turnoAnterior]) {
        //   // Jogador perdeu o turno por inatividade
        //   mensagem = `${jogador.nome} não fez nada. Turno perdido por tempo.`;
        //   this.turno = this.getOponente(turnoAnterior).socketId;
        //   this.getOponente(turnoAnterior).setEnergia(10);
        //   this.jaAgiu[turnoAnterior] = false;
        //   delete this.acoesPendentes[turnoAnterior];
        // } else {
          //   // Jogador agiu, mas não pulou voluntariamente (então chamamos pularTurno)
          //   mensagem = this.pularTurno(turnoAnterior);
          // }
            mensagem = `${jogador.nome} não fez nada. Turno perdido por tempo.`;
            this.turno = this.getOponente(turnoAnterior).socketId;
            this.getOponente(turnoAnterior).setEnergia(10);
            this.jaAgiu[turnoAnterior] = false;
            delete this.acoesPendentes[turnoAnterior];
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