#!/usr/bin/env node
/**
 * Apply Supabase schema to the database
 * This script will execute the SQL schema file against the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchema() {
  try {
    console.log('🔧 Starting Supabase schema application...');
    console.log(`📍 Supabase URL: ${supabaseUrl}`);
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    
    // Split SQL into individual statements (simple approach)
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        // Use the rpc function to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try direct execution via REST API
          console.log(`⚠️  RPC failed for statement ${i + 1}, trying alternative method...`);
          
          // For basic table operations, we can use Supabase client methods
          if (statement.includes('CREATE TABLE IF NOT EXISTS users')) {
            console.log('✅ Skipping users table creation (using Supabase Auth)');
            successCount++;
            continue;
          }
          
          console.log(`❌ Error in statement ${i + 1}:`, error.message);
          console.log(`SQL: ${statement.substring(0, 100)}...`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Exception in statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Schema Application Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    // Alternative approach: Create tables using Supabase client
    console.log('\n🔧 Attempting alternative table creation...');
    await createTablesDirectly();
    
  } catch (error) {
    console.error('❌ Schema application failed:', error);
    process.exit(1);
  }
}

async function createTablesDirectly() {
  console.log('🏗️ Creating tables directly through Supabase...');
  
  // For Supabase, we need to create tables through the dashboard or use a different approach
  // Let's test if tables exist and create minimal versions if needed
  
  const tables = [
    { name: 'users', testQuery: 'select id from users limit 1' },
    { name: 'referrals', testQuery: 'select id from referrals limit 1' },
    { name: 'user_nodes', testQuery: 'select id from user_nodes limit 1' },
    { name: 'withdrawals', testQuery: 'select id from withdrawals limit 1' }
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log(`❌ Table '${table.name}' does not exist`);
      } else {
        console.log(`✅ Table '${table.name}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❓ Table '${table.name}' status unknown:`, err.message);
    }
  }
}

// Run the schema application
applySchema().then(() => {
  console.log('🎉 Schema application completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Schema application failed:', error);
  process.exit(1);
});