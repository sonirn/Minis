const { createClient } = require('@supabase/supabase-js')

// Get environment variables directly
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔗 Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    console.log('🧪 Testing basic connection...')
    
    // Try to list tables using information_schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (error) {
      console.log('❌ Error accessing information_schema:', error.message)
      
      // Try a different approach - test with a simple query
      console.log('🔄 Trying alternative connection test...')
      
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
      
      if (testError) {
        console.log('📋 Users table error:', testError.message)
        console.log('📋 Error code:', testError.code)
        console.log('📋 Error details:', testError.details)
        
        if (testError.message.includes('does not exist')) {
          console.log('✅ Connection working, but users table does not exist')
          console.log('🛠️  Need to create database tables')
        }
      } else {
        console.log('✅ Users table exists and accessible')
        console.log('📊 Sample data:', testData)
      }
    } else {
      console.log('✅ Connection successful!')
      console.log('📋 Available tables:', data.map(t => t.table_name))
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
  }
}

testConnection()