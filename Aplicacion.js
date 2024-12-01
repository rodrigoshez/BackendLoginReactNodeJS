const { Login, Audio } = require('./modelos.js');
const sequelize = require('./sequelize');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const puerto = 9999;
const upload = multer();
const uploadDir = 'AudiosCargados/';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Crear directorio si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Sincronizar base de datos
sequelize.sync({ force: false })
  .then(() => {
    console.log('Modelos sincronizados con la base de datos');
    app.listen(puerto, () => {
      console.log(`Servidor escuchando en el puerto ${puerto}`);
    });
  })
  .catch(error => {
    console.error('Error al sincronizar los modelos:', error);
  });

// Login de usuario
app.get('/', async (req, res) => {
  const { User: user, password } = req.query;

  try {
    await sequelize.authenticate();
    const usuario = await Login.findOne({
      where: { USERNAME: user, PASSWORD: password },
    });

    if (usuario) {
      res.status(200).json({ status: 'yes', tipo: usuario.TIPOUSUARIO });
    } else {
      res.status(404).json({ status: 'no', tipo: 'nodefinido' });
    }
  } catch (err) {
    console.error('Error al conectar o consultar la base de datos:', err);
    res.status(500).json({ status: 'error', message: 'Error al conectar o consultar la base de datos' });
  }
});

// Subir audio
app.post('/audios', upload.single('archivo'), async (req, res) => {
  try {
    const { nombreAudio } = req.body;
    if (!req.file || !nombreAudio) {
      return res.status(400).json({ error: 'Nombre del audio o archivo faltante' });
    }

    const { originalname, buffer } = req.file;
    const filePath = path.join(uploadDir, originalname);

    fs.writeFileSync(filePath, buffer);

    const nuevoAudio = await Audio.create({
      nombreAudio: nombreAudio,
      archivoMultimedia: filePath,
    });

    res.status(201).json({ message: 'Archivo guardado', id: nuevoAudio.id_audio });
  } catch (error) {
    console.error('Error al guardar el archivo:', error);
    res.status(500).json({ error: 'Error al guardar el archivo' });
  }
});

// Obtener audios
app.get('/audios', async (req, res) => {
  try {
    const audios = await Audio.findAll({
      attributes: ['id_audio', 'nombreAudio', 'archivoMultimedia'],
    });
    res.status(200).json(audios);
  } catch (error) {
    console.error('Error al obtener los audios:', error);
    res.status(500).json({ error: 'Error al obtener los audios' });
  }
});

// Obtener un audio específico
app.get('/audios/:audioId', async (req, res) => {
  const { audioId } = req.params;

  try {
    const audio = await Audio.findOne({ where: { id_audio: audioId } });

    if (audio) {
      const archivoMultimedia = path.basename(audio.archivoMultimedia);
      res.status(200).json({
        id_audio: audio.id_audio,
        nombreAudio: audio.nombreAudio,
        archivoMultimedia: archivoMultimedia,
      });
    } else {
      res.status(404).json({ error: 'Audio no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener el audio:', error);
    res.status(500).json({ error: 'Error al obtener el audio' });
  }
});

// Eliminar un audio
app.delete('/audios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const audio = await Audio.findOne({ where: { id_audio: id } });

    if (audio) {
      const filePath = path.join(uploadDir, path.basename(audio.archivoMultimedia));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await audio.destroy();
      res.status(200).json({ message: 'Audio eliminado correctamente' });
    } else {
      res.status(404).json({ error: 'Audio no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar el audio:', error);
    res.status(500).json({ error: 'Error al eliminar el audio' });
  }
});

//editar
app.put('/audios/:audioId', upload.single('archivoMultimedia'), async (req, res) => {
  const { audioId } = req.params;
  const { nombreAudio } = req.body;

  try {
    const audio = await Audio.findOne({ where: { id_audio: audioId } });

    if (!audio) {
      return res.status(404).json({ error: 'Audio no encontrado' });
    }

    if (req.file && req.file.buffer) {
      const { originalname, buffer } = req.file;
      const newFilePath = path.join(uploadDir, originalname);

    //para no sobrescribir xd
      let filePath = newFilePath;
      let counter = 1;
      while (fs.existsSync(filePath)) {
        const ext = path.extname(originalname);
        const baseName = path.basename(originalname, ext);
        filePath = path.join(uploadDir, `${baseName}(${counter})${ext}`);
        counter++;
      }

      try {

        if (audio.archivoMultimedia && fs.existsSync(audio.archivoMultimedia)) {
          fs.unlinkSync(audio.archivoMultimedia); // Elimina el archivo anterior
        }

        fs.writeFileSync(filePath, buffer);
        audio.archivoMultimedia = filePath;
        
      } catch (error) {
        console.error('Error al mover el archivo:', error);
        return res.status(500).json({ error: 'Error al mover el archivo multimedia' });
      }
    }

    if (nombreAudio) {
      audio.nombreAudio = nombreAudio;
    }
    await audio.save();

    res.status(200).json({
      message: 'Audio actualizado correctamente',
      id_audio: audio.id_audio,
      nombreAudio: audio.nombreAudio,
      archivoMultimedia: audio.archivoMultimedia ? path.basename(audio.archivoMultimedia) : null,
    });
  } catch (error) {
    console.error('Error al actualizar el audio:', error);
    res.status(500).json({ error: 'Error al actualizar el audio' });
  }
});
