import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'forderungsmanagement',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    // Invoices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(255) PRIMARY KEY,
        invoice_number VARCHAR(255) UNIQUE NOT NULL,
        customer_id VARCHAR(255) NOT NULL,
        customer_name VARCHAR(500) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        net_amount DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'EUR',
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        source VARCHAR(50) NOT NULL,
        source_id VARCHAR(255) NOT NULL,
        payment_date DATE,
        reminder_level INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(255) PRIMARY KEY,
        invoice_id VARCHAR(255) REFERENCES invoices(id),
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        reference VARCHAR(500),
        source VARCHAR(50) NOT NULL,
        source_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reminders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id VARCHAR(255) PRIMARY KEY,
        invoice_id VARCHAR(255) REFERENCES invoices(id),
        level INTEGER NOT NULL,
        sent_date DATE NOT NULL,
        due_date DATE NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        fee DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) NOT NULL,
        source VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;

