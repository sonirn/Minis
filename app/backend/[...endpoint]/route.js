import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Alternative backend API to bypass /api routing issues

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Max-Age', '86400')
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

export async function GET(request, { params }) {
  try {
    const { endpoint } = params || {}
    const path = endpoint ? '/' + endpoint.join('/') : '/nodes'

    console.log(`Alternative backend GET: ${path}`)

    if (path === '/nodes' || path === '/') {
      return handleCORS(NextResponse.json({ nodes: MINING_NODES }))
    }
    
    if (path === '/withdrawals') {
      // Mock withdrawal data
      const generateMockWithdrawal = () => {
        const usernames = [
          'CryptoMiner', 'TRXTrader', 'BlockchainPro', 'DigitalGold', 'CoinMaster',
          'TronMiner', 'CryptoKing', 'BlockMiner', 'TRXExpert', 'CoinHunter'
        ]
        
        const amounts = [25, 30, 45, 50, 75, 100, 125, 150, 200, 250]
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

      const mockWithdrawals = Array.from({ length: 8 }, generateMockWithdrawal)
        .sort((a, b) => b.timestamp - a.timestamp)

      return handleCORS(NextResponse.json({ withdrawals: mockWithdrawals }))
    }

    return handleCORS(NextResponse.json({ error: 'Endpoint not found' }, { status: 404 }))

  } catch (error) {
    console.error('Alternative backend GET error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export async function POST(request, { params }) {
  try {
    const { endpoint } = params || {}
    const path = endpoint ? '/' + endpoint.join('/') : '/'
    
    let body
    try {
      body = await request.json()
    } catch (error) {
      return handleCORS(NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 }))
    }

    console.log(`Alternative backend POST: ${path}`)

    // For now, let's implement a simple test endpoint
    if (path === '/test') {
      return handleCORS(NextResponse.json({ message: 'Alternative backend working!', data: body }))
    }

    return handleCORS(NextResponse.json({ error: 'Endpoint not implemented yet' }, { status: 404 }))

  } catch (error) {
    console.error('Alternative backend POST error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export async function OPTIONS(request) {
  return handleCORS(new Response(null, { status: 200 }))
}