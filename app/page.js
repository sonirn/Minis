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

// Enhanced API utility function to handle external routing issues
const apiRequest = async (endpoint, options = {}) => {
  const urls = [
    `/api${endpoint}`, // Try relative URL first (works internally)
    `${process.env.NEXT_PUBLIC_BASE_URL}/api${endpoint}`, // Try absolute external URL
    `http://localhost:3000/api${endpoint}` // Fallback to localhost (for development)
  ]
  
  let lastError = null
  
  for (const url of urls) {
    try {
      console.log(`Attempting API call to: ${url}`)
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      
      if (response.ok) {
        console.log(`✅ API call successful: ${url}`)
        return response
      } else if (response.status !== 502) {
        // If we get a non-502 error, it means the endpoint was reached
        console.log(`⚠️ API call reached but failed: ${url} - ${response.status}`)
        return response
      } else {
        console.log(`❌ 502 error for: ${url}`)
        lastError = new Error(`502 Bad Gateway for ${url}`)
      }
    } catch (error) {
      console.log(`❌ Network error for: ${url} - ${error.message}`)
      lastError = error
    }
  }
  
  throw lastError || new Error('All API endpoints failed')
}

export default function App() {
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
    
    // Simulate live withdrawals
    const interval = setInterval(() => {
      fetchLiveWithdrawals()
    }, 15000)

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
      // Check if user is stored in localStorage
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
      const response = await fetch(getApiUrl('/nodes/purchase'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(getApiUrl('/withdraw'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Auth Pages
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">MineTRXWith</h1>
            <p className="text-gray-600 mt-2">Professional TRX Mining Platform</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <p className="text-gray-600 text-sm">
                {authMode === 'signup' ? 'Join thousands of miners earning TRX' : 'Sign in to your mining account'}
              </p>
            </CardHeader>
            <CardContent>
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
                  </div>
                )}

                {authError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-600 text-sm">{authError}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={authLoading}
                >
                  {authLoading ? 'Please wait...' : (authMode === 'signup' ? 'Create Account & Get 25 TRX' : 'Sign In')}
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
      <div className="text-center space-y-6 py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          Mine<span className="text-blue-600">TRX</span>With
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Professional TRX mining platform with enterprise-grade infrastructure. 
          Start mining today and build your passive income stream.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            ✓ 99.9% Uptime
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            ✓ Licensed & Regulated
          </Badge>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            ✓ 24/7 Support
          </Badge>
        </div>
      </div>

      {/* Live Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Recent Withdrawals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {liveWithdrawals.map((withdrawal, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">{withdrawal.username}</span>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-semibold">{withdrawal.amount} TRX</div>
                  <div className="text-gray-500 text-sm">
                    {new Date(withdrawal.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Server className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise Mining</h3>
            <p className="text-gray-600">Industrial-grade mining infrastructure with guaranteed uptime and maximum efficiency.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fully Licensed</h3>
            <p className="text-gray-600">Regulated and compliant mining operations with full legal protection for your investments.</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Coins className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Proven Returns</h3>
            <p className="text-gray-600">Consistent mining rewards with transparent payouts and detailed performance tracking.</p>
          </CardContent>
        </Card>
      </div>

      {/* Mining Nodes */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Mining Plans</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the perfect mining plan for your goals. All plans include 24/7 monitoring, 
            automatic payouts, and enterprise-grade security.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {miningNodes.map((node) => {
            const userNode = userNodes.find(un => un.nodeId === node.id && un.status === 'running')
            const isRunning = !!userNode
            const isPopular = node.id === 'node3'
            
            return (
              <Card key={node.id} className={`relative ${isRunning ? 'ring-2 ring-blue-600' : ''} ${isPopular ? 'ring-2 ring-orange-500' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{node.name}</div>
                      <div className="text-sm text-gray-600">{node.storage}</div>
                    </div>
                    {isRunning && <Badge className="bg-green-500 text-white">Active</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price</span>
                      <span className="text-2xl font-bold text-gray-900">{node.price} TRX</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Mining</span>
                      <span className="font-semibold text-green-600">{node.mining} TRX</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-semibold text-gray-900">{node.duration} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Daily Income</span>
                      <span className="font-semibold text-blue-600">{Math.round(node.mining / node.duration)} TRX</span>
                    </div>
                  </div>
                  
                  {isRunning && (
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold">{Math.round(userNode.progress)}%</span>
                      </div>
                      <Progress value={userNode.progress} className="h-2" />
                      <div className="text-xs text-gray-500">
                        Ends: {new Date(userNode.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    className={`w-full ${isPopular ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    onClick={() => {
                      setSelectedNode(node)
                      setShowPayment(true)
                    }}
                    disabled={isRunning}
                  >
                    {isRunning ? 'Mining Active' : `Start Mining - ${node.price} TRX`}
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
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Purchase {selectedNode.name}</CardTitle>
              <p className="text-gray-600">Send exactly {selectedNode.price} TRX to activate your mining node</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Send {selectedNode.price} TRX to:</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm font-mono flex-1 break-all">{TRX_RECEIVE_ADDRESS}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(TRX_RECEIVE_ADDRESS)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Transaction Hash</label>
                <Input
                  type="text"
                  placeholder="Enter transaction hash after payment"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!transactionHash}
                >
                  Confirm Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  // Profile Page
  const ProfilePage = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Account Dashboard</h2>
        <p className="text-gray-600">Welcome back, {userProfile?.username}!</p>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Mine Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-600" />
              Mining Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {userProfile?.mineBalance || 0} TRX
              </div>
              <p className="text-gray-600 text-sm">Available for withdrawal</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Withdrawal Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setWithdrawType('mine')
                  handleWithdraw()
                }}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Withdraw Mining Balance
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
              <p>• Minimum withdrawal: 25 TRX</p>
              <p>• Must purchase a mining node first</p>
              {userProfile?.hasActiveMining && (
                <p className="text-green-600">✓ Withdrawal available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referral Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Referral Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {userProfile?.referralBalance || 0} TRX
              </div>
              <p className="text-gray-600 text-sm">Earned from referrals</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Withdrawal Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
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
            
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
              <p>• Minimum withdrawal: 50 TRX</p>
              <p>• Must purchase Node 4 (1024 GB) first</p>
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
                  <div key={userNode.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
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
                        <span>Total Mining: {userNode.miningAmount} TRX</span>
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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h2>
        <p className="text-gray-600">Earn 50 TRX for every friend who starts mining</p>
      </div>

      {/* Referral Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{userProfile?.referralCode}</div>
            <p className="text-gray-600 text-sm mb-4">Share this code with friends to earn rewards</p>
            <Button
              onClick={() => copyToClipboard(userProfile?.referralCode)}
              className="bg-blue-600 hover:bg-blue-700"
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
          <CardTitle>How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Share Your Code</h4>
                <p className="text-gray-600 text-sm">Give your referral code to friends and family</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">They Start Mining</h4>
                <p className="text-gray-600 text-sm">When they create an account and purchase any mining node</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold text-sm">3</span>
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
              Pending Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {referrals.filter(r => !r.isValid).length}
              </div>
              <p className="text-gray-600 text-sm">Signed up, awaiting first purchase</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Successful Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {referrals.filter(r => r.isValid).length}
              </div>
              <p className="text-gray-600 text-sm">Earned you rewards</p>
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
                    {referral.isValid ? 'Active' : 'Pending'}
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
              <h1 className="text-xl font-bold text-gray-900">
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