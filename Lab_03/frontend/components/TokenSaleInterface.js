import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import deploymentInfo from '../deployment.json'

// ABI for the contracts
const tokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)"
]

const saleABI = [
  "function token() view returns (address)",
  "function owner() view returns (address)",
  "function contractCreationTime() view returns (uint256)",
  "function basePrice() view returns (uint256)",
  "function getCurrentPrice() view returns (uint256)",
  "function getPriceBreakdown() view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256)",
  "function buyTokens(uint256) payable",
  "function sellTokens(uint256)",
  "function getContractInfo() view returns (uint256, uint256, uint256, uint256)",
  "event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost)",
  "event TokensSold(address indexed seller, uint256 amount, uint256 ethReceived)",
  "event PriceUpdated(uint256 newPrice)"
]

export default function TokenSaleInterface({ provider, signer, account }) {
  const [tokenContract, setTokenContract] = useState(null)
  const [saleContract, setSaleContract] = useState(null)
  const [tokenInfo, setTokenInfo] = useState({})
  const [contractInfo, setContractInfo] = useState({})
  const [userTokenBalance, setUserTokenBalance] = useState('0')
  const [userEthBalance, setUserEthBalance] = useState('0')
  const [buyAmount, setBuyAmount] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [currentPrice, setCurrentPrice] = useState('0')
  const [currentPriceRaw, setCurrentPriceRaw] = useState(0n) // Store raw BigInt for precision
  const [previousPrice, setPreviousPrice] = useState('0')
  const [priceChangeIndicator, setPriceChangeIndicator] = useState('')
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [mode, setMode] = useState('buy') // 'buy' or 'sell'
  const [transactionHistory, setTransactionHistory] = useState([])
  const [showPriceDetails, setShowPriceDetails] = useState(false)
  const [priceBreakdown, setPriceBreakdown] = useState(null)

  // Helper function to format price with high precision
  const formatPriceWithPrecision = (priceInWei, decimals = 10) => {
    if (!priceInWei) return '0.0000000000'
    try {
      const formatted = ethers.formatEther(priceInWei)
      return parseFloat(formatted).toFixed(decimals)
    } catch (error) {
      return '0.0000000000'
    }
  }

  useEffect(() => {
    initializeContracts()
  }, [provider, signer])

  // Auto-refresh price every 10 seconds to show dynamic changes
  useEffect(() => {
    if (!saleContract) return

    const interval = setInterval(async () => {
      try {
        const price = await saleContract.getCurrentPrice()
        const newPriceStr = ethers.formatEther(price)
        
        // Check for price changes
        if (currentPrice !== '0' && newPriceStr !== currentPrice) {
          const oldPrice = parseFloat(currentPrice)
          const newPrice = parseFloat(newPriceStr)
          
          if (newPrice > oldPrice) {
            setPriceChangeIndicator('↗️ +' + ((newPrice - oldPrice) / oldPrice * 100).toFixed(4) + '%')
          } else if (newPrice < oldPrice) {
            setPriceChangeIndicator('↘️ -' + ((oldPrice - newPrice) / oldPrice * 100).toFixed(4) + '%')
          }
          
          // Clear indicator after 5 seconds
          setTimeout(() => setPriceChangeIndicator(''), 5000)
        }
        
        setPreviousPrice(currentPrice)
        setCurrentPriceRaw(price)
        setCurrentPrice(newPriceStr)
        
        // Update contract info with new price
        setContractInfo(prev => ({
          ...prev,
          currentPrice: price
        }))
        
        // Also update price breakdown
        await loadPriceBreakdown(saleContract)
      } catch (error) {
        console.error('Error refreshing price:', error)
      }
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [saleContract])

  const initializeContracts = async () => {
    try {
      if (!deploymentInfo.tokenAddress || !deploymentInfo.saleAddress) {
        console.error('Deployment addresses not found. Please deploy contracts first.')
        return
      }

      const token = new ethers.Contract(deploymentInfo.tokenAddress, tokenABI, provider)
      const sale = new ethers.Contract(deploymentInfo.saleAddress, saleABI, provider)

      setTokenContract(token)
      setSaleContract(sale)

      await loadTokenInfo(token)
      await loadContractInfo(sale)
      
      if (account) {
        await loadUserBalances(token, sale)
      }
    } catch (error) {
      console.error('Error initializing contracts:', error)
    }
  }

  const loadTokenInfo = async (token) => {
    try {
      const name = await token.name()
      const symbol = await token.symbol()
      const totalSupply = await token.totalSupply()
      const decimals = await token.decimals()

      setTokenInfo({
        name,
        symbol,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        decimals
      })
    } catch (error) {
      console.error('Error loading token info:', error)
    }
  }

  const loadPriceBreakdown = async (sale) => {
    try {
      const breakdown = await sale.getPriceBreakdown()
      setPriceBreakdown({
        currentPrice: breakdown[0],
        basePrice: breakdown[1],
        ethBalance: breakdown[2],
        timeInSeconds: breakdown[3],
        timeInDays: breakdown[4],
        dailyInterestRate: breakdown[5],
        compoundFactor: breakdown[6]
      })
    } catch (error) {
      console.error('Error loading price breakdown:', error)
    }
  }

  const loadContractInfo = async (sale) => {
    try {
      const price = await sale.getCurrentPrice()
      const info = await sale.getContractInfo()
      
      setCurrentPriceRaw(price) // Store raw BigInt
      setCurrentPrice(ethers.formatEther(price))
      setContractInfo({
        currentPrice: price, // Store raw BigInt instead of formatted string
        contractTokenBalance: ethers.formatUnits(info[1], 18),
        contractEthBalance: ethers.formatEther(info[2]),
        timeSinceCreation: Number(info[3]) // Time since contract creation
      })

      // Load detailed price breakdown
      await loadPriceBreakdown(sale)
    } catch (error) {
      console.error('Error loading contract info:', error)
    }
  }

  const loadUserBalances = async (token, sale) => {
    try {
      const tokenBalance = await token.balanceOf(account)
      const ethBalance = await provider.getBalance(account)

      setUserTokenBalance(ethers.formatUnits(tokenBalance, 18))
      setUserEthBalance(ethers.formatEther(ethBalance))
    } catch (error) {
      console.error('Error loading user balances:', error)
    }
  }

  const refreshData = async () => {
    if (tokenContract && saleContract) {
      await loadContractInfo(saleContract)
      if (account) {
        await loadUserBalances(tokenContract, saleContract)
      }
    }
  }

  const handleBuyTokens = async () => {
    if (!buyAmount || !saleContract || !signer) return

    setLoading(true)
    setTxHash('')

    try {
      const tokenAmount = ethers.parseUnits(buyAmount, 18)
      const price = await saleContract.getCurrentPrice()
      const totalCost = (price * tokenAmount) / ethers.parseUnits('1', 18)
      
      // Add a small buffer (0.1%) to handle precision differences
      const buffer = totalCost / 1000n // 0.1% buffer
      const totalCostWithBuffer = totalCost + buffer

      console.log('Buy transaction details:')
      console.log('- Token amount:', ethers.formatUnits(tokenAmount, 18), 'tokens')
      console.log('- Current price:', ethers.formatEther(price), 'ETH per token')
      console.log('- Total cost:', ethers.formatEther(totalCost), 'ETH')
      console.log('- Total cost with buffer:', ethers.formatEther(totalCostWithBuffer), 'ETH')

      const saleWithSigner = saleContract.connect(signer)
      const tx = await saleWithSigner.buyTokens(tokenAmount, {
        value: totalCostWithBuffer,
        gasLimit: 300000
      })

      setTxHash(tx.hash)
      console.log('Transaction sent:', tx.hash)

      await tx.wait()
      console.log('Transaction confirmed!')

      // Add to transaction history
      addToHistory('BUY', buyAmount, ethers.formatEther(price), tx.hash)

      setBuyAmount('')
      addToHistory('buy', tokenAmount, totalCost, tx.hash)
      await refreshData()
    } catch (error) {
      console.error('Error buying tokens:', error)
      
      let errorMessage = 'Unknown error occurred'
      if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient ETH balance to complete transaction'
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Transaction will likely fail. Check contract conditions.'
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas + transaction value'
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Transaction reverted: ' + error.reason || 'Check contract requirements'
      } else {
        errorMessage = error.message
      }
      
      alert('Error buying tokens: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSellTokens = async () => {
    if (!sellAmount || !saleContract || !tokenContract || !signer) return

    setLoading(true)
    setTxHash('')

    try {
      const tokenAmount = ethers.parseUnits(sellAmount, 18)

      // First approve the sale contract to spend tokens
      const tokenWithSigner = tokenContract.connect(signer)
      const approveTx = await tokenWithSigner.approve(deploymentInfo.saleAddress, tokenAmount)
      await approveTx.wait()

      // Then sell the tokens
      const saleWithSigner = saleContract.connect(signer)
      const tx = await saleWithSigner.sellTokens(tokenAmount, {
        gasLimit: 300000
      })

      setTxHash(tx.hash)
      console.log('Transaction sent:', tx.hash)

      await tx.wait()
      console.log('Transaction confirmed!')

      // Add to transaction history  
      const price = await saleContract.getCurrentPrice()
      addToHistory('SELL', sellAmount, ethers.formatEther(price), tx.hash)

      setSellAmount('')
      addToHistory('sell', tokenAmount, currentPrice, tx.hash)
      await refreshData()
    } catch (error) {
      console.error('Error selling tokens:', error)
      alert('Error selling tokens: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const addToHistory = (type, amount, price, txHash) => {
    const newTransaction = {
      id: Date.now(),
      type,
      amount,
      price,
      txHash,
      timestamp: new Date().toLocaleTimeString()
    }
    setTransactionHistory(prev => [newTransaction, ...prev.slice(0, 9)]) // Keep last 10
  }

  const getPriceBreakdown = () => {
    if (!contractInfo.contractEthBalance || !contractInfo.timeSinceCreation) {
      return null
    }
    
    try {
      const basePrice = 5 // 5 ETH
      const ethBalance = parseFloat(contractInfo.contractEthBalance)
      const daysElapsed = contractInfo.timeSinceCreation / (24 * 60 * 60) // Convert seconds to days
      const interestRate = ethBalance / (2 * Math.pow(10, 9))
      const priceIncrease = basePrice * interestRate * daysElapsed
      
      return {
        basePrice: basePrice.toFixed(6),
        ethBalance: ethBalance.toFixed(4),
        daysElapsed: daysElapsed.toFixed(6),
        interestRate,
        priceIncrease: priceIncrease.toFixed(6),
        totalPrice: (basePrice + priceIncrease).toFixed(6)
      }
    } catch (error) {
      console.error('Error calculating price breakdown:', error)
      return null
    }
  }

  const calculateEstimatedCost = () => {
    if (!buyAmount || !currentPriceRaw) return '0'
    try {
      const tokenAmount = ethers.parseUnits(buyAmount, 18)
      const totalCost = (currentPriceRaw * tokenAmount) / ethers.parseUnits('1', 18)
      return ethers.formatEther(totalCost)
    } catch (error) {
      return '0'
    }
  }

  const calculateEstimatedReceive = () => {
    if (!sellAmount || !currentPriceRaw) return '0'
    try {
      const tokenAmount = ethers.parseUnits(sellAmount, 18)
      const totalReceive = (currentPriceRaw * tokenAmount) / ethers.parseUnits('1', 18)
      return ethers.formatEther(totalReceive)
    } catch (error) {
      return '0'
    }
  }

  const formatTimeAgo = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day(s)`
    if (hours > 0) return `${hours} hour(s)`
    if (minutes > 0) return `${minutes} minute(s)`
    return `${seconds} second(s)`
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Group13 Token Exchange</h1>
        
        {/* Token Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Token Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {tokenInfo.name}</p>
              <p><span className="font-medium">Symbol:</span> {tokenInfo.symbol}</p>
              <p><span className="font-medium">Total Supply:</span> {parseFloat(tokenInfo.totalSupply).toLocaleString()} tokens</p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Contract Status</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Current Price:</span> 
                <span className="font-mono text-lg ml-2">{formatPriceWithPrecision(contractInfo.currentPrice, 12)} ETH</span>
                {priceChangeIndicator && (
                  <span className="ml-2 text-sm bg-yellow-100 px-2 py-1 rounded animate-pulse">
                    {priceChangeIndicator}
                  </span>
                )}
              </p>
              
              {/* Price breakdown button */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setShowPriceDetails(!showPriceDetails)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {showPriceDetails ? 'Hide' : 'Show'} Price Breakdown
                </button>
                <button
                  onClick={() => refreshData()}
                  className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                >
                  🔄 Refresh Price
                </button>
              </div>
              
              {/* Detailed price breakdown */}
              {showPriceDetails && priceBreakdown && (
                <div className="mt-2 p-3 bg-blue-50 rounded text-xs space-y-1">
                  <p><strong>Base Price:</strong> {ethers.formatEther(priceBreakdown.basePrice)} ETH</p>
                  <p><strong>ETH Balance:</strong> {ethers.formatEther(priceBreakdown.ethBalance)} ETH</p>
                  <p><strong>Time Elapsed:</strong> {ethers.formatUnits(priceBreakdown.timeInDays, 18)} days</p>
                  <p><strong>Daily Interest Rate:</strong> {(parseFloat(ethers.formatUnits(priceBreakdown.dailyInterestRate, 18)) * 100).toFixed(8)}% per day</p>
                  <p><strong>Compound Factor:</strong> {ethers.formatUnits(priceBreakdown.compoundFactor, 18)}</p>
                  <p><strong>Formula:</strong> BasePrice × (1 + InterestRate)^Days (compound interest)</p>
                  <p><strong>Calculated Price:</strong> {ethers.formatEther(priceBreakdown.currentPrice)} ETH</p>
                </div>
              )}
              
              <p><span className="font-medium">Available Tokens:</span> {parseFloat(contractInfo.contractTokenBalance).toLocaleString()}</p>
              <p><span className="font-medium">Contract ETH:</span> {parseFloat(contractInfo.contractEthBalance).toFixed(4)} ETH</p>
              <p><span className="font-medium">Contract Age:</span> {contractInfo.timeSinceCreation ? formatTimeAgo(contractInfo.timeSinceCreation) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* User Balances */}
        {account && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Balances</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <p><span className="font-medium">G13 Tokens:</span> {parseFloat(userTokenBalance).toLocaleString()}</p>
              <p><span className="font-medium">ETH:</span> {parseFloat(userEthBalance).toFixed(4)} ETH</p>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMode('buy')}
            className={`px-6 py-2 rounded-lg font-medium ${
              mode === 'buy'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Buy Tokens
          </button>
          <button
            onClick={() => setMode('sell')}
            className={`px-6 py-2 rounded-lg font-medium ${
              mode === 'sell'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sell Tokens
          </button>
        </div>

        {/* Buy/Sell Interface */}
        {mode === 'buy' ? (
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">Buy Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tokens to Buy
                </label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
              </div>
              
              {buyAmount && (
                <div className="bg-white p-3 rounded-md border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600">
                    Estimated Cost: <span className="font-bold text-blue-600 font-mono text-lg">{parseFloat(calculateEstimatedCost()).toFixed(10)} ETH</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {buyAmount} tokens × {formatPriceWithPrecision(contractInfo.currentPrice, 12)} ETH/token
                  </p>
                </div>
              )}

              <button
                onClick={handleBuyTokens}
                disabled={!buyAmount || loading || !account}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Buy Tokens'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-red-800 mb-4">Sell Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tokens to Sell
                </label>
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  max={userTokenBalance}
                />
              </div>
              
              {sellAmount && (
                <div className="bg-white p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    You'll Receive: <span className="font-bold text-red-600">{calculateEstimatedReceive()} ETH</span>
                  </p>
                </div>
              )}

              <button
                onClick={handleSellTokens}
                disabled={!sellAmount || loading || !account || parseFloat(sellAmount) > parseFloat(userTokenBalance)}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-md font-medium hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Sell Tokens'}
              </button>
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {txHash && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Transaction Hash:</span>
              <br />
              <code className="text-xs break-all">{txHash}</code>
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={refreshData}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Refresh Data
        </button>

        {/* Price Information */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-yellow-800">Dynamic Pricing Information</h4>
            <button
              onClick={() => setShowPriceDetails(!showPriceDetails)}
              className="text-sm text-yellow-600 hover:text-yellow-800"
            >
              {showPriceDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          {showPriceDetails && (() => {
            const breakdown = getPriceBreakdown();
            return breakdown && (
              <div className="bg-white p-3 rounded-md mb-3 text-sm">
                <h5 className="font-medium mb-2">Price Calculation Breakdown:</h5>
                <div className="space-y-1 text-xs">
                  <p>• Base Price: {breakdown.basePrice} ETH</p>
                  <p>• Contract ETH Balance: {breakdown.ethBalance} ETH</p>
                  <p>• Days Elapsed: {breakdown.daysElapsed} days</p>
                  <p>• Interest Rate: {(breakdown.interestRate * 100).toExponential(2)}% per day</p>
                  <p>• Price Increase: {breakdown.priceIncrease} ETH</p>
                  <p className="font-bold">• Total Current Price: {breakdown.totalPrice} ETH</p>
                </div>
              </div>
            );
          })()}
          
          <p className="text-sm text-yellow-700">
            • Token price starts at 5 ETH and increases over time<br/>
            • Interest Rate = Contract ETH Balance ÷ (2 × 10⁹)<br/>
            • Price increases continuously since contract creation<br/>
            • More ETH in contract = faster price increases
          </p>
        </div>

        {/* Transaction History */}
        {transactionHistory.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-3">Recent Transactions</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactionHistory.map((tx) => (
                <div key={tx.id} className="bg-white p-2 rounded border text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`font-bold ${tx.type === 'BUY' ? 'text-blue-600' : 'text-red-600'}`}>
                        {tx.type}
                      </span>
                      <span className="ml-2">{tx.amount} tokens @ {parseFloat(tx.price).toFixed(6)} ETH</span>
                    </div>
                    <span className="text-gray-500 text-xs">{tx.timestamp}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    TX: {tx.txHash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        {transactionHistory.length > 0 && (
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-md shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-3">Transaction History</h4>
            <div className="space-y-2">
              {transactionHistory.map(tx => (
                <div key={tx.id} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{tx.timestamp}</span>
                    <span className="font-medium">{tx.type === 'buy' ? 'Purchased' : 'Sold'}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800">
                    <span>{parseFloat(tx.amount).toLocaleString()} G13 Tokens</span>
                    <span>{parseFloat(tx.price).toFixed(4)} ETH</span>
                  </div>
                  <div className="mt-1">
                    <a
                      href={`https://etherscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View on Etherscan
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Calculation Details */}
        {showPriceDetails && (() => {
          const breakdown = getPriceBreakdown();
          return breakdown && (
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-md shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3">Price Calculation Details</h4>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  • Base Price: <span className="font-medium">{breakdown.basePrice} ETH</span>
                </p>
                <p className="text-sm text-gray-600">
                  • ETH Balance in Contract: <span className="font-medium">{breakdown.ethBalance} ETH</span>
                </p>
                <p className="text-sm text-gray-600">
                  • Days Elapsed Since Creation: <span className="font-medium">{breakdown.daysElapsed} days</span>
                </p>
                <p className="text-sm text-gray-600">
                  • Interest Rate: <span className="font-medium">{(breakdown.interestRate * 100).toFixed(6)}%</span>
                </p>
                <p className="text-sm text-gray-600">
                  • Price Increase: <span className="font-medium">{breakdown.priceIncrease} ETH</span>
                </p>
                <p className="text-sm text-gray-600">
                  • Total Price: <span className="font-medium">{breakdown.totalPrice} ETH</span>
                </p>
              </div>
            </div>
          );
        })()}

        {/* Toggle Price Details Button */}
        <button
          onClick={() => setShowPriceDetails(!showPriceDetails)}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          {showPriceDetails ? 'Hide Price Details' : 'Show Price Details'}
        </button>
      </div>
    </div>
  )
}
