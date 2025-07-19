const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Get environment variables directly
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Supabase database schema...')
    console.log('📍 Supabase URL:', supabaseUrl)
    
    // Test connection first
    console.log('🔗 Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1)
    
    if (testError && !testError.message.includes('relation "_supabase_migrations" does not exist')) {
      console.error('❌ Supabase connection failed:', testError.message)
      process.exit(1)
    }
    
    console.log('✅ Supabase connection successful')
    
    // Create tables manually using individual queries
    console.log('📝 Creating database tables...')
    
    // Create users table
    console.log('⚡ Creating users table...')
    const { error: usersError } = await supabase.rpc('exec_sql', {
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
    })
    
    if (usersError) {
      console.log('⚠️  Users table creation may have failed, trying direct approach...')
      // Try creating a test user to see if table exists
      const { error: testUserError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (testUserError && testUserError.message.includes('does not exist')) {
        console.error('❌ Users table does not exist and could not be created')
        console.error('Error:', usersError.message)
      } else {
        console.log('✅ Users table exists or was created successfully')
      }
    } else {
      console.log('✅ Users table created successfully')
    }
    
    // Test the setup by trying to create a test user
    console.log('\n🔍 Testing user creation...')
    
    const testUser = {
      username: 'test_setup_user',
      password: 'test123',
      email: 'test@example.com',
      referral_code: 'TEST1234'
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([testUser])
      .select()
    
    if (userError) {
      console.log('❌ Test user creation failed:', userError.message)
      console.log('This indicates the database tables may not be properly set up')
    } else {
      console.log('✅ Test user created successfully!')
      console.log('User ID:', userData[0].id)
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('username', 'test_setup_user')
      
      console.log('✅ Test user cleaned up')
    }
    
    console.log('\n🎉 Database setup verification completed!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()