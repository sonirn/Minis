import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

let client
let db

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db('trx-mining')
  }
  return db
}

// Mock Supabase user for development
const mockUser = {
  id: 'mock-user-123',
  username: 'testuser',
  email: 'test@example.com',
  created_at: new Date().toISOString()
}

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

export async function GET(request) {
  try {
    const db = await connectDB()
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')

    if (pathname === '/auth/user') {
      return handleCORS(NextResponse.json({ user: mockUser }))
    }

    if (pathname === '/nodes') {
      return handleCORS(NextResponse.json({ nodes: MINING_NODES }))
    }

    if (pathname === '/user/profile') {
      const userId = mockUser.id
      let user = await db.collection('users').findOne({ id: userId })
      
      if (!user) {
        // Create initial user with signup bonus
        user = {
          id: userId,
          username: mockUser.username,
          email: mockUser.email,
          mineBalance: 25, // Signup bonus
          referralBalance: 0,
          totalReferrals: 0,
          validReferrals: 0,
          referralCode: uuidv4().substring(0, 8).toUpperCase(),
          hasActiveMining: false,
          hasBoughtNode4: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        await db.collection('users').insertOne(user)
      }
      
      return handleCORS(NextResponse.json({ user }))
    }

    if (pathname === '/user/nodes') {
      const userId = mockUser.id
      const userNodes = await db.collection('user_nodes').find({ userId }).toArray()
      return handleCORS(NextResponse.json({ nodes: userNodes }))
    }

    if (pathname === '/user/referrals') {
      const userId = mockUser.id
      const referrals = await db.collection('referrals').find({ referrerId: userId }).toArray()
      return handleCORS(NextResponse.json({ referrals }))
    }

    if (pathname === '/withdrawals') {
      const userId = mockUser.id
      const mockWithdrawals = [
        { username: 'user123', amount: 150, timestamp: new Date(Date.now() - 1000 * 60 * 5) },
        { username: 'miner456', amount: 2500, timestamp: new Date(Date.now() - 1000 * 60 * 10) },
        { username: 'crypto789', amount: 875, timestamp: new Date(Date.now() - 1000 * 60 * 15) },
        { username: 'trx001', amount: 1200, timestamp: new Date(Date.now() - 1000 * 60 * 20) },
        { username: 'node999', amount: 450, timestamp: new Date(Date.now() - 1000 * 60 * 25) },
      ]
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
    const db = await connectDB()
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api', '')
    const body = await request.json()

    if (pathname === '/auth/signup') {
      const { username, password, referralCode } = body
      
      // Check if username already exists
      const existingUser = await db.collection('users').findOne({ username })
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'Username already exists' }, { status: 400 }))
      }

      const userId = uuidv4()
      const userReferralCode = uuidv4().substring(0, 8).toUpperCase()
      
      const newUser = {
        id: userId,
        username,
        password, // In production, this should be hashed
        email: `${username}@mock.com`,
        mineBalance: 25, // Signup bonus
        referralBalance: 0,
        totalReferrals: 0,
        validReferrals: 0,
        referralCode: userReferralCode,
        hasActiveMining: false,
        hasBoughtNode4: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('users').insertOne(newUser)

      // Handle referral if provided
      if (referralCode) {
        const referrer = await db.collection('users').findOne({ referralCode })
        if (referrer) {
          await db.collection('referrals').insertOne({
            id: uuidv4(),
            referrerId: referrer.id,
            referredId: userId,
            referralCode,
            isValid: false,
            createdAt: new Date()
          })
        }
      }

      return handleCORS(NextResponse.json({ 
        user: { id: userId, username, email: newUser.email },
        message: 'Account created successfully! 25 TRX bonus added!'
      }))
    }

    if (pathname === '/auth/signin') {
      const { username, password } = body
      
      const user = await db.collection('users').findOne({ username, password })
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }

      return handleCORS(NextResponse.json({ 
        user: { id: user.id, username: user.username, email: user.email },
        message: 'Login successful!'
      }))
    }

    if (pathname === '/nodes/purchase') {
      const { nodeId, transactionHash } = body
      const userId = mockUser.id
      
      const node = MINING_NODES.find(n => n.id === nodeId)
      if (!node) {
        return handleCORS(NextResponse.json({ error: 'Invalid node' }, { status: 400 }))
      }

      // Mock transaction verification
      if (!transactionHash || transactionHash.length < 10) {
        return handleCORS(NextResponse.json({ error: 'Invalid transaction hash' }, { status: 400 }))
      }

      // Check if user already has this node running
      const existingNode = await db.collection('user_nodes').findOne({ 
        userId, 
        nodeId, 
        status: 'running' 
      })
      
      if (existingNode) {
        return handleCORS(NextResponse.json({ error: 'You already have this node running' }, { status: 400 }))
      }

      const userNode = {
        id: uuidv4(),
        userId,
        nodeId,
        transactionHash,
        status: 'running',
        progress: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + node.duration * 24 * 60 * 60 * 1000),
        miningAmount: node.mining,
        dailyMining: node.mining / node.duration,
        createdAt: new Date()
      }

      await db.collection('user_nodes').insertOne(userNode)

      // Update user's mining status
      await db.collection('users').updateOne(
        { id: userId },
        { 
          $set: { 
            hasActiveMining: true,
            hasBoughtNode4: nodeId === 'node4' ? true : undefined,
            updatedAt: new Date()
          }
        }
      )

      return handleCORS(NextResponse.json({ 
        message: 'Node purchased successfully!',
        node: userNode
      }))
    }

    if (pathname === '/withdraw') {
      const { type, amount } = body // type: 'mine' or 'referral'
      const userId = mockUser.id
      
      const user = await db.collection('users').findOne({ id: userId })
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }))
      }

      if (type === 'mine') {
        if (amount < 25) {
          return handleCORS(NextResponse.json({ error: 'Minimum withdrawal is 25 TRX' }, { status: 400 }))
        }
        
        if (user.mineBalance < amount) {
          return handleCORS(NextResponse.json({ error: 'Insufficient balance' }, { status: 400 }))
        }

        if (!user.hasActiveMining) {
          return handleCORS(NextResponse.json({ error: 'You must buy a mining node first' }, { status: 400 }))
        }

        // Process withdrawal
        await db.collection('users').updateOne(
          { id: userId },
          { 
            $inc: { mineBalance: -amount },
            $set: { updatedAt: new Date() }
          }
        )

        return handleCORS(NextResponse.json({ message: 'Mine balance withdrawal successful!' }))
      }

      if (type === 'referral') {
        if (amount < 50) {
          return handleCORS(NextResponse.json({ error: 'Minimum withdrawal is 50 TRX' }, { status: 400 }))
        }

        if (user.referralBalance < amount) {
          return handleCORS(NextResponse.json({ error: 'Insufficient balance' }, { status: 400 }))
        }

        if (!user.hasBoughtNode4) {
          return handleCORS(NextResponse.json({ error: 'You must buy Node 4 (1024 GB) first' }, { status: 400 }))
        }

        // Process withdrawal
        await db.collection('users').updateOne(
          { id: userId },
          { 
            $inc: { referralBalance: -amount },
            $set: { updatedAt: new Date() }
          }
        )

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