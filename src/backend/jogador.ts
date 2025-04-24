import Classes from "./classes";

class Jogador extends Classes {
  id: number;
  socketId: string;
  nome: string;
  vida: number;
  bloqueado: boolean = false; 

  constructor(id: number, socketId: string, nome: string, vida: number, classeData: any) {
    super(classeData); 
    this.id = id;
    this.socketId = socketId;
    this.nome = nome;
    this.vida = vida;
  }
  setBloqueado(valor: boolean): void {
    this.bloqueado = valor;
  }

  estaBloqueado(): boolean {
    return this.bloqueado;
  }
  }
  
  export default Jogador