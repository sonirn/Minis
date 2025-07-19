const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
  connectionString: process.env.POSTGRES_URL_NON_POOLING
})

async function initializeDatabase() {
  try {
    console.log('🔗 Connecting to Supabase PostgreSQL database...')
    await client.connect()
    console.log('✅ Connected successfully!')

    console.log('📝 Creating database tables...')

    // Create users table
    const usersTable = `
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
    
    await client.query(usersTable)
    console.log('✅ Users table created successfully')

    // Create referrals table
    const referralsTable = `
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
        referral_code VARCHAR(20) NOT NULL,
        is_valid BOOLEAN DEFAULT FALSE,
        reward_paid BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await client.query(referralsTable)
    console.log('✅ Referrals table created successfully')

    // Create user_nodes table
    const userNodesTable = `
      CREATE TABLE IF NOT EXISTS user_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        node_id VARCHAR(20) NOT NULL,
        transaction_hash VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'running',
        progress DECIMAL(5,2) DEFAULT 0.0,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        mining_amount DECIMAL(18,8) NOT NULL,
        daily_mining DECIMAL(18,8) NOT NULL,
        duration INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await client.query(userNodesTable)
    console.log('✅ User_nodes table created successfully')

    // Create withdrawals table
    const withdrawalsTable = `
      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(18,8) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await client.query(withdrawalsTable)
    console.log('✅ Withdrawals table created successfully')

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);',
      'CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);',
      'CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);',
      'CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_nodes_user_id ON user_nodes(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_nodes_status ON user_nodes(status);',
      'CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_nodes_transaction_hash ON user_nodes(transaction_hash);'
    ]

    console.log('📊 Creating database indexes...')
    for (const indexSQL of indexes) {
      await client.query(indexSQL)
    }
    console.log('✅ All indexes created successfully')

    // Create trigger function for updating updated_at timestamp
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `
    
    await client.query(triggerFunction)
    console.log('✅ Trigger function created successfully')

    // Create trigger for users table
    const usersTrigger = `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
          BEFORE UPDATE ON users 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `
    
    await client.query(usersTrigger)
    console.log('✅ Users table trigger created successfully')

    // Test database by running a simple query
    console.log('🧪 Testing database connection...')
    const testResult = await client.query('SELECT COUNT(*) as user_count FROM users;')
    console.log(`✅ Database test successful! Current users count: ${testResult.rows[0].user_count}`)

    console.log('\n🎉 Database initialization completed successfully!')
    console.log('📊 Tables created:')
    console.log('   - users (with signup bonus, referral system)')
    console.log('   - referrals (for tracking referral rewards)')
    console.log('   - user_nodes (for mining node management)')
    console.log('   - withdrawals (for withdrawal history)')
    console.log('   - All necessary indexes and triggers')

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

// Run the initialization
initializeDatabase()