import { supabase } from './supabase'

/**
 * Enhanced TRX Transaction Verification Service
 * Uses Trongrid API for real blockchain verification with improved security and performance
 */
export class EnhancedTRXVerifier {
  constructor() {
    this.trongridApiKey = process.env.TRONGRID_API_KEY
    this.baseUrl = 'https://api.trongrid.io'
    this.maxRetries = 3
    this.retryDelay = 1000 // 1 second
  }

  /**
   * Verify TRX transaction with comprehensive validation
   */
  async verifyTransaction(transactionHash, expectedAmount, expectedToAddress, userId = null) {
    try {
      // Input validation
      const validation = this.validateInput(transactionHash, expectedAmount, expectedToAddress)
      if (!validation.valid) {
        return validation
      }

      // Check if transaction hash is already used (security measure)
      const duplicateCheck = await this.checkTransactionDuplicate(transactionHash)
      if (!duplicateCheck.valid) {
        return duplicateCheck
      }

      // Log verification attempt
      await this.logVerificationAttempt(transactionHash, 'pending')

      // Perform actual blockchain verification with retries
      const verificationResult = await this.performBlockchainVerification(
        transactionHash, 
        expectedAmount, 
        expectedToAddress
      )

      // Log final result
      await this.logVerificationResult(transactionHash, verificationResult)

      return verificationResult
    } catch (error) {
      console.error('TRX Verification Error:', error)
      await this.logVerificationResult(transactionHash, {
        valid: false,
        error: 'Verification service error',
        details: error.message
      })
      
      return {
        valid: false,
        error: 'Transaction verification failed due to service error',
        details: error.message
      }
    }
  }

  /**
   * Validate input parameters
   */
  validateInput(transactionHash, expectedAmount, expectedToAddress) {
    if (!transactionHash || typeof transactionHash !== 'string') {
      return { valid: false, error: 'Transaction hash is required' }
    }

    // TRON transaction hash is 64 characters (hex)
    if (transactionHash.length !== 64 || !/^[a-fA-F0-9]+$/.test(transactionHash)) {
      return { valid: false, error: 'Invalid transaction hash format' }
    }

    if (!expectedAmount || expectedAmount <= 0) {
      return { valid: false, error: 'Invalid expected amount' }
    }

    if (!expectedToAddress || typeof expectedToAddress !== 'string') {
      return { valid: false, error: 'Expected recipient address is required' }
    }

    // Basic TRON address validation (starts with T and 34 characters)
    if (!expectedToAddress.startsWith('T') || expectedToAddress.length !== 34) {
      return { valid: false, error: 'Invalid TRON address format' }
    }

    return { valid: true }
  }

  /**
   * Check if transaction hash is already used in the system
   */
  async checkTransactionDuplicate(transactionHash) {
    try {
      // Check in user_nodes table
      const { data: existingNode } = await supabase
        .from('user_nodes')
        .select('id, user_id, created_at')
        .eq('transaction_hash', transactionHash)
        .single()

      if (existingNode) {
        return {
          valid: false,
          error: 'Transaction hash already used',
          details: `Already used in node purchase on ${new Date(existingNode.created_at).toLocaleString()}`
        }
      }

      // Check in withdrawals table
      const { data: existingWithdrawal } = await supabase
        .from('withdrawals')
        .select('id, user_id, created_at')
        .eq('transaction_hash', transactionHash)
        .single()

      if (existingWithdrawal) {
        return {
          valid: false,
          error: 'Transaction hash already used in withdrawals',
          details: `Already used in withdrawal on ${new Date(existingWithdrawal.created_at).toLocaleString()}`
        }
      }

      return { valid: true }
    } catch (error) {
      // If no records found, that's good (single() throws when no data)
      if (error.code === 'PGRST116') {
        return { valid: true }
      }
      throw error
    }
  }

