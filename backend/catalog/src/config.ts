import dotenv from 'dotenv';
import path from 'path';

// Load environment variables with explicit path resolution
dotenv.config({ path: path.join(__dirname, '../.env') });

// Environment variable configuration with validation
export const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'gitpod',
    password: process.env.DB_PASSWORD || 'gitpod',
    name: process.env.DB_NAME || 'gitpodflix',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('💡 Ensure .env file exists in backend/catalog/ or set environment variables directly');
  process.exit(1);
}

console.log('✅ Environment configuration loaded successfully');
console.log(`📊 Database: ${config.database.user}@${config.database.host}:${config.database.port}/${config.database.name}`);
console.log(`🚀 Server will run on port: ${config.server.port}`);
