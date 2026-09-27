import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Health check API endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Dana Portfolio Full-Stack Application',
    owner: 'Dana',
    school: 'Happy Chandara School',
    location: 'Cambodia',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Full-stack profile info API
app.get('/api/profile', (req: Request, res: Response) => {
  res.json({
    name: 'Dana',
    role: 'High School Developer & Founder',
    school: 'Happy Chandara School',
    country: 'Cambodia',
    venture: 'Digital Store Cambodia',
    specialties: ['Frontend & Web Applications', 'Telegram Bots', 'Cybersecurity', 'Cloud Databases'],
  });
});

// Endpoint to permanently save profile avatar into project public assets
app.post('/api/save-avatar', async (req: Request, res: Response) => {
  try {
    const { dataUrl } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'dataUrl string is required' });
    }

    const publicDir = path.resolve(__dirname, 'public');
    const distDir = path.resolve(__dirname, 'dist');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.trim().startsWith('<svg')) {
      const svgContent = dataUrl.startsWith('data:image/svg+xml')
        ? decodeURIComponent(dataUrl.split(',')[1])
        : dataUrl;
      fs.writeFileSync(path.join(publicDir, 'default-avatar.svg'), svgContent, 'utf-8');
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, 'default-avatar.svg'), svgContent, 'utf-8');
      }
      return res.json({ success: true, url: '/default-avatar.svg' });
    } else {
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(path.join(publicDir, 'custom-avatar.png'), buffer);
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, 'custom-avatar.png'), buffer);
      }
      return res.json({ success: true, url: '/custom-avatar.png' });
    }
  } catch (error: any) {
    console.error('Failed to save avatar asset:', error);
    res.status(500).json({ error: error.message || 'Failed to save avatar' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
