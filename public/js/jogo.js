const socket = io()

let meuId = '';
let nome = '';

const nomeInput = document.getElementById('nome');
const entrarBtn = document.getElementById('entrarBtn');
const painelEntrada = document.getElementById('painelEntrada');
const painelJogo = document.getElementById('painelJogo');
const jogador1Span = document.getElementById('jogador1');
const jogador2Span = document.getElementById('jogador2');
const statusTurno = document.getElementById('statusTurno');
const log = document.getElementById('log');
const btnReiniciar = document.getElementById('btnReiniciar');
const mensagemAguardar = document.getElementById('msgAguardar')

const btnAtacar = document.getElementById('btnAtacar');
const btnDefender = document.getElementById('btnDefender');
const btnHabilidade = document.getElementById('btnHabilidade');

const botoes = document.querySelector('.btns')

entrarBtn.onclick = () => {

  nome = nomeInput.value.trim();
  if (nome !== '') socket.emit('registrarJogador', nome);
};

socket.on('registrado', (jogador) => {
  botoes.style.display = 'none'
  console.log('Registrado com sucesso:', jogador);
  meuId = jogador.socketId;
  painelEntrada.style.display = 'none';
  painelJogo.style.display = 'block';
});
socket.on('mostrarBotaoReiniciar', () => {
  btnReiniciar.style.display = 'inline-block';
});
socket.on('erro', (msg) => {
  console.log('Erro:', msg);
});

socket.on('estadoAtual', (estado) => {
  mensagemAguardar.textContent = '';
  btnReiniciar.style.display = 'none';
  jogador1Span.textContent = `${estado.j1.nome} - Vida: ${estado.j1.vida}`;
  jogador2Span.textContent = `${estado.j2.nome} - Vida: ${estado.j2.vida}`;
  adicionarLog(estado.mensagem);

  if (estado.turno === null) {
    statusTurno.textContent = '🏁 Fim de jogo!';
    habilitarBotoes(false);
  } else if (estado.turno === meuId) {
    botoes.style.display = 'flex'
    statusTurno.textContent = 'É sua vez!';
    habilitarBotoes(true);
  } else {
    statusTurno.textContent = 'Aguarde o oponente...';
    habilitarBotoes(false);
  }
});

socket.on('mensagem', (msg) => {
  adicionarLog(msg);
  habilitarBotoes(false);
});

socket.on('erro', (msg) => {
  alert(msg);
});


function habilitarBotoes(ativo) {
  btnAtacar.disabled = !ativo;
  btnDefender.disabled = !ativo;
  btnHabilidade.disabled = !ativo;
}

function adicionarLog(texto) {
  const p = document.createElement('p');
  p.textContent = texto;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}
socket.on('aguardando', (msg) => {
  mensagemAguardar.textContent = msg;
});

socket.on('resetarParaEntrada', () => {
  painelJogo.style.display = 'none';
  painelEntrada.style.display = 'block';
  nomeInput.value = '';
  log.innerHTML = '';
  statusTurno.textContent = '';
  mensagemAguardar.textContent = ''
});

btnAtacar.onclick = () => socket.emit('acaoDoJogador', { tipo: 'atacar' });
btnDefender.onclick = () => socket.emit('acaoDoJogador', { tipo: 'defender' });
btnHabilidade.onclick = () => socket.emit('acaoDoJogador', { tipo: 'habilidade' });
btnReiniciar.onclick = () => { socket.emit('reiniciarPartida'); btnReiniciar.style.display = 'none'; };