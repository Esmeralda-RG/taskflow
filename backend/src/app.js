import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TaskFlow Backend corriendo correctamente',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: '¡Bienvenido a la API de TaskFlow!',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor TaskFlow corriendo en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
