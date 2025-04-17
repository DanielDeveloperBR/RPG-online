import  server from "./backend/server";
import "./backend/socket";
const PORT = parseInt(process.env.PORT || "3000", 10);
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
