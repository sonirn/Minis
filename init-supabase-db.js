import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initializeDatabase() {
  try {
    console.log('🔗 Initializing Supabase database tables...')

    // Test connection first
    console.log('🧪 Testing Supabase connection...')
    const { data, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    if (testError && testError.code === '42P01') {
      console.log('📝 Tables do not exist. Creating them now...')
      
      // Create users table using raw SQL
      const { error: usersError } = await supabase.rpc('create_users_table', {
        sql_query: `
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
      })

      if (usersError) {
        console.error('❌ Error creating users table:', usersError)
        console.log('🔧 Attempting alternative approach...')
        
        // Try direct SQL execution
        const { error: sqlError } = await supabase
          .from('users')
          .select('*')
          .limit(1)

        if (sqlError) {
          console.log('✅ This confirms tables need to be created via Supabase dashboard SQL editor')
          console.log('📋 Please run the following SQL in your Supabase dashboard SQL editor:')
          console.log('')
          console.log('-- Users table')
          console.log(`CREATE TABLE IF NOT EXISTS users (
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
          );`)
          console.log('')
          console.log('-- Referrals table')
          console.log(`CREATE TABLE IF NOT EXISTS referrals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
            referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
            referral_code VARCHAR(20) NOT NULL,
            is_valid BOOLEAN DEFAULT FALSE,
            reward_paid BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`)
          console.log('')
          console.log('-- User nodes table')
          console.log(`CREATE TABLE IF NOT EXISTS user_nodes (
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
          );`)
          console.log('')
          console.log('-- Withdrawals table')
          console.log(`CREATE TABLE IF NOT EXISTS withdrawals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL,
            amount DECIMAL(18,8) NOT NULL,
            status VARCHAR(20) DEFAULT 'completed',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );`)
          console.log('')
          console.log('-- Indexes')
          console.log(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_user_nodes_user_id ON user_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nodes_status ON user_nodes(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nodes_transaction_hash ON user_nodes(transaction_hash);`)
          
          console.log('')
          console.log('🌐 Go to: https://vudlwgfzmyfebidprhik.supabase.co/project/vudlwgfzmyfebidprhik/sql/new')
          console.log('📋 Copy and paste the above SQL commands to create all tables')
          
          return false
        }
      }
    } else {
      console.log('✅ Database connection successful!')
      if (data !== null) {
        console.log(`📊 Current users count: ${data}`)
      }
    }

    console.log('🎉 Database initialization check completed!')
    return true

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message)
    return false
  }
}

// Export for use in other modules
export { initializeDatabase }

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().then((success) => {
    if (success) {
      console.log('✅ Database ready for use!')
    } else {
      console.log('⚠️  Manual database setup required')
    }
    process.exit(success ? 0 : 1)
  })
}