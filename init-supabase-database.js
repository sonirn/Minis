#!/usr/bin/env node
/**
 * Automated Supabase Database Setup Script
 * This script will create all required tables for the TRX Mining Platform
 */

const { Client } = require('pg');
require('dotenv').config();

// Database connection configuration
const connectionConfig = {
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('🚀 Starting automated Supabase database setup...');
console.log('🔗 Connection string:', connectionConfig.connectionString ? 'Found' : 'Missing');

async function setupDatabase() {
  const client = new Client(connectionConfig);
  
  try {
    console.log('📡 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Database connection established');
    
    // Create tables
    await createTables(client);
    
    // Insert default mining nodes data
    await insertMiningNodes(client);
    
    // Verify tables
    await verifyTables(client);
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

async function createTables(client) {
  console.log('🏗️ Creating database tables...');
  
  const tableDefinitions = [
    {
      name: 'users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          mine_balance DECIMAL(18,8) DEFAULT 25.0,
          referral_balance DECIMAL(18,8) DEFAULT 0.0,
          total_referrals INTEGER DEFAULT 0,
          valid_referrals INTEGER DEFAULT 0,
          referral_code VARCHAR(20) UNIQUE NOT NULL,
          has_active_mining BOOLEAN DEFAULT FALSE,
          has_bought_node4 BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'referrals',
      sql: `
        CREATE TABLE IF NOT EXISTS referrals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
          referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
          referral_code VARCHAR(20) NOT NULL,
          is_valid BOOLEAN DEFAULT FALSE,
          reward_paid BOOLEAN DEFAULT FALSE,
          reward_amount DECIMAL(10,2) DEFAULT 50.0,
          activated_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT no_self_referral CHECK (referrer_id != referred_id),
          CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
        );
      `
    },
    {
      name: 'user_nodes',
      sql: `
        CREATE TABLE IF NOT EXISTS user_nodes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          node_id VARCHAR(20) NOT NULL,
          transaction_hash VARCHAR(255) UNIQUE NOT NULL,
          transaction_verified BOOLEAN DEFAULT FALSE,
          transaction_amount DECIMAL(10,2) NOT NULL,
          transaction_verified_at TIMESTAMP WITH TIME ZONE,
          status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'cancelled')),
          progress DECIMAL(5,2) DEFAULT 0.0 CHECK (progress >= 0 AND progress <= 100),
          start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          end_date TIMESTAMP WITH TIME ZONE NOT NULL,
          mining_amount DECIMAL(18,8) NOT NULL,
          daily_mining DECIMAL(18,8) NOT NULL,
          duration INTEGER NOT NULL,
          total_mined DECIMAL(18,8) DEFAULT 0.0,
          last_mining_update TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT valid_dates CHECK (end_date > start_date),
          CONSTRAINT valid_mining_amounts CHECK (daily_mining > 0 AND mining_amount > 0)
        );
      `
    },
    {
      name: 'withdrawals',
      sql: `
        CREATE TABLE IF NOT EXISTS withdrawals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL CHECK (type IN ('mine', 'referral')),
          amount DECIMAL(18,8) NOT NULL,
          status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
          transaction_hash VARCHAR(128),
          processing_fee DECIMAL(10,6) DEFAULT 0.0,
          net_amount DECIMAL(15,6),
          processed_at TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'mining_nodes',
      sql: `
        CREATE TABLE IF NOT EXISTS mining_nodes (
          id VARCHAR(20) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price DECIMAL(10,2) NOT NULL CHECK (price > 0),
          storage VARCHAR(20) NOT NULL,
          mining_amount DECIMAL(10,2) NOT NULL CHECK (mining_amount > 0),
          duration_days INTEGER NOT NULL CHECK (duration_days > 0),
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ];
  
  for (const table of tableDefinitions) {
    try {
      console.log(`📋 Creating table: ${table.name}`);
      await client.query(table.sql);
      console.log(`✅ Table '${table.name}' created successfully`);
    } catch (error) {
      console.error(`❌ Failed to create table '${table.name}':`, error.message);
      throw error;
    }
  }
  
  // Create indexes
  await createIndexes(client);
  
  // Create triggers
  await createTriggers(client);
}

async function createIndexes(client) {
  console.log('📇 Creating performance indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
    'CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)',
    'CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id)',
    'CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_nodes_user_id ON user_nodes(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_nodes_status ON user_nodes(status)',
    'CREATE INDEX IF NOT EXISTS idx_user_nodes_transaction_hash ON user_nodes(transaction_hash)',
    'CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status)'
  ];
  
  for (const indexSql of indexes) {
    try {
      await client.query(indexSql);
    } catch (error) {
      console.log(`⚠️ Index creation warning:`, error.message.substring(0, 100));
    }
  }
  
  console.log('✅ Indexes created successfully');
}

async function createTriggers(client) {
  console.log('⚙️ Creating database triggers...');
  
  try {
    // Create trigger function for updating timestamps
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create triggers for each table
    const triggerTables = ['users', 'referrals', 'user_nodes', 'withdrawals', 'mining_nodes'];
    
    for (const tableName of triggerTables) {
      await client.query(`
        DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};
        CREATE TRIGGER update_${tableName}_updated_at
            BEFORE UPDATE ON ${tableName}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `);
    }
    
    console.log('✅ Triggers created successfully');
    
  } catch (error) {
    console.log('⚠️ Trigger creation warning:', error.message);
  }
}

async function insertMiningNodes(client) {
  console.log('⛏️ Inserting mining nodes data...');
  
  const miningNodes = [
    {
      id: 'node1',
      name: '64 GB Node',
      price: 50,
      storage: '64 GB',
      mining_amount: 500,
      duration_days: 30,
      description: 'Mine 500 TRX in 30 days'
    },
    {
      id: 'node2',
      name: '128 GB Node',
      price: 75,
      storage: '128 GB',
      mining_amount: 500,
      duration_days: 15,
      description: 'Mine 500 TRX in 15 days'
    },
    {
      id: 'node3',
      name: '256 GB Node',
      price: 100,
      storage: '256 GB',
      mining_amount: 1000,
      duration_days: 7,
      description: 'Mine 1000 TRX in 7 days'
    },
    {
      id: 'node4',
      name: '1024 GB Node',
      price: 250,
      storage: '1024 GB',
      mining_amount: 1000,
      duration_days: 3,
      description: 'Mine 1000 TRX in 3 days'
    }
  ];
  
  for (const node of miningNodes) {
    try {
      await client.query(`
        INSERT INTO mining_nodes (id, name, price, storage, mining_amount, duration_days, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          storage = EXCLUDED.storage,
          mining_amount = EXCLUDED.mining_amount,
          duration_days = EXCLUDED.duration_days,
          description = EXCLUDED.description,
          updated_at = NOW()
      `, [node.id, node.name, node.price, node.storage, node.mining_amount, node.duration_days, node.description]);
      
      console.log(`✅ Mining node '${node.name}' inserted/updated`);
    } catch (error) {
      console.error(`❌ Failed to insert mining node '${node.name}':`, error.message);
    }
  }
}

async function verifyTables(client) {
  console.log('🔍 Verifying table creation...');
  
  const tables = ['users', 'referrals', 'user_nodes', 'withdrawals', 'mining_nodes'];
  
  for (const tableName of tables) {
    try {
      const result = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, [tableName]);
      
      if (result.rows[0].count === '1') {
        console.log(`✅ Table '${tableName}' exists`);
        
        // Check if table has data (for mining_nodes)
        if (tableName === 'mining_nodes') {
          const dataResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`   └── Contains ${dataResult.rows[0].count} records`);
        }
      } else {
        console.log(`❌ Table '${tableName}' does not exist`);
      }
    } catch (error) {
      console.error(`❌ Error verifying table '${tableName}':`, error.message);
    }
  }
}

// Execute the setup
setupDatabase()
  .then(() => {
    console.log('\n🎉 Database setup completed successfully!');
    console.log('🔄 Please restart your Next.js application to use the new database schema.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database setup failed:', error);
    process.exit(1);
  });