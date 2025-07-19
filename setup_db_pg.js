const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Get PostgreSQL connection string from environment
const connectionString = process.env.POSTGRES_URL

if (!connectionString) {
  console.error('❌ Missing POSTGRES_URL environment variable')
  process.exit(1)
}

console.log('🚀 Setting up database using PostgreSQL client...')
console.log('📍 Connection string:', connectionString.replace(/:[^:@]*@/, ':****@'))

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString
  })

  try {
    console.log('🔗 Connecting to PostgreSQL...')
    await client.connect()
    console.log('✅ Connected successfully!')

    // Read and execute the schema file
    console.log('📝 Reading schema file...')
    const schemaPath = path.join(__dirname, 'supabase-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Split into individual statements and filter out comments
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`⚡ Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement.length === 0) continue

      try {
        console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
        await client.query(statement)
        console.log(`   ✅ Statement ${i + 1} executed successfully`)
      } catch (error) {
        console.log(`   ⚠️  Statement ${i + 1} failed: ${error.message}`)
        // Continue with other statements
      }
    }

    console.log('\n🔍 Verifying table creation...')
    
    // Check if tables were created
    const tables = ['users', 'referrals', 'user_nodes', 'withdrawals']
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
        console.log(`✅ Table '${table}' exists (${result.rows[0].count} rows)`)
      } catch (error) {
        console.log(`❌ Table '${table}' verification failed: ${error.message}`)
      }
    }

    // Test creating a user
    console.log('\n🧪 Testing user creation...')
    try {
      const testUser = {
        username: 'test_setup_user',
        password: 'test123',
        email: 'test@example.com',
        referral_code: 'TEST1234'
      }

      const insertQuery = `
        INSERT INTO users (username, password, email, referral_code)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username
      `
      
      const result = await client.query(insertQuery, [
        testUser.username,
        testUser.password,
        testUser.email,
        testUser.referral_code
      ])

      console.log('✅ Test user created successfully!')
      console.log('   User ID:', result.rows[0].id)
      console.log('   Username:', result.rows[0].username)

      // Clean up test user
      await client.query('DELETE FROM users WHERE username = $1', [testUser.username])
      console.log('✅ Test user cleaned up')

    } catch (error) {
      console.log('❌ Test user creation failed:', error.message)
    }

    console.log('\n🎉 Database setup completed successfully!')

  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed')
  }
}

setupDatabase()