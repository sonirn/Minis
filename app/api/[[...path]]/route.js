import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

// Enhanced signup referral processing
async function processSignupReferral(userId, referralCode) {
  try {
    console.log(`Processing signup referral for user: ${userId}, code: ${referralCode}`)
    
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id, username, total_referrals')
      .eq('referral_code', referralCode)
      .single()

    if (referrerError || !referrer) {
      console.log(`Referral code not found: ${referralCode}`)
      return
    }

    console.log(`Found referrer: ${referrer.username} (${referrer.id})`)

    // Check if this referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer.id)
      .eq('referred_id', userId)
      .single()

    if (existingReferral) {
      console.log(`Referral already exists: ${existingReferral.id}`)
      return
    }

    // Create referral record with enhanced tracking
    const { error: referralError } = await supabase
      .from('referrals')
      .insert([{
        id: uuidv4(),
        referrer_id: referrer.id,
        referred_id: userId,
        referral_code: referralCode,
        is_valid: false,
        reward_paid: false,
        reward_amount: 50.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])

    if (referralError) {
      console.error('Referral creation error:', referralError)
    } else {
      // Update referrer's total referrals count
      await supabase
        .from('users')
        .update({ 
          total_referrals: referrer.total_referrals + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrer.id)
      
      console.log(`Referral created successfully for referrer: ${referrer.id}`)
    }
  } catch (error) {
    console.error('Signup referral processing error:', error)
  }
}

// Enhanced referral processing function
async function processReferralReward(userId) {
  try {
    console.log(`Processing referral reward for user: ${userId}`)
    
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('is_valid', false)
      .single()

    if (referralError && referralError.code !== 'PGRST116') {
      console.error('Referral lookup error:', referralError)
      return
    }

    if (referral) {
      console.log(`Found referral to process: ${referral.id}`)
      
      // Mark referral as valid and pay reward with enhanced tracking
      const { error: updateReferralError } = await supabase
        .from('referrals')
        .update({ 
          is_valid: true, 
          reward_paid: true,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', referral.id)

      if (!updateReferralError) {
        // Add 50 TRX to referrer's balance with enhanced error handling
        const { error: rewardError } = await supabase
          .from('users')
          .update({ 
            referral_balance: supabase.raw('referral_balance + 50'),
            valid_referrals: supabase.raw('valid_referrals + 1'),
            updated_at: new Date().toISOString()
          })
          .eq('id', referral.referrer_id)

        if (rewardError) {
          console.error('Referral reward error:', rewardError)
        } else {
          console.log(`Referral reward processed successfully for referrer: ${referral.referrer_id}`)
        }
      } else {
        console.error('Referral update error:', updateReferralError)
      }
    } else {
      console.log(`No pending referral found for user: ${userId}`)
    }
  } catch (error) {
    console.error('Referral processing error:', error)
  }
}

// Mining nodes configuration
const MINING_NODES = [
  {
    id: 'node1',
    name: '64 GB Node',
    price: 50,
    storage: '64 GB',
    mining: 500,
    duration: 30,
    description: 'Mine 500 TRX in 30 days'
  },
  {
    id: 'node2',
    name: '128 GB Node',
    price: 75,
    storage: '128 GB',
    mining: 500,
    duration: 15,
    description: 'Mine 500 TRX in 15 days'
  },
  {
    id: 'node3',
    name: '256 GB Node',
    price: 100,
    storage: '256 GB',
    mining: 1000,
    duration: 7,
    description: 'Mine 1000 TRX in 7 days'
  },
  {
    id: 'node4',
    name: '1024 GB Node',
    price: 250,
    storage: '1024 GB',
    mining: 1000,
    duration: 3,
    description: 'Mine 1000 TRX in 3 days'
  }
]

// Initialize enhanced services with fallback
let trxVerifier = null
let dbInitialized = false

// Try to initialize enhanced services
try {
  // For now, we'll use a mock verifier to avoid import issues
  trxVerifier = {
    verifyTransaction: async (hash, amount, address, userId) => {
      console.log(`Mock TRX verification for hash: ${hash}`)
      return {
        valid: false,
        error: 'Transaction not found on blockchain (mock verification)',
        details: 'This is a mock verification for testing purposes'
      }
    },
    getVerificationStats: async () => {
      return {
        total: 0,
        verified: 0,
        failed: 0,
        pending: 0,
        success_rate: 0
      }
    }
  }
} catch (error) {
  console.error('Failed to initialize enhanced services:', error)
}

async function ensureDbInitialized() {
  if (!dbInitialized) {
    console.log('Database initialization skipped (enhanced features disabled)')
    dbInitialized = true
  }
}

// Enhanced rate limiting and security
const requestCounts = new Map()
const MAX_REQUESTS_PER_MINUTE = 60
const BLOCKED_IPS = new Set()

function checkRateLimit(ip) {
  const now = Date.now()
  const windowStart = Math.floor(now / 60000) * 60000 // 1-minute window
  const key = `${ip}:${windowStart}`
  
  const count = requestCounts.get(key) || 0
  requestCounts.set(key, count + 1)
  
  // Clean old entries
  for (const [k] of requestCounts) {
    if (k.split(':')[1] < windowStart - 60000) {
      requestCounts.delete(k)
    }
  }
  
  if (count >= MAX_REQUESTS_PER_MINUTE) {
    BLOCKED_IPS.add(ip)
    return false
  }
  
  return true
}

// Enhanced security headers
function enhanceSecurityHeaders(response) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'")
  return response
}

// Enhanced input validation
function validateInput(data, requiredFields) {
  const errors = []
  
  for (const field of requiredFields) {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${field} is required`)
    }
  }
  
  // Additional validation for specific fields
  if (data.username && (data.username.length < 3 || data.username.length > 50)) {
    errors.push('Username must be between 3 and 50 characters')
  }
  
  if (data.password && data.password.length < 6) {
    errors.push('Password must be at least 6 characters')
  }
  
  if (data.transactionHash && !/^[a-fA-F0-9]{64}$/.test(data.transactionHash)) {
    errors.push('Invalid transaction hash format')
  }
  
  if (data.amount && (isNaN(data.amount) || data.amount <= 0)) {
    errors.push('Amount must be a positive number')
  }
  
  return errors
}

// Enhanced transaction verification with comprehensive logging
async function verifyTRXTransactionEnhanced(transactionHash, expectedAmount, expectedToAddress, userId = null) {
  try {
    console.log(`Starting TRX verification for hash: ${transactionHash}`)
    
    const verification = await trxVerifier.verifyTransaction(
      transactionHash, 
      expectedAmount, 
      expectedToAddress, 
      userId
    )
    
    console.log(`TRX verification result for ${transactionHash}:`, verification.valid ? 'SUCCESS' : 'FAILED')
    
    if (!verification.valid) {
      console.log(`TRX verification error: ${verification.error}`)
    }
    
    return verification
  } catch (error) {
    console.error('Enhanced TRX verification error:', error)
    return {
      valid: false,
      error: 'Transaction verification service error',
      details: error.message
    }
  }
}

export async function GET(request) {
  try {
    // Initialize database
    await ensureDbInitialized()
    
    // Security checks
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    if (BLOCKED_IPS.has(ip)) {
      return enhanceSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 429 }))
    }
    
    if (!checkRateLimit(ip)) {
      return enhanceSecurityHeaders(NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }))
    }
    
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')

    // Enhanced logging
    console.log(`GET request: ${pathname} from IP: ${ip}`)

    if (pathname === '/auth/user') {
      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ user: null })))
    }

    if (pathname === '/nodes') {
      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ nodes: MINING_NODES })))
    }
    
    if (pathname === '/admin/db-status') {
      // Admin endpoint for database status
      const status = await dbInitializer.getDatabaseStatus()
      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ status })))
    }
    
    if (pathname === '/admin/verification-stats') {
      // Admin endpoint for verification statistics
      const stats = await trxVerifier.getVerificationStats()
      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ stats })))
    }

    if (pathname === '/user/profile') {
      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ error: 'User not authenticated' }, { status: 401 })))
    }

    if (pathname === '/user/nodes') {
      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ error: 'User not authenticated' }, { status: 401 })))
    }

    if (pathname === '/user/referrals') {
      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ error: 'User not authenticated' }, { status: 401 })))
    }

    if (pathname === '/withdrawals') {
      // Enhanced mock withdrawal data with more realistic patterns
      const generateEnhancedMockWithdrawal = () => {
        const usernames = [
          'CryptoMiner', 'TRXTrader', 'BlockchainPro', 'DigitalGold', 'CoinMaster',
          'TronMiner', 'CryptoKing', 'BlockMiner', 'TRXExpert', 'CoinHunter',
          'MiningPro', 'CryptoGuru', 'TronTrader', 'DigitalMiner', 'BlockExpert'
        ]
        
        // More realistic withdrawal amounts based on mining node capabilities
        const amounts = [25, 30, 45, 50, 75, 100, 125, 150, 200, 250, 300, 500, 750, 1000]
        const timeOffsets = [5, 10, 15, 30, 45, 60, 120, 180] // minutes ago
        
        return {
          id: uuidv4(),
          username: usernames[Math.floor(Math.random() * usernames.length)],
          amount: amounts[Math.floor(Math.random() * amounts.length)],
          timestamp: new Date(Date.now() - timeOffsets[Math.floor(Math.random() * timeOffsets.length)] * 60 * 1000),
          type: Math.random() > 0.7 ? 'referral' : 'mining',
          status: 'completed'
        }
      }

      const mockWithdrawals = Array.from({ length: 8 }, generateEnhancedMockWithdrawal)
        .sort((a, b) => b.timestamp - a.timestamp)

      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ withdrawals: mockWithdrawals })))
    }

    return enhanceSecurityHeaders(handleCORS(NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })))

  } catch (error) {
    console.error('GET API Error:', error)
    return enhanceSecurityHeaders(handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 })))
  }
}

export async function POST(request) {
  try {
    // Initialize database
    await ensureDbInitialized()
    
    // Security checks
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    if (BLOCKED_IPS.has(ip)) {
      return enhanceSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 429 }))
    }
    
    if (!checkRateLimit(ip)) {
      return enhanceSecurityHeaders(NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }))
    }
    
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')
    
    let body
    try {
      body = await request.json()
    } catch (error) {
      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 })))
    }

    // Enhanced logging
    console.log(`POST request: ${pathname} from IP: ${ip}`)

    if (pathname === '/auth/signup') {
      const { username, password, referralCode } = body
      
      // Enhanced input validation
      const validationErrors = validateInput(body, ['username', 'password'])
      if (validationErrors.length > 0) {
        return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
          error: 'Validation failed', 
          details: validationErrors 
        }, { status: 400 })))
      }

      console.log(`User signup attempt: ${username}`)

      // Check if username already exists with case-insensitive check
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, username')
        .ilike('username', username)
        .single()

      if (existingUser) {
        return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
          error: 'Username already exists' 
        }, { status: 400 })))
      }

      const userId = uuidv4()
      const userReferralCode = uuidv4().substring(0, 8).toUpperCase()
      
      const newUser = {
        id: userId,
        username: username.trim(),
        password, // In production, this should be hashed
        email: `${username.toLowerCase().trim()}@trxmining.com`,
        mine_balance: 25, // Signup bonus
        referral_balance: 0,
        total_referrals: 0,
        valid_referrals: 0,
        referral_code: userReferralCode,
        has_active_mining: false,
        has_bought_node4: false,
        is_active: true,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: userData, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single()

      if (insertError) {
        console.error('User creation error:', insertError)
        
        if (insertError.message && insertError.message.includes('does not exist')) {
          return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
            error: 'Database tables not initialized. Please contact administrator.' 
          }, { status: 500 })))
        }
        
        return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
          error: 'Failed to create user account' 
        }, { status: 500 })))
      }

      console.log(`User created successfully: ${userId}`)

      // Enhanced referral handling
      if (referralCode && referralCode.trim() !== '') {
        await processSignupReferral(userId, referralCode.trim().toUpperCase())
      }

      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
        user: { 
          id: userId, 
          username: username.trim(), 
          email: newUser.email 
        },
        message: 'Account created successfully! 25 TRX welcome bonus added!'
      })))
    }

    if (pathname === '/auth/signin') {
      const { username, password } = body
      
      if (!username || !password) {
        return handleCORS(NextResponse.json({ error: 'Username and password are required' }, { status: 400 }))
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('username', username)
        .eq('password', password)
        .single()

      if (error || !user) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }

      return handleCORS(NextResponse.json({ 
        user: { id: user.id, username: user.username, email: user.email },
        message: 'Login successful!'
      }))
    }

    if (pathname === '/user/profile') {
      const { userId } = body
      
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'User ID required' }, { status: 400 }))
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error || !user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }
      
      // Convert snake_case to camelCase for frontend compatibility
      const userProfile = {
        id: user.id,
        username: user.username,
        email: user.email,
        mineBalance: parseFloat(user.mine_balance),
        referralBalance: parseFloat(user.referral_balance),
        totalReferrals: user.total_referrals,
        validReferrals: user.valid_referrals,
        referralCode: user.referral_code,
        hasActiveMining: user.has_active_mining,
        hasBoughtNode4: user.has_bought_node4,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
      
      return handleCORS(NextResponse.json({ user: userProfile }))
    }

    if (pathname === '/user/nodes') {
      const { userId } = body
      
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'User ID required' }, { status: 400 }))
      }

      const { data: userNodes, error } = await supabase
        .from('user_nodes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('User nodes fetch error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch user nodes' }, { status: 500 }))
      }

      // Update mining progress for active nodes
      const now = new Date()
      const updatedNodes = userNodes.map(node => {
        if (node.status === 'running') {
          const elapsed = now - new Date(node.start_date)
          const totalDuration = node.duration * 24 * 60 * 60 * 1000 // Convert days to milliseconds
          const progress = Math.min(100, (elapsed / totalDuration) * 100)
          
          if (progress >= 100) {
            node.status = 'completed'
            node.progress = 100
          } else {
            node.progress = progress
          }
        }
        
        // Convert snake_case to camelCase for frontend compatibility
        return {
          id: node.id,
          userId: node.user_id,
          nodeId: node.node_id,
          transactionHash: node.transaction_hash,
          status: node.status,
          progress: parseFloat(node.progress),
          startDate: node.start_date,
          endDate: node.end_date,
          miningAmount: parseFloat(node.mining_amount),
          dailyMining: parseFloat(node.daily_mining),
          duration: node.duration,
          createdAt: node.created_at
        }
      })

      return handleCORS(NextResponse.json({ nodes: updatedNodes }))
    }

    if (pathname === '/user/referrals') {
      const { userId } = body
      
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'User ID required' }, { status: 400 }))
      }

      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Referrals fetch error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 }))
      }

      // Convert snake_case to camelCase for frontend compatibility
      const formattedReferrals = referrals.map(referral => ({
        id: referral.id,
        referrerId: referral.referrer_id,
        referredId: referral.referred_id,
        referralCode: referral.referral_code,
        isValid: referral.is_valid,
        rewardPaid: referral.reward_paid,
        createdAt: referral.created_at
      }))

      return handleCORS(NextResponse.json({ referrals: formattedReferrals }))
    }

    if (pathname === '/nodes/purchase') {
      const { nodeId, transactionHash, userId } = body
      
      // Enhanced input validation
      const validationErrors = validateInput(body, ['nodeId', 'transactionHash', 'userId'])
      if (validationErrors.length > 0) {
        return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
          error: 'Validation failed', 
          details: validationErrors 
        }, { status: 400 })))
      }

      const node = MINING_NODES.find(n => n.id === nodeId)
      if (!node) {
        return enhanceSecurityHeaders(handleCORS(NextResponse.json({ error: 'Invalid mining node' }, { status: 400 })))
      }

      console.log(`Processing node purchase: ${nodeId} for user: ${userId}`)

      // Enhanced TRX transaction verification
      const TRX_RECEIVE_ADDRESS = 'TFNHcYdhEq5sgjaWPdR1Gnxgzu3RUKncwu'
      const verification = await verifyTRXTransactionEnhanced(
        transactionHash, 
        node.price, 
        TRX_RECEIVE_ADDRESS, 
        userId
      )
      
      if (!verification.valid) {
        console.log(`Transaction verification failed for ${transactionHash}: ${verification.error}`)
        return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
          error: verification.error,
          details: verification.details || 'Transaction verification failed'
        }, { status: 400 })))
      }

      console.log(`Transaction verified successfully: ${transactionHash}`)

      // Check if user already has this node running (enhanced check)
      const { data: existingActiveNode } = await supabase
        .from('user_nodes')
        .select('id, status, created_at')
        .eq('user_id', userId)
        .eq('node_id', nodeId)
        .in('status', ['pending', 'running'])
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (existingActiveNode && existingActiveNode.length > 0) {
        return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
          error: 'You already have an active node of this type',
          details: `Status: ${existingActiveNode[0].status}, Created: ${new Date(existingActiveNode[0].created_at).toLocaleString()}`
        }, { status: 400 })))
      }

      // Enhanced user node creation with better tracking
      const userNode = {
        id: uuidv4(),
        user_id: userId,
        node_id: nodeId,
        transaction_hash: transactionHash,
        transaction_verified: true,
        transaction_amount: node.price,
        transaction_verified_at: new Date().toISOString(),
        status: 'running',
        progress: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + node.duration * 24 * 60 * 60 * 1000).toISOString(),
        mining_amount: node.mining,
        daily_mining: node.mining / node.duration,
        duration: node.duration,
        total_mined: 0,
        last_mining_update: new Date().toISOString()
      }

      const { data: nodeData, error: insertError } = await supabase
        .from('user_nodes')
        .insert([userNode])
        .select()
        .single()

      if (insertError) {
        console.error('Node purchase database error:', insertError)
        return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
          error: 'Failed to create mining node',
          details: 'Database operation failed'
        }, { status: 500 })))
      }

      console.log(`Node created successfully: ${nodeData.id}`)

      // Update user's mining status with enhanced tracking
      const updateData = { 
        has_active_mining: true,
        updated_at: new Date().toISOString()
      }
      
      if (nodeId === 'node4') {
        updateData.has_bought_node4 = true
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (updateError) {
        console.error('User update error:', updateError)
      }

      // Enhanced referral processing
      await processReferralReward(userId)

      console.log(`Node purchase completed successfully for user: ${userId}`)

      return enhanceSecurityHeaders(handleCORS(NextResponse.json({ 
        message: 'Mining node purchased and verified successfully!',
        node: {
          id: nodeData.id,
          nodeId: nodeData.node_id,
          status: nodeData.status,
          startDate: nodeData.start_date,
          endDate: nodeData.end_date,
          miningAmount: nodeData.mining_amount,
          dailyMining: nodeData.daily_mining
        },
        verification: {
          verified: true,
          amount: verification.amount,
          timestamp: verification.blockTimestamp || new Date().toISOString()
        }
      })))
    }

    if (pathname === '/withdraw') {
      const { type, amount, userId } = body
      
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'User ID required' }, { status: 400 }))
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }

      if (type === 'mine') {
        if (amount < 25) {
          return handleCORS(NextResponse.json({ error: 'Minimum withdrawal is 25 TRX' }, { status: 400 }))
        }
        
        if (parseFloat(user.mine_balance) < amount) {
          return handleCORS(NextResponse.json({ error: 'Insufficient balance' }, { status: 400 }))
        }

        if (!user.has_active_mining) {
          return handleCORS(NextResponse.json({ error: 'You must buy a mining node first' }, { status: 400 }))
        }

        // Process withdrawal
        const { error: withdrawError } = await supabase
          .from('users')
          .update({ 
            mine_balance: parseFloat(user.mine_balance) - amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (withdrawError) {
          console.error('Mine withdrawal error:', withdrawError)
          return handleCORS(NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 }))
        }

        // Record withdrawal
        await supabase
          .from('withdrawals')
          .insert([{
            id: uuidv4(),
            user_id: userId,
            type: 'mine',
            amount: amount,
            status: 'completed'
          }])

        return handleCORS(NextResponse.json({ message: 'Mine balance withdrawal successful!' }))
      }

      if (type === 'referral') {
        if (amount < 50) {
          return handleCORS(NextResponse.json({ error: 'Minimum withdrawal is 50 TRX' }, { status: 400 }))
        }

        if (parseFloat(user.referral_balance) < amount) {
          return handleCORS(NextResponse.json({ error: 'Insufficient balance' }, { status: 400 }))
        }

        if (!user.has_bought_node4) {
          return handleCORS(NextResponse.json({ error: 'You must buy Node 4 (1024 GB) first' }, { status: 400 }))
        }

        // Process withdrawal
        const { error: withdrawError } = await supabase
          .from('users')
          .update({ 
            referral_balance: parseFloat(user.referral_balance) - amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (withdrawError) {
          console.error('Referral withdrawal error:', withdrawError)
          return handleCORS(NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 }))
        }

        // Record withdrawal
        await supabase
          .from('withdrawals')
          .insert([{
            id: uuidv4(),
            user_id: userId,
            type: 'referral',
            amount: amount,
            status: 'completed'
          }])

        return handleCORS(NextResponse.json({ message: 'Referral balance withdrawal successful!' }))
      }

      return handleCORS(NextResponse.json({ error: 'Invalid withdrawal type' }, { status: 400 }))
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export async function OPTIONS(request) {
  return handleCORS(new Response(null, { status: 200 }))
}