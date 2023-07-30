import express from 'express';
import path from 'path';
import morgan from 'morgan';

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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
