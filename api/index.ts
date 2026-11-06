import { app } from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

// If running directly in local dev environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server API berjalan di http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless Function
export default app;
