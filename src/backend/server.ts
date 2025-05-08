import express from 'express';
import http from 'node:http';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import dotenv from 'dotenv';
import compression from 'compression';

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(helmet());
app.use(compression());
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.json()); 
app.disable('x-powered-by')
app.use(express.urlencoded({ extended: true }));
// CORS com origem controlada
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  methods: ['GET', 'POST'],
}))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.get("/ping", (req, res) => {
  res.send('pong');
});

export default server;