import { app } from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

// Only start server listener if running locally (not inside Vercel Serverless)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server API berjalan di http://localhost:${PORT}`);
  });
}

// Export Express app for Vercel Serverless Function
export default app;
