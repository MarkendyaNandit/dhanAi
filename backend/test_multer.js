import express from 'express';
import multer from 'multer';

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

const upload = multer({ limits: { fileSize: 10 } });

app.post('/upload', upload.single('file'), (req, res) => {
  res.send('OK');
});

app.listen(5002, () => console.log('Listening on 5002'));
