import  server from "./backend/server";
import "./backend/socket";
const PORT = process.env.PORT
server.listen(PORT,() => {
  console.log(`Servidor rodando na porta ${PORT}`);
});