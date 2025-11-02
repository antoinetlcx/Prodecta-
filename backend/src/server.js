import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';

// Charger les variables d'environnement
dotenv.config();

// Importer les routes
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // 10MB par défaut
  abortOnLimit: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/chat', chatRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Oulia Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🏡 Oulia Backend démarré !         ║
║                                       ║
║   Port: ${PORT}                          ║
║   Env:  ${process.env.NODE_ENV || 'development'}                ║
║                                       ║
║   API disponible sur:                 ║
║   http://localhost:${PORT}               ║
║                                       ║
╚═══════════════════════════════════════╝
  `);
});

export default app;
