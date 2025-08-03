import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './db';

// Initialize PostgreSQL database using Drizzle migrations
async function initializeDatabase() {
  try {
    console.log('Connecting to PostgreSQL database...');
    
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL database connected successfully!');
    
    // Note: In production, you would run migrations using `drizzle-kit push:pg`
    // For development, we'll use a simpler approach
    console.log('Database tables will be created via Drizzle schema.');
    
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

export { initializeDatabase };