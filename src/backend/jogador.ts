import Classes from "./classes";

class Jogador extends Classes {
  id: number;
  socketId: string;
  nome: string;
  vida: number;

  constructor(id: number, socketId: string, nome: string, vida: number, classeData: any) {
    super(classeData); 
    this.id = id;
    this.socketId = socketId;
    this.nome = nome;
    this.vida = vida;
  }
  }
  
  export default Jogador