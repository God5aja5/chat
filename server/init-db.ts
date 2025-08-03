import { db } from './db';
import { sql } from 'drizzle-orm';

// Create tables for SQLite database
async function initializeDatabase() {
  try {
    console.log('Creating SQLite database tables...');
    
    // Create sessions table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      )
    `);
    
    await db.run(sql`CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire)`);
    
    // Create users table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        email TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create chats table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        model TEXT NOT NULL DEFAULT 'gpt-4o',
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create messages table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER DEFAULT (unixepoch()),
        tokens INTEGER,
        is_edited INTEGER DEFAULT 0
      )
    `);
    
    // Create files table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        uploaded_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create user_settings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        theme TEXT DEFAULT 'auto',
        default_model TEXT DEFAULT 'gpt-4o',
        default_image_model TEXT DEFAULT 'dall-e-3',
        temperature INTEGER DEFAULT 70,
        max_tokens INTEGER DEFAULT 2048,
        streaming_enabled INTEGER DEFAULT 1,
        code_rendering_enabled INTEGER DEFAULT 1,
        markdown_enabled INTEGER DEFAULT 1,
        prevent_code_overwrites INTEGER DEFAULT 1,
        show_line_annotations INTEGER DEFAULT 0,
        show_diff_viewer INTEGER DEFAULT 1,
        openai_api_key TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create artifacts table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        type TEXT NOT NULL,
        language TEXT,
        linked_artifact_id TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create plans table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        duration TEXT NOT NULL,
        features TEXT NOT NULL,
        chat_limit INTEGER,
        image_limit INTEGER,
        daily_limit INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create subscriptions table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id TEXT NOT NULL REFERENCES plans(id),
        status TEXT NOT NULL DEFAULT 'active',
        expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create redeem_codes table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS redeem_codes (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        code TEXT NOT NULL UNIQUE,
        plan_id TEXT NOT NULL REFERENCES plans(id),
        duration INTEGER NOT NULL,
        duration_type TEXT NOT NULL DEFAULT 'months',
        is_used INTEGER DEFAULT 0,
        used_by TEXT REFERENCES users(id),
        used_at INTEGER,
        created_at INTEGER DEFAULT (unixepoch()),
        expires_at INTEGER
      )
    `);
    
    // Create contact_messages table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        ticket_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general-inquiry',
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        admin_reply TEXT,
        user_id TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch()),
        replied_at INTEGER
      )
    `);
    
    // Create usage_tracking table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS usage_tracking (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 1,
        date INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create admin_users table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        last_login INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create model_capabilities table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS model_capabilities (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        model_name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        supports_text INTEGER DEFAULT 1,
        supports_image_input INTEGER DEFAULT 0,
        supports_audio_input INTEGER DEFAULT 0,
        supports_image_output INTEGER DEFAULT 0,
        supports_audio_output INTEGER DEFAULT 0,
        supports_web_search INTEGER DEFAULT 0,
        supports_file_upload INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    // Create database_backups table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS database_backups (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        backup_type TEXT NOT NULL DEFAULT 'full',
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    
    console.log('SQLite database tables created successfully!');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

export { initializeDatabase };