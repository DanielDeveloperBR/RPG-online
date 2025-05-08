  const totalSalas = 50;
  const container = document.getElementById("grade-salas");

  for (let i = 1; i <= totalSalas; i++) {
    const sala = document.createElement("button");
    sala.textContent = `Sala ${i}`;
    sala.className = 'sala-btn';
    sala.disabled = true; // será liberada via socket
    sala.dataset.nome = `sala-${i}`;
    container.appendChild(sala);
  }

  const socket = io();

  socket.on("salasAtuais", (salas) => {
    document.querySelectorAll(".sala-btn").forEach(btn => {
      btn.disabled = !salas.includes(btn.dataset.nome);
    });
  });

  // Ao clicar na sala
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("sala-btn") && !e.target.disabled) {
      const sala = e.target.dataset.nome;
      socket.emit("entrarSala", sala);
    }
  });