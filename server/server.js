const express = require('express');
const app = express();
const PORT = 8080;
const cors = require('cors');
const logger = require('progress-estimator')();
const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // Middleware para analizar el cuerpo de la solicitud como JSON

function generateRandomFilename(length) {
  const randomString = crypto.randomBytes(length).toString('hex');
  return `${randomString}.mp4`; // Puedes ajustar la extensión según tu necesidad
}

async function downloadVideo(url) {
  try {
    const randomFilename = generateRandomFilename(12); // Genera un nombre de archivo aleatorio
    const infoVideo = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:googlebot']
    });

    await youtubedl.exec(url, { loadInfoJson: infoVideo, output: randomFilename, format:'bestvideo' });

    await logger(infoVideo, `Obtaining ${url}`);
    console.log('Video download completed.');
    return randomFilename; // Devuelve el nombre del archivo descargado
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error; // Propagamos el error
  }
}

app.post('/download-video', async (req, res) => {
  const { videoUrl } = req.body; // Obtenemos la URL del video del cuerpo de la solicitud

  try {
    const output = await downloadVideo(videoUrl); // Obtenemos el nombre del archivo descargado
    const file = path.resolve(output);

    // Configura los encabezados para la descarga del archivo
    res.setHeader('Content-disposition', `attachment; filename=${output}`);
    res.setHeader('Content-type', 'video/mp4'); // Ajusta el tipo MIME según el tipo de archivo

    // Transmite el archivo al cliente para la descarga
    const fileStream = fs.createReadStream(file);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Error starting video download' });
  }
});

app.get('/api/home', (req, res) => {
  res.json({ message: 'Hello world' });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
