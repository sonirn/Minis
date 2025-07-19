import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import EnhancedTRXVerifier from '../../../lib/enhanced-trx-verifier'
import dbInitializer from '../../../lib/database-initializer'

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
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

// Initialize enhanced services
const trxVerifier = new EnhancedTRXVerifier()

// Initialize database on first API call
let dbInitialized = false
async function ensureDbInitialized() {
  if (!dbInitialized) {
    await dbInitializer.initializeDatabase()
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
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')

    if (pathname === '/auth/user') {
      // For now, return null to indicate no user is logged in
      return handleCORS(NextResponse.json({ user: null }))
    }

    if (pathname === '/nodes') {
      return handleCORS(NextResponse.json({ nodes: MINING_NODES }))
    }

    if (pathname === '/user/profile') {
      // This requires authentication - should be handled by frontend
      return handleCORS(NextResponse.json({ error: 'User not authenticated' }, { status: 401 }))
    }

    if (pathname === '/user/nodes') {
      // This requires authentication - should be handled by frontend
      return handleCORS(NextResponse.json({ error: 'User not authenticated' }, { status: 401 }))
    }

    if (pathname === '/user/referrals') {
      // This requires authentication - should be handled by frontend
      return handleCORS(NextResponse.json({ error: 'User not authenticated' }, { status: 401 }))
    }

    if (pathname === '/withdrawals') {
      // Generate mock live withdrawal data
      const generateMockWithdrawal = () => {
        const usernames = ['user123', 'miner456', 'crypto789', 'trx001', 'node999', 'btc_lover', 'eth_fan', 'doge_master', 'ada_holder', 'sol_trader']
        const amounts = [25, 50, 75, 100, 150, 200, 250, 500, 750, 1000, 1250, 1500, 2000, 2500, 5000, 7500, 10000]
        
        return {
          username: usernames[Math.floor(Math.random() * usernames.length)],
          amount: amounts[Math.floor(Math.random() * amounts.length)],
          timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000) // Random time within last hour
        }
      }

      const mockWithdrawals = Array.from({ length: 5 }, generateMockWithdrawal)
        .sort((a, b) => b.timestamp - a.timestamp) // Sort by newest first

      return handleCORS(NextResponse.json({ withdrawals: mockWithdrawals }))
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')
    const body = await request.json()

    if (pathname === '/auth/signup') {
      const { username, password, referralCode } = body
      
      if (!username || !password) {
        return handleCORS(NextResponse.json({ error: 'Username and password are required' }, { status: 400 }))
      }

      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'Username already exists' }, { status: 400 }))
      }

      const userId = uuidv4()
      const userReferralCode = uuidv4().substring(0, 8).toUpperCase()
      
      const newUser = {
        id: userId,
        username,
        password, // In production, this should be hashed
        email: `${username}@trxmining.com`,
        mine_balance: 25, // Signup bonus
        referral_balance: 0,
        total_referrals: 0,
        valid_referrals: 0,
        referral_code: userReferralCode,
        has_active_mining: false,
        has_bought_node4: false
      }

      const { data: userData, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single()

      if (insertError) {
        console.error('User creation error:', insertError)
        console.error('Full error details:', JSON.stringify(insertError, null, 2))
        
        // If table doesn't exist, try to create it
        if (insertError.message && insertError.message.includes('does not exist')) {
          console.log('Attempting to create users table...')
          // For now, return a more specific error
          return handleCORS(NextResponse.json({ 
            error: 'Database tables not initialized. Please contact administrator.' 
          }, { status: 500 }))
        }
        
        return handleCORS(NextResponse.json({ error: 'Failed to create user' }, { status: 500 }))
      }

      // Handle referral if provided
      if (referralCode && referralCode.trim() !== '') {
        const { data: referrer, error: referrerError } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode.trim())
          .single()

        if (referrer && !referrerError) {
          const { error: referralError } = await supabase
            .from('referrals')
            .insert([{
              id: uuidv4(),
              referrer_id: referrer.id,
              referred_id: userId,
              referral_code: referralCode.trim(),
              is_valid: false
            }])

          if (referralError) {
            console.error('Referral creation error:', referralError)
          }
        }
      }

      return handleCORS(NextResponse.json({ 
        user: { id: userId, username, email: newUser.email },
        message: 'Account created successfully! 25 TRX bonus added!'
      }))
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
      
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'User ID required' }, { status: 400 }))
      }

      const node = MINING_NODES.find(n => n.id === nodeId)
      if (!node) {
        return handleCORS(NextResponse.json({ error: 'Invalid node' }, { status: 400 }))
      }

      if (!transactionHash || transactionHash.length < 10) {
        return handleCORS(NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 }))
      }

      // Verify TRX transaction using Trongrid API
      const TRX_RECEIVE_ADDRESS = 'TFNHcYdhEq5sgjaWPdR1Gnxgzu3RUKncwu'
      const verification = await verifyTRXTransaction(transactionHash, node.price, TRX_RECEIVE_ADDRESS)
      
      if (!verification.valid) {
        return handleCORS(NextResponse.json({ error: verification.error }, { status: 400 }))
      }

      // Check if user already has this node running
      const { data: existingNode, error: checkError } = await supabase
        .from('user_nodes')
        .select('id')
        .eq('user_id', userId)
        .eq('node_id', nodeId)
        .eq('status', 'running')
        .single()
      
      if (existingNode) {
        return handleCORS(NextResponse.json({ error: 'You already have this node running' }, { status: 400 }))
      }

      // Check if transaction hash is already used
      const { data: usedTransaction, error: txError } = await supabase
        .from('user_nodes')
        .select('id')
        .eq('transaction_hash', transactionHash)
        .single()

      if (usedTransaction) {
        return handleCORS(NextResponse.json({ error: 'Transaction hash already used' }, { status: 400 }))
      }

      const userNode = {
        id: uuidv4(),
        user_id: userId,
        node_id: nodeId,
        transaction_hash: transactionHash,
        status: 'running',
        progress: 0,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + node.duration * 24 * 60 * 60 * 1000).toISOString(),
        mining_amount: node.mining,
        daily_mining: node.mining / node.duration,
        duration: node.duration
      }

      const { data: nodeData, error: insertError } = await supabase
        .from('user_nodes')
        .insert([userNode])
        .select()
        .single()

      if (insertError) {
        console.error('Node purchase error:', insertError)
        return handleCORS(NextResponse.json({ error: 'Failed to purchase node' }, { status: 500 }))
      }

      // Update user's mining status
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

      // Check if this user was referred and update referral status
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', userId)
        .eq('is_valid', false)
        .single()

      if (referral && !referralError) {
        // Mark referral as valid and pay reward
        const { error: updateReferralError } = await supabase
          .from('referrals')
          .update({ is_valid: true, reward_paid: true })
          .eq('id', referral.id)

        if (!updateReferralError) {
          // Add 50 TRX to referrer's balance
          const { error: rewardError } = await supabase
            .from('users')
            .update({ 
              referral_balance: supabase.raw('referral_balance + 50'),
              valid_referrals: supabase.raw('valid_referrals + 1')
            })
            .eq('id', referral.referrer_id)

          if (rewardError) {
            console.error('Referral reward error:', rewardError)
          }
        }
      }

      return handleCORS(NextResponse.json({ 
        message: 'Node purchased successfully! Transaction verified.',
        node: nodeData
      }))
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