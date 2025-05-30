import Head from 'next/head'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import TokenSaleInterface from '../components/TokenSaleInterface'

export default function Home() {
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [networkName, setNetworkName] = useState('')

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        const network = await provider.getNetwork()
        
        setProvider(provider)
        setSigner(signer)
        setAccount(address)
        setNetworkName(network.name)
        setIsConnected(true)
        
        console.log('Connected to:', address)
        console.log('Network:', network.name)
      } catch (error) {
        console.error('Error connecting wallet:', error)
        alert('Error connecting wallet. Make sure MetaMask is installed and you have the Hardhat local network configured.')
      }
    } else {
      alert('Please install MetaMask to use this application!')
    }
  }

  const disconnectWallet = () => {
    setAccount('')
    setProvider(null)
    setSigner(null)
    setIsConnected(false)
    setNetworkName('')
  }

  useEffect(() => {
    // Check if already connected
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            connectWallet()
          }
        })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>Group13 Token Sale</title>
        <meta name="description" content="Group13 Token Sale DApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Group13 Token Sale
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Buy G13 tokens with our tiered pricing system
          </p>
          
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-4 inline-block">
              <p className="text-sm text-gray-600">Connected Account:</p>
              <p className="font-mono text-sm">{account}</p>
              <p className="text-sm text-gray-600 mt-2">Network: {networkName}</p>
              <button
                onClick={disconnectWallet}
                className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {isConnected && provider && signer && (
          <TokenSaleInterface provider={provider} signer={signer} account={account} />
        )}

        {!isConnected && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-8 max-w-2xl mx-auto">
            <p className="font-bold">Setup Instructions:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Make sure you have MetaMask installed</li>
              <li>Add Hardhat local network to MetaMask:</li>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Network Name: Hardhat</li>
                <li>RPC URL: http://127.0.0.1:8545</li>
                <li>Chain ID: 1337</li>
                <li>Currency Symbol: ETH</li>
              </ul>
              <li>Import a Hardhat account using one of the private keys</li>
              <li>Start the Hardhat local node: <code className="bg-gray-200 px-1 rounded">npx hardhat node</code></li>
              <li>Deploy contracts: <code className="bg-gray-200 px-1 rounded">npx hardhat run scripts/deploy.js --network localhost</code></li>
            </ol>
          </div>
        )}
      </main>
    </div>
  )
}
