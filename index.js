require('dotenv').config();
const express = require('express');
const nodeMailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Configurar CORS
const allowedOrigins = [
  'https://alemmartransportes.com.br',
  'https://www.alemmartransportes.com.br'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origin not allowed by CORS'));
    }
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/enviar-email1', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 }
]), async (req, res) => {
  const { Nome, email, Telefone, mensagem } = req.body;
  const images = req.files;

  const EMAIL = process.env.EMAIL;
  const SENHA_APP = process.env.SENHA_APP;

  const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL,
      pass: SENHA_APP
    }
  });

  const htmlContent = `
    <p>Nome: ${Nome}</p>
    <p>Email: ${email}</p>
    <p>Telefone: ${Telefone}</p>
    <p>Mensagem: ${mensagem}</p>
  `;

  const responseHtml = `
    <html>
    <head><title>Sucesso</title></head>
    <body>
      <div>
        <h1>Email enviado com sucesso!</h1>
        <a href="https://alemmartransportes.com.br">Retornar ao site</a>
      </div>
    </body>
    </html>
  `;

  try {
    const attachments = [];

    if (images.image1) {
      attachments.push({
        filename: images.image1[0].originalname,
        content: images.image1[0].buffer
      });
    }

    if (images.image2) {
      attachments.push({
        filename: images.image2[0].originalname,
        content: images.image2[0].buffer
      });
    }

    const subject = `Cotação: ${Nome}`;
    const info = await transporter.sendMail({
      from: `Site Além Mar Transportes <${EMAIL}>`,
      to: 'comercial@alemmartransportes.com.br',
      subject,
      html: htmlContent,
      attachments
    });

    console.log('Message sent: %s', info.messageId);
    res.send(responseHtml);
  } catch (error) {
    console.error('Erro ao enviar o email:', error);
    res.status(500).send('Erro ao enviar o email.');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});