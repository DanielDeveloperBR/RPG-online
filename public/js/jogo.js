const socket = io()

let meuId = '';
let nome = '';
const tooltip = document.getElementById('tooltip');
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
const btnPularTurno = document.getElementById('pularTurno');

const arena = document.querySelector('.arena')

const botoes = document.querySelector('.btns')

entrarBtn.onclick = () => {

  nome = nomeInput.value.trim();
  if (nome !== '') socket.emit('registrarJogador', nome);
};

socket.on('registrado', (jogador) => {
  jogador1Span.style.display = 'none'
  jogador2Span.style.display = 'none'
  botoes.style.display = 'none'
  meuId = jogador.socketId;
  painelEntrada.style.display = 'none';
  painelJogo.style.display = 'block';
  document.querySelector('.vs').style.animation = 'pulseSpin 1.6s ease-in-out infinite alternate';

});
socket.on('mostrarBotaoReiniciar', () => {
  btnReiniciar.style.display = 'inline-block';
});
socket.on('erro', (msg) => {
  console.log('Erro:', msg);
});
let atributos
socket.on('estadoAtual', (estado) => {
  document.getElementById('contador').style.display = 'block'
  document.querySelector('.vs').style.animation = 'pulse 1s linear infinite';
  mensagemAguardar.textContent = '';
  btnReiniciar.style.display = 'none';
  jogador1Span.innerHTML = `<div>Nome: <strong style="color: blue;">${estado.j1.nome}</strong><p>Vida: ${estado.j1.vida}</p>Energia: ${estado.j1.classe.energia}</div>`;
  jogador2Span.innerHTML = `<div>Nome: <strong style="color: red;">${estado.j2.nome}</strong><p>Vida: ${estado.j2.vida}</p><p>Energia: ${estado.j2.classe.energia}</p></div>`;
  console.log(estado.j1.classe)
  atributos = estado.j1.classe


  if (estado.turno === null) {
    botoes.style.display = 'none'
    document.getElementById('contador').style.display = 'none';
    statusTurno.textContent = '🏁 Fim de jogo!';
    return
  } else if (estado.turno === meuId) {
    jogador1Span.style.display = 'flex'
    jogador2Span.style.display = 'flex'
    botoes.style.display = 'flex'
    statusTurno.textContent = 'É sua vez!';
    adicionarLog(estado.mensagem);
  } else {
    botoes.style.display = 'none'
    resetarBotes()
    jogador1Span.style.display = 'none'
    jogador2Span.style.display = 'none'
    statusTurno.textContent = 'Aguarde o oponente...';
    adicionarLog(estado.mensagem);

  }
});

socket.on('tempo', (contagem) => {
  document.getElementById('contador').textContent = `⏳ Tempo restante: ${contagem}s`;
});

socket.on('turnoPulado', (msg) => {
  adicionarLog(msg)
})

socket.on('mensagem', (msg) => {
  adicionarLog(msg);
});

function adicionarLog(texto) {
  const p = document.createElement('p');
  p.textContent = texto;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}
socket.on('aguardando', (msg) => {
  mensagemAguardar.textContent = msg;
});
function desativarOutrosBotoes(botaoClicado) {
  const botoesAcoes = [btnAtacar, btnDefender, btnHabilidade];

  botoesAcoes.forEach((btn) => {
    btn.disabled = (btn === botaoClicado);
  });
}
function resetarBotes() {
  const botoesAcoes = [btnAtacar, btnDefender, btnHabilidade];

  botoesAcoes.forEach((btn) => {
    btn.disabled = false
  });
}

socket.on('resetarParaEntrada', () => {
  painelJogo.style.display = 'none';
  painelEntrada.style.display = 'block';
  nomeInput.value = '';
  log.innerHTML = '';
  statusTurno.textContent = '';
  mensagemAguardar.textContent = ''
  document.getElementById('contador').style.display = 'none'
});


function mostrarTooltip(texto, event, botao) {
  tooltip.innerHTML = texto.replace(/\n/g, '<br>');
  tooltip.style.display = 'block';

  const screenWidth = window.innerWidth;
  const smallScreen = screenWidth <= 500;
  const mediumScreen = screenWidth <= 900;

  if ((smallScreen || mediumScreen) && botao) {
    const rect = botao.getBoundingClientRect();
    const offset = smallScreen ? 8 : 18; // mais afastado em tablet
    const top = rect.bottom + window.scrollY + offset;
    const left = rect.left + window.scrollX;

    Object.assign(tooltip.style, {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: '90vw'
    });

    return;
  }

  const padding = 10;
  const { offsetWidth: w, offsetHeight: h } = tooltip;
  const { clientX: x, clientY: y } = event;

  let left = x + padding;
  let top = y + padding;

  if (left + w > screenWidth) left = screenWidth - w - padding;
  if (top + h > window.innerHeight) top = window.innerHeight - h - padding;

  Object.assign(tooltip.style, {
    position: 'absolute',
    top: `${top}px`,
    left: `${left}px`
  });
}


function esconderTooltip() {
  tooltip.style.display = 'none';
}

function configurarTooltip(botao, textoFunc) {
  botao.addEventListener('mouseenter', (e) => {
    mostrarTooltip(textoFunc(), e, botao);
  });

  botao.addEventListener('mouseleave', esconderTooltip);

  botao.addEventListener('touchstart', (e) => {
    mostrarTooltip(textoFunc(), e.touches[0], botao);
    setTimeout(esconderTooltip, 2500);
  });
}


configurarTooltip(btnAtacar, () =>
  `<div><p>Ataque: <strong style="color: blue;">${atributos.ataque} ~ ${atributos.ataque + 15}</strong></p><p>Após usar: <strong style="color: red;">${atributos.energia - 30}</strong></p></div>`
);

configurarTooltip(btnDefender, () =>
  `<div><p>Defesa: <strong style="color: blue;">${atributos.defesa}</strong></p><p>Após usar: <strong style="color: red;">${atributos.energia - 20}</strong></p></div>`
);

configurarTooltip(btnHabilidade, () =>
  `<div><p>Dano: <strong style="color: blue;">${atributos.habilidade}</strong></p><p>Após usar: <strong style="color: red;">${atributos.energia - 50}</strong></p><p class="descricao">Descrição: ${atributos.descricao}</p></div>`
);


btnAtacar.addEventListener('click', () => {

  desativarOutrosBotoes(btnAtacar)
  socket.emit('acaoDoJogador', { tipo: 'atacar' });
});

btnDefender.addEventListener('click', () => {
  desativarOutrosBotoes(btnDefender)

  socket.emit('acaoDoJogador', { tipo: 'defender' });
});

btnHabilidade.addEventListener('click', () => {
  desativarOutrosBotoes(btnHabilidade)
  socket.emit('acaoDoJogador', { tipo: 'habilidade' });
});

btnPularTurno.addEventListener('click', () => {
  socket.emit('pularTurno');
});
btnReiniciar.onclick = () => { socket.emit('reiniciarPartida'); btnReiniciar.style.display = 'none'; };