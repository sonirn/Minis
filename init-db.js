import { supabase } from '../lib/supabase.js'

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...')

    // Create users table
    const { error: usersError } = await supabase.sql(`
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
    `)
    
    if (usersError) {
      console.error('Error creating users table:', usersError)
    } else {
      console.log('Users table created successfully')
    }

    // Create referrals table
    const { error: referralsError } = await supabase.sql(`
      CREATE TABLE IF NOT EXISTS referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
        referral_code VARCHAR(20) NOT NULL,
        is_valid BOOLEAN DEFAULT FALSE,
        reward_paid BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    
    if (referralsError) {
      console.error('Error creating referrals table:', referralsError)
    } else {
      console.log('Referrals table created successfully')
    }

    // Create user_nodes table
    const { error: userNodesError } = await supabase.sql(`
      CREATE TABLE IF NOT EXISTS user_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        node_id VARCHAR(20) NOT NULL,
        transaction_hash VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'running',
        progress DECIMAL(5,2) DEFAULT 0.0,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        mining_amount DECIMAL(18,8) NOT NULL,
        daily_mining DECIMAL(18,8) NOT NULL,
        duration INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    
    if (userNodesError) {
      console.error('Error creating user_nodes table:', userNodesError)
    } else {
      console.log('User_nodes table created successfully')
    }

    // Create withdrawals table
    const { error: withdrawalsError } = await supabase.sql(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(18,8) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
    
    if (withdrawalsError) {
      console.error('Error creating withdrawals table:', withdrawalsError)
    } else {
      console.log('Withdrawals table created successfully')
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);',
      'CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);',
      'CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);',
      'CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_nodes_user_id ON user_nodes(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_user_nodes_status ON user_nodes(status);',
      'CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);'
    ]

    for (const indexSQL of indexes) {
      const { error } = await supabase.sql(indexSQL)
      if (error) {
        console.error('Error creating index:', error)
      }
    }

    console.log('Database initialization completed successfully!')

    // Test connection by fetching table list
    const { data: tables, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    if (testError) {
      console.error('Database test failed:', testError)
    } else {
      console.log('Database connection test successful!')
    }

  } catch (error) {
    console.error('Database initialization failed:', error)
  }
}

initializeDatabase()