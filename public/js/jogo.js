
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

let acaoSelecionada = null;


const arena = document.querySelector('.arena')

const botoes = document.querySelector('.btns')

let classeEscolhida
let atributos

document.querySelectorAll('.selecionar').forEach(button => {
  button.addEventListener('click', (e) => {
    classeEscolhida = e.target.getAttribute('data-classe');
  });
});
// Entrada e seleção de classe
entrarBtn.addEventListener('click', (e) => {
  e.preventDefault()
  const classe = classeEscolhida
  nome = nomeInput.value.trim();
  if (nome !== '') socket.emit('registrarJogador', nome, classe);
})

socket.on('reinciarPartida', () => {
  resetarBotes()
})

socket.on('mostrarBotaoReiniciar', () => {
  btnReiniciar.style.display = 'inline-block';
});

socket.on('registrado', (jogador) => {
  jogador1Span.style.display = 'none'
  jogador2Span.style.display = 'none'
  botoes.style.display = 'none'
  meuId = jogador.socketId;
  painelEntrada.style.display = 'none';
  painelJogo.style.display = 'block';
  document.querySelector('.vs').style.animation = 'pulseSpin 1.6s ease-in-out infinite alternate';
  resetarBotes()
});

socket.on('erro', (msg) => {
  alert('Erro:', msg);
});

socket.on('turnoPulado', ({ mensagem }) => {
  adicionarLog(mensagem);
});

socket.on('estadoAtual', (estado) => {

  const meuJogador = estado.j1.socketId === meuId ? estado.j1 : estado.j2;
  btnHabilidade.style.animation = 'none'
  if (meuJogador.classe.efeito === true) {
    btnHabilidade.style.animation = 'habilidadePronta 600ms linear infinite'
  }
  adicionarLog(estado.mensagem)

  document.querySelector('.vs').style.animation = 'pulse 1s linear infinite';
  document.getElementById('contador').style.display = 'block'
  mensagemAguardar.textContent = '';
  btnReiniciar.style.display = 'none';
  jogador1Span.style.display = 'block'
  jogador2Span.style.display = 'block'
  jogador1Span.innerHTML = `<div><strong style="color: blue;">${estado.j1.nome}</strong><img class="classe-icon" src="./assets/avatar/${estado.j1.classe.nome}Avatar.png"><p>Vida: ${estado.j1.vida}</p>Energia: ${estado.j1.classe.energia}</div>`;
  jogador2Span.innerHTML = `<div><img class="classe-icon" src="./assets/avatar/${estado.j2.classe.nome}Avatar.png"><strong style="color: red;">${estado.j2.nome}</strong><p>Vida: ${estado.j2.vida}</p><p>Energia: ${estado.j2.classe.energia}</p></div>`;

  atributos = estado.j1.socketId === meuId ? estado.j1.classe : estado.j2.classe;

  if (estado.turno === null) { //Acabou o jogo
    botoes.style.display = 'none'

    document.getElementById('contador').style.display = 'none';
    statusTurno.textContent = '🏁 Fim de jogo!';
    return
  } else if (estado.turno === meuId) {
    if (meuJogador.classe.efeito === false) {
      btnHabilidade.classList.add('active')
      btnHabilidade.disabled = true
    }

    jogador1Span.style.display = 'block'
    jogador2Span.style.display = 'block'
    botoes.style.display = 'flex'
    statusTurno.textContent = `${meuJogador.nome} é a sua vez!`;

  } else {
    resetarBotes()
    acaoSelecionada = null
    botoes.style.display = 'none'
    statusTurno.textContent = 'Aguarde o oponente...';
  }
});

socket.on('estadoEnergia', ({ jogadorId, energiaAtual }) => {
  if (jogadorId === meuId){
    btnAtacar.disabled = energiaAtual < 30;
    btnDefender.disabled = energiaAtual < 20;
    btnHabilidade.disabled = energiaAtual <= 50;
  }
});

socket.on('energiaInsuficiente', ({ acao }) => {
  adicionarLog(`⚠️ Energia insuficiente para usar: ${acao.toUpperCase()}`);
});

socket.on('estadoHabilidade', (habilidadeDisponivel) => {
  if (btnHabilidade) {
    btnHabilidade.disabled = habilidadeDisponivel;
    btnHabilidade.classList.remove('active')
  }
});

socket.on('tempo', (contagem) => {
  document.getElementById('contador').textContent = `⏳ Tempo restante: ${contagem}s`;
});

socket.on('jogadorAtordoado', () => {
  btnAtacar.disabled = true
  btnDefender.disabled = true
  btnHabilidade.disabled = true
});

socket.on('mensagem', (msg) => {
  adicionarLog(msg);
});

function resetarBotes() {
  const botoesAcoes = [btnAtacar, btnDefender, btnHabilidade];
  botoesAcoes.forEach((btn) => {
    if (btn.classList.contains('active')){
      btn.disabled = false;
      btn.classList.remove('active')
    }
  });
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

function desativarOutrosBotoes(botaoClicado) {
  const botoesAcoes = [btnAtacar, btnDefender, btnHabilidade];

  return botoesAcoes.find((botao) => botao === botaoClicado ? acaoSelecionada = botao.id : acaoSelecionada = null)

}

function selecionarBotoes(botaoClicado) {
  const botoesAcoes = [btnAtacar, btnDefender, btnHabilidade];
  const jaEstavaAtivo = botaoClicado.classList.contains('active');

  botoesAcoes.forEach(btn => btn.classList.remove('active'));

  if (!jaEstavaAtivo) {
    botaoClicado.classList.add('active');
    acaoSelecionada = botaoClicado.value
  } else {
    acaoSelecionada = null; // Desmarcou
  }

  return !jaEstavaAtivo;
}

socket.on('resetarParaEntrada', () => {
  painelJogo.style.display = 'none';
  painelEntrada.style.display = 'block';
  nomeInput.value = '';
  log.innerHTML = '';
  statusTurno.textContent = '';
  mensagemAguardar.textContent = ''
  document.getElementById('contador').style.display = 'none'
  btnHabilidade.disabled = false
  btnAtacar.disabled = false
  btnDefender.disabled = false
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
  selecionarBotoes(btnAtacar)
  // if (botao) socket.emit('acaoDoJogador', { tipo: 'atacar' });
});

btnDefender.addEventListener('click', () => {
  selecionarBotoes(btnDefender)
  // if (botao) socket.emit('acaoDoJogador', { tipo: 'defender' });
});

btnHabilidade.addEventListener('click', () => {
  selecionarBotoes(btnHabilidade)
  // if (botao) socket.emit('acaoDoJogador', { tipo: 'habilidade' });
})

btnPularTurno.addEventListener('click', () => {
  if (acaoSelecionada) {
    socket.emit('acaoDoJogador', { tipo: acaoSelecionada })
    return socket.emit('pularTurno');
  }
  socket.emit('pularTurno');

});

btnReiniciar.addEventListener('click', () => {
  socket.emit('reiniciarPartida');
  btnReiniciar.style.display = 'none';
  btnHabilidade.disabled = false
  btnAtacar.disabled = false
  btnDefender.disabled = false
})