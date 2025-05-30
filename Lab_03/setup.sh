#!/bin/bash

echo "🚀 Group13 Token Sale - Local Development Setup"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "hardhat.config.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Setting up frontend..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start Hardhat local node: npm run node"
echo "2. Deploy contracts: npm run deploy:local"
echo "3. Start frontend: npm run frontend"
echo ""
echo "📖 See README.md for detailed instructions"
