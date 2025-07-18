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
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react'

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

  // Auth states
  const [authMode, setAuthMode] = useState('signin')
  const [authData, setAuthData] = useState({ username: '', password: '', referralCode: '' })
  
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
    }, 10000)

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
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMiningNodes = async () => {
    try {
      const response = await fetch('/api/nodes')
      if (response.ok) {
        const data = await response.json()
        setMiningNodes(data.nodes)
      }
    } catch (error) {
      console.error('Fetch nodes error:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
      }
    } catch (error) {
      console.error('Fetch profile error:', error)
    }
  }

  const fetchUserNodes = async () => {
    try {
      const response = await fetch('/api/user/nodes')
      if (response.ok) {
        const data = await response.json()
        setUserNodes(data.nodes)
      }
    } catch (error) {
      console.error('Fetch user nodes error:', error)
    }
  }

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/user/referrals')
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
      const response = await fetch('/api/withdrawals')
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
    try {
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/signin'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      })

      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        setCurrentPage('home')
        alert(data.message)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Auth error:', error)
      alert('Authentication failed')
    }
  }

  const handlePurchaseNode = async () => {
    if (!selectedNode || !transactionHash) {
      alert('Please provide transaction hash')
      return
    }

    try {
      const response = await fetch('/api/nodes/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: selectedNode.id,
          transactionHash
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
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: withdrawType,
          amount: parseFloat(withdrawAmount)
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
    setCurrentPage('home')
    setUserProfile(null)
    setUserNodes([])
    setReferrals([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Auth Pages
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              {authMode === 'signup' ? 'Sign Up' : 'Sign In'}
            </CardTitle>
            <p className="text-white/80">
              {authMode === 'signup' ? 'Create account & get 25 TRX bonus!' : 'Welcome back to MineTRXWith'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={authData.username}
                  onChange={(e) => setAuthData({...authData, username: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  required
                />
              </div>
              
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={authData.password}
                  onChange={(e) => setAuthData({...authData, password: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {authMode === 'signup' && (
                <div>
                  <Input
                    type="text"
                    placeholder="Referral Code (Optional)"
                    value={authData.referralCode}
                    onChange={(e) => setAuthData({...authData, referralCode: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                {authMode === 'signup' ? 'Sign Up & Claim 25 TRX' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                className="text-white/80 hover:text-white"
                onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
              >
                {authMode === 'signup' ? 'Already have account? Sign In' : 'New here? Sign Up'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Navigation
  const NavButton = ({ page, icon: Icon, label, isActive }) => (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      className={`flex items-center gap-2 ${isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
      onClick={() => setCurrentPage(page)}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )

  // Homepage
  const HomePage = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Mine<span className="text-green-400">TRX</span>With
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          The most trusted TRX mining platform. Start mining today and earn passive income!
        </p>
      </div>

      {/* Live Withdrawals */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Live Withdrawals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {liveWithdrawals.map((withdrawal, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-white/80">{withdrawal.username}</span>
                <span className="text-green-400 font-semibold">{withdrawal.amount} TRX</span>
                <span className="text-white/60 text-sm">
                  {new Date(withdrawal.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mining Farm Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <Server className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Biggest Mining Farm</h3>
            <p className="text-white/80">State-of-the-art mining infrastructure with 99.9% uptime</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Legal Platform</h3>
            <p className="text-white/80">Fully compliant and regulated mining operations</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <Coins className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Proven Returns</h3>
            <p className="text-white/80">Consistent mining rewards with transparent payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Mining Nodes */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-white text-center">Choose Your Mining Node</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {miningNodes.map((node) => {
            const userNode = userNodes.find(un => un.nodeId === node.id && un.status === 'running')
            const isRunning = !!userNode
            
            return (
              <Card key={node.id} className={`bg-white/10 backdrop-blur-md border-white/20 ${isRunning ? 'ring-2 ring-green-400' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    {node.name}
                    {isRunning && <Badge className="bg-green-500 text-white">Running</Badge>}
                  </CardTitle>
                  <p className="text-white/80">{node.storage}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Price:</span>
                      <span className="text-green-400 font-semibold">{node.price} TRX</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Mining:</span>
                      <span className="text-white">{node.mining} TRX</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Duration:</span>
                      <span className="text-white">{node.duration} days</span>
                    </div>
                  </div>
                  
                  {isRunning && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Progress:</span>
                        <span className="text-white">{Math.round(userNode.progress)}%</span>
                      </div>
                      <Progress value={userNode.progress} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Ends:</span>
                        <span className="text-white">{new Date(userNode.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    onClick={() => {
                      setSelectedNode(node)
                      setShowPayment(true)
                    }}
                    disabled={isRunning}
                  >
                    {isRunning ? 'Active' : `Buy for ${node.price} TRX`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Purchase {selectedNode.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-white/80">Send exactly <strong className="text-green-400">{selectedNode.price} TRX</strong> to:</p>
                <div className="flex items-center gap-2 p-3 bg-white/5 rounded">
                  <code className="text-white flex-1 text-sm break-all">{TRX_RECEIVE_ADDRESS}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(TRX_RECEIVE_ADDRESS)}
                    className="text-white/80 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Input
                  type="text"
                  placeholder="Enter transaction hash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
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
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchaseNode}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  I Already Paid
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
        <h2 className="text-3xl font-bold text-white mb-2">Profile</h2>
        <p className="text-white/80">Welcome back, {userProfile?.username}!</p>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Mine Balance */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-400" />
              Mine Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {userProfile?.mineBalance || 0} TRX
              </div>
              <p className="text-white/80 text-sm">Includes signup bonus + mining rewards</p>
            </div>
            
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
              <Button
                onClick={() => {
                  setWithdrawType('mine')
                  handleWithdraw()
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Withdraw Mine Balance
              </Button>
            </div>
            
            <div className="text-xs text-white/60 space-y-1">
              <p>• Minimum: 25 TRX</p>
              <p>• Must buy any node for first withdrawal</p>
              {userProfile?.hasActiveMining && (
                <p className="text-green-400">✓ Can withdraw immediately</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referral Balance */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Referral Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {userProfile?.referralBalance || 0} TRX
              </div>
              <p className="text-white/80 text-sm">Earned from referrals</p>
            </div>
            
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
              <Button
                onClick={() => {
                  setWithdrawType('referral')
                  handleWithdraw()
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                Withdraw Referral Balance
              </Button>
            </div>
            
            <div className="text-xs text-white/60 space-y-1">
              <p>• Minimum: 50 TRX</p>
              <p>• Must buy Node 4 (1024 GB) first</p>
              {userProfile?.hasBoughtNode4 && (
                <p className="text-green-400">✓ Can withdraw referral balance</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Nodes */}
      {userNodes.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-green-400" />
              Active Mining Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userNodes.map((userNode) => {
                const node = miningNodes.find(n => n.id === userNode.nodeId)
                return (
                  <div key={userNode.id} className="p-4 bg-white/5 rounded space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-semibold">{node?.name}</h4>
                      <Badge className="bg-green-500 text-white">{userNode.status}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Progress:</span>
                        <span className="text-white">{Math.round(userNode.progress)}%</span>
                      </div>
                      <Progress value={userNode.progress} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Mining:</span>
                      <span className="text-green-400">{userNode.miningAmount} TRX</span>
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
        <h2 className="text-3xl font-bold text-white mb-2">Referral System</h2>
        <p className="text-white/80">Invite friends and earn 50 TRX per valid referral!</p>
      </div>

      {/* Referral Code */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-400" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded">
            <code className="text-white flex-1 text-lg font-bold">{userProfile?.referralCode}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(userProfile?.referralCode)}
              className="text-white/80 hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-white/80 text-sm">Share this code with friends to earn referral rewards!</p>
        </CardContent>
      </Card>

      {/* Referral Info */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <div>
              <h4 className="text-white font-semibold">Share Your Code</h4>
              <p className="text-white/80 text-sm">Friends sign up using your referral code</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <div>
              <h4 className="text-white font-semibold">They Buy a Node</h4>
              <p className="text-white/80 text-sm">Referral becomes valid when they purchase any mining node</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <div>
              <h4 className="text-white font-semibold">You Earn 50 TRX</h4>
              <p className="text-white/80 text-sm">Instant reward added to your referral balance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              Invalid Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                {referrals.filter(r => !r.isValid).length}
              </div>
              <p className="text-white/80 text-sm">Signed up but haven't bought nodes yet</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Valid Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {referrals.filter(r => r.isValid).length}
              </div>
              <p className="text-white/80 text-sm">Bought nodes and earned you rewards</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex justify-between items-center p-3 bg-white/5 rounded">
                  <div>
                    <div className="text-white font-semibold">{referral.referredUsername || 'User'}</div>
                    <div className="text-white/60 text-sm">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={referral.isValid ? 'bg-green-500' : 'bg-orange-500'}>
                    {referral.isValid ? 'Valid' : 'Invalid'}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">Mine<span className="text-green-400">TRX</span>With</h1>
            </div>
            
            <nav className="flex items-center gap-2">
              <NavButton page="home" icon={Home} label="Home" isActive={currentPage === 'home'} />
              <NavButton page="profile" icon={User} label="Profile" isActive={currentPage === 'profile'} />
              <NavButton page="referral" icon={Users} label="Referral" isActive={currentPage === 'referral'} />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white/80 hover:text-white hover:bg-white/10 ml-2"
              >
                Sign Out
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'profile' && <ProfilePage />}
        {currentPage === 'referral' && <ReferralPage />}
      </main>
    </div>
  )
}