  /**
   * Perform actual blockchain verification with Trongrid API
   */
  async performBlockchainVerification(transactionHash, expectedAmount, expectedToAddress) {
    let lastError = null
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.callTrongridAPI(transactionHash, expectedAmount, expectedToAddress)
        
        if (result.valid) {
          await this.updateVerificationAttempts(transactionHash, attempt, 'verified')
          return result
        } else {
          lastError = result
          await this.updateVerificationAttempts(transactionHash, attempt, 'failed', result.error)
          
          // If it's a definitive failure (not a network issue), don't retry
          if (this.isDefinitiveFailure(result.error)) {
            break
          }
        }
      } catch (error) {
        lastError = { valid: false, error: 'Network error', details: error.message }
        await this.updateVerificationAttempts(transactionHash, attempt, 'failed', error.message)
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt) // Exponential backoff
        }
      }
    }

    return lastError || { valid: false, error: 'Verification failed after all retries' }
  }

  /**
   * Call Trongrid API to verify transaction
   */
  async callTrongridAPI(transactionHash, expectedAmount, expectedToAddress) {
    const url = `${this.baseUrl}/v1/transactions/${transactionHash}`
    const headers = {
      'TRON-PRO-API-KEY': this.trongridApiKey,
      'Content-Type': 'application/json'
    }

    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: 'Transaction not found on blockchain' }
      }
      throw new Error(`Trongrid API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return this.validateTransactionData(data, expectedAmount, expectedToAddress)
  }

  /**
   * Validate transaction data from Trongrid API response
   */
  validateTransactionData(data, expectedAmount, expectedToAddress) {
    try {
      // Check if transaction exists and is successful
      if (!data.ret || data.ret.length === 0) {
        return { valid: false, error: 'Transaction not found or invalid' }
      }

      const transactionResult = data.ret[0]
      if (transactionResult.contractRet !== 'SUCCESS') {
        return { 
          valid: false, 
          error: `Transaction failed with status: ${transactionResult.contractRet}`,
          details: transactionResult.message || 'No additional details'
        }
      }

      // Validate transaction type and contract details
      const contract = data.raw_data?.contract?.[0]
      if (!contract) {
        return { valid: false, error: 'No contract data found in transaction' }
      }

      if (contract.type !== 'TransferContract') {
        return { 
          valid: false, 
          error: `Invalid transaction type: ${contract.type}. Expected: TransferContract` 
        }
      }

      const transferData = contract.parameter.value
      if (!transferData) {
        return { valid: false, error: 'No transfer data found in contract' }
      }

      // Validate amount (TRON uses SUN as the smallest unit, 1 TRX = 1,000,000 SUN)
      const actualAmountSun = transferData.amount
      const expectedAmountSun = expectedAmount * 1000000
      
      if (actualAmountSun !== expectedAmountSun) {
        return {
          valid: false,
          error: `Amount mismatch. Expected: ${expectedAmount} TRX, Got: ${actualAmountSun / 1000000} TRX`
        }
      }

      // Validate recipient address
      const toAddressHex = transferData.to_address
      if (!toAddressHex) {
        return { valid: false, error: 'No recipient address found in transaction' }
      }

      // Convert hex address to base58
      const TronWeb = require('tronweb')
      const toAddressBase58 = TronWeb.address.fromHex(toAddressHex)
      
      if (toAddressBase58 !== expectedToAddress) {
        return {
          valid: false,
          error: `Recipient address mismatch. Expected: ${expectedToAddress}, Got: ${toAddressBase58}`
        }
      }

      // Get transaction timestamp
      const blockTimestamp = data.block_timestamp || Date.now()
      const transactionTime = new Date(blockTimestamp)

      // Additional security: Check if transaction is too old (e.g., older than 24 hours)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      if (Date.now() - transactionTime.getTime() > maxAge) {
        return {
          valid: false,
          error: 'Transaction is too old (older than 24 hours)',
          details: `Transaction timestamp: ${transactionTime.toISOString()}`
        }
      }

      // All validations passed
      return {
        valid: true,
        transactionHash: data.txID,
        amount: actualAmountSun / 1000000,
        fromAddress: TronWeb.address.fromHex(transferData.owner_address),
        toAddress: toAddressBase58,
        blockNumber: data.blockNumber,
        blockTimestamp: transactionTime.toISOString(),
        energyUsed: data.receipt?.energy_usage || 0,
        bandwidth: data.receipt?.net_usage || 0,
        fee: (data.receipt?.energy_fee || 0) / 1000000, // Convert from SUN to TRX
        confirmations: data.confirmations || 0
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to parse transaction data',
        details: error.message
      }
    }
  }

  /**
   * Log verification attempt to database
   */
  async logVerificationAttempt(transactionHash, status) {
    try {
      await supabase
        .from('transaction_verifications')
        .insert({
          transaction_hash: transactionHash,
          verification_status: status,
          verification_attempts: 1,
          first_attempt_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log verification attempt:', error)
    }
  }

  /**
   * Update verification attempts count
   */
  async updateVerificationAttempts(transactionHash, attempts, status, errorMessage = null) {
    try {
      const updateData = {
        verification_attempts: attempts,
        last_attempt_at: new Date().toISOString(),
        verification_status: status
      }

      if (status === 'verified') {
        updateData.verified_at = new Date().toISOString()
      }

      if (errorMessage) {
        updateData.error_message = errorMessage
      }

      await supabase
        .from('transaction_verifications')
        .update(updateData)
        .eq('transaction_hash', transactionHash)
    } catch (error) {
      console.error('Failed to update verification attempts:', error)
    }
  }

  /**
   * Log final verification result
   */
  async logVerificationResult(transactionHash, result) {
    try {
      const updateData = {
        verification_status: result.valid ? 'verified' : 'failed',
        last_attempt_at: new Date().toISOString()
      }

      if (result.valid) {
        updateData.verified_at = new Date().toISOString()
        updateData.trongrid_response = result
      } else {
        updateData.error_message = result.error
      }

      await supabase
        .from('transaction_verifications')
        .update(updateData)
        .eq('transaction_hash', transactionHash)
    } catch (error) {
      console.error('Failed to log verification result:', error)
    }
  }

  /**
   * Check if error is definitive (no point in retrying)
   */
  isDefinitiveFailure(error) {
    const definitiveErrors = [
      'Transaction not found',
      'Transaction failed',
      'Amount mismatch',
      'Recipient address mismatch',
      'Invalid transaction type',
      'Transaction hash already used',
      'Transaction is too old'
    ]
    
    return definitiveErrors.some(defError => error.includes(defError))
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get transaction verification history
   */
  async getVerificationHistory(transactionHash) {
    try {
      const { data, error } = await supabase
        .from('transaction_verifications')
        .select('*')
        .eq('transaction_hash', transactionHash)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get verification history:', error)
      return []
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats() {
    try {
      const { data, error } = await supabase
        .from('transaction_verifications')
        .select('verification_status')

      if (error) throw error

      const stats = data.reduce((acc, record) => {
        acc[record.verification_status] = (acc[record.verification_status] || 0) + 1
        return acc
      }, {})

      return {
        total: data.length,
        verified: stats.verified || 0,
        failed: stats.failed || 0,
        pending: stats.pending || 0,
        success_rate: data.length > 0 ? ((stats.verified || 0) / data.length * 100).toFixed(2) : 0
      }
    } catch (error) {
      console.error('Failed to get verification stats:', error)
      return null
    }
  }
}

export default EnhancedTRXVerifier