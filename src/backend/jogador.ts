interface Jogador {
    id: number;
    socketId: string;
    nome: string;
    vida: number;
    ataque: number;
    defesa: number;
    habilidadeUsada: boolean;
  }
  
  export default Jogador