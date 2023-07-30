import express from 'express';
import path from 'path';
import morgan from 'morgan';
import https from 'https';
import fs from 'fs';
import WebSocket from 'ws';

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan('combined'));
app.use((req, res, next) => {
  const fullPath = path.join(__dirname, req.path);
  console.log(`Full file system path: ${fullPath}`);
  next();
});

app.get('/bundle.js', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'bundle.js'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'keys', 'domain.key')),
  cert: fs.readFileSync(path.join(__dirname, 'keys', 'domain.crt'))
};

const server = https.createServer(httpsOptions, app);

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('Client connected');

    ws.on('message', message => {
      console.log(`Received: ${message}`);
      // Convert the message to a string
      const messageString = message.toString();
      // Broadcast the message to all other clients
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    });
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});
