import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import dotenv from 'dotenv';
import compression from 'compression';

dotenv.config();

const app = express();
app.use(helmet());
app.use(compression());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, '../../public')));

// CORS com origem controlada
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  methods: ['GET', 'POST'],
}))

const server = http.createServer(app);

app.get("/ping", (req, res) => {
  res.send('pong');
});

export default server;