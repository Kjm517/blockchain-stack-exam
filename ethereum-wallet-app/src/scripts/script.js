class EthereumWalletInterface {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.transactions = [];
        this.init();
    }

    init() {
        this.connectBtn = document.getElementById('connectBtn');
        this.walletInfo = document.getElementById('walletInfo');
        this.walletAddress = document.getElementById('walletAddress');
        this.balance = document.getElementById('balance');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.transactionsSection = document.getElementById('transactionsSection');
        this.loadingTransactions = document.getElementById('loadingTransactions');
        this.transactionsList = document.getElementById('transactionsList');
        this.statsSection = document.getElementById('statsSection');

        this.walletInfo.style.display = 'none';
        this.transactionsSection.style.display = 'none';
        this.statsSection.style.display = 'none';
        this.errorMessage.style.display = 'none';

        this.connectBtn.addEventListener('click', () => this.handleButtonClick());
        this.setupButtonHoverEffects();
        this.checkConnection();
    }

    setupButtonHoverEffects() {
        let originalText = '';

        this.connectBtn.addEventListener('mouseenter', () => {
            if (this.connectBtn.classList.contains('connected') && !this.connectBtn.disabled) {
                originalText = this.connectBtn.innerHTML;
                this.connectBtn.innerHTML = '<i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i>Disconnect';
            }
        });

        this.connectBtn.addEventListener('mouseleave', () => {
            if (this.connectBtn.classList.contains('connected') && !this.connectBtn.disabled && originalText) {
                this.connectBtn.innerHTML = originalText;
            }
        });
    }

    handleButtonClick() {
        if (this.connectBtn.classList.contains('connected')) {
            this.disconnect();
        } else {
            this.connectWallet();
        }
    }

    async checkConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await this.setupProvider();
                    await this.updateWalletInfo();

                    this.connectBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i>Connected';
                    this.connectBtn.classList.add('connected');
                    this.connectBtn.disabled = false;

                    setTimeout(() => {
                        // static transactions (demo data)
                        this.loadStaticTransactions();

                        // dynamic transactions
                        // this.loadDynamicTransactions();
                    }, 500);
                } else {
                    this.resetInterface();
                }
            } catch (error) {
                console.log('No previous connection found');
                this.resetInterface();
            }
        }
    }

    resetInterface() {
        this.walletInfo.style.display = 'none';
        this.transactionsSection.style.display = 'none';
        this.statsSection.style.display = 'none';

        this.connectBtn.innerHTML = '<i class="fas fa-wallet" style="margin-right: 8px;"></i>Connect Wallet';
        this.connectBtn.classList.remove('connected');
        this.connectBtn.disabled = false;
    }

    async connectWallet() {
        this.hideError();

        if (typeof window.ethereum === 'undefined') {
            this.showError('MetaMask is not installed. Please install MetaMask to continue.');
            return;
        }

        try {
            this.connectBtn.disabled = true;
            this.connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Connecting...';

            await window.ethereum.request({ method: 'eth_requestAccounts' });

            await this.setupProvider();
            await this.updateWalletInfo();

            this.connectBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i>Connected';
            this.connectBtn.classList.add('connected');
            this.connectBtn.disabled = false;

            setTimeout(() => {
                // static transactions (demo data)
                this.loadStaticTransactions();

                // Dynamic transactions (real blockchain data)
                // this.loadDynamicTransactions();
            }, 500);

        } catch (error) {
            this.handleError('Failed to connect wallet', error);
            this.resetInterface();
        }
    }

    async setupProvider() {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        this.userAddress = await this.signer.getAddress();

        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Switching...';
                this.connectBtn.disabled = true;
                this.checkConnection();
            }
        });

        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }

    async updateWalletInfo() {
        try {
            this.walletAddress.textContent = this.userAddress;

            const balance = await this.provider.getBalance(this.userAddress);
            const balanceInEth = ethers.formatEther(balance);
            this.balance.textContent = `${parseFloat(balanceInEth).toFixed(4)} ETH`;

            this.walletInfo.style.display = 'block';
            this.walletInfo.classList.add('fade-in');

        } catch (error) {
            this.handleError('Failed to fetch wallet information', error);
            this.walletInfo.style.display = 'none';
        }
    }

    // STATIC TRANSACTIONS (DEMO DATA)
    
    loadStaticTransactions() {
        this.transactionsSection.style.display = 'block';
        this.loadingTransactions.style.display = 'block';

        setTimeout(() => {
            this.displayStaticTransactions();
            this.updateStaticStats();
            this.loadingTransactions.style.display = 'none';
        }, 1000);
    }

    displayStaticTransactions() {
        const staticTransactions = [
            {
                hash: '0xa7b2c9e4f1d8a5b2c9e6f3a8d1b4e7f0c3a6b9d2e5f8a1b4c7e0d3f6a9b2c5e8',
                value: '2.500000',
                direction: 'incoming',
                address: '0x742d35Cc6634C0532925a3b8D400C465DcA2CD8A',
                date: '8/22/2025, 2:15 PM'
            },
            {
                hash: '0xc8f3e1d2a5b8c1f4e7a0d3b6c9e2f5a8b1d4e7f0c3a6b9d2e5f8a1b4c7e0d3f6',
                value: '0.750000',
                direction: 'outgoing',
                address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                date: '8/21/2025, 11:42 AM'
            },
            {
                hash: '0xb5e9f4a3d6c9b2e5f8a1d4b7e0c3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7',
                value: '1.250000',
                direction: 'incoming',
                address: '0xA0b86a33E6e9C4A4b0a8c4f0b5d7e8f9c3d2a1b0',
                date: '8/20/2025, 4:28 PM'
            },
            {
                hash: '0xd2a7b8c9e0f3a6b9c2d5e8f1a4b7c0d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1',
                value: '3.100000',
                direction: 'outgoing',
                address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
                date: '8/19/2025, 9:15 AM'
            },
            {
                hash: '0xe8f1c3d4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7e0d3f6a9b2c5e8',
                value: '5.000000',
                direction: 'incoming',
                address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                date: '8/18/2025, 7:33 PM'
            }
        ];

        this.transactionsList.innerHTML = staticTransactions.map((tx) => {
            return `
                <div class="transaction-item">
                    <div class="transaction-header">
                        <div class="transaction-hash">
                            ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}
                        </div>
                        <div class="transaction-value ${tx.direction}">
                            ${tx.direction === 'outgoing' ? '−' : '+'} ${tx.value} ETH
                        </div>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-address">
                            <span class="direction-badge ${tx.direction === 'outgoing' ? 'sent' : 'received'}">
                                <i class="fas fa-${tx.direction === 'outgoing' ? 'arrow-up' : 'arrow-down'}"></i>
                                ${tx.direction === 'outgoing' ? 'Sent' : 'Received'}
                            </span>
                            ${tx.address.slice(0, 10)}...${tx.address.slice(-8)}
                        </div>
                        <div class="transaction-date">
                            <i class="fas fa-clock"></i>
                            ${tx.date}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateStaticStats() {
        this.statsSection.style.display = 'grid';
        this.statsSection.classList.add('fade-in');
    }
    

    // DYNAMIC TRANSACTIONS (REAL BLOCKCHAIN DATA)
    /*
    async loadDynamicTransactions() {
        if (!this.provider || !this.userAddress) {
            console.log('Provider or user address not available');
            return;
        }
    
        // Show the transactions section and the loading screen
        this.transactionsSection.style.display = 'block';
        this.loadingTransactions.style.display = 'block';
        this.transactionsList.innerHTML = '';
    
        try {
            console.log('Starting transaction loading...');
    
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Transaction loading timeout')), 8000)
            );
    
            const transactions = await Promise.race([
                this.fetchTransactionHistory(),
                timeoutPromise
            ]);
    
            console.log(`Found ${transactions.length} transactions`);
            this.transactions = transactions;
    
        } catch (error) {
            console.log('Transaction loading failed or timed out:', error.message);
            this.transactions = [];
        }
    
        // Hide the loading screen after loading is done
        this.loadingTransactions.style.display = 'none';
    
        if (this.transactions.length > 0) {
            this.displayDynamicTransactions(this.transactions.slice(0, 10));
        } else {
            this.displayEmptyTransactions();
        }
    
        this.updateDynamicStats(this.transactions);
    }

    async fetchTransactionHistory() {
        // Double-check provider availability
        if (!this.provider) {
            throw new Error('Provider not available');
        }

        const transactions = [];
        let latestBlock;

        try {
            latestBlock = await this.provider.getBlockNumber();
            console.log('Fetching transaction history from block:', latestBlock);
        } catch (error) {
            console.error('Failed to get latest block number:', error);
            throw error;
        }

        const blocksToCheck = 30; // Reduced for better performance and reliability

        try {
            // Check recent blocks for transactions involving this address
            for (let i = 0; i < blocksToCheck; i++) {
                // Check if provider is still available (in case of disconnect during fetch)
                if (!this.provider) {
                    console.log('Provider disconnected during fetch, stopping');
                    break;
                }

                const blockNumber = latestBlock - i;

                try {
                    const block = await this.provider.getBlock(blockNumber, true);

                    if (block && block.transactions) {
                        for (const tx of block.transactions) {
                            if (tx.from?.toLowerCase() === this.userAddress.toLowerCase() ||
                                tx.to?.toLowerCase() === this.userAddress.toLowerCase()) {

                                transactions.push({
                                    hash: tx.hash,
                                    from: tx.from,
                                    to: tx.to,
                                    value: tx.value,
                                    blockNumber: tx.blockNumber,
                                    timestamp: block.timestamp
                                });
                            }
                        }
                    }
                } catch (blockError) {
                    console.log(`Error fetching block ${blockNumber}:`, blockError.message);
                    continue; // Skip this block and continue
                }

                // If we found enough transactions, break early
                if (transactions.length >= 10) break;
            }

            // Sort transactions by block number (most recent first)
            return transactions.sort((a, b) => b.blockNumber - a.blockNumber);

        } catch (error) {
            console.error('Error fetching transaction history:', error);
            return [];
        }
    } */

    displayDynamicTransactions(transactions) {
        this.transactionsList.innerHTML = transactions.map((tx, index) => {
            const value = ethers.formatEther(tx.value);
            const date = new Date(tx.timestamp * 1000).toLocaleString();
            const isOutgoing = tx.from.toLowerCase() === this.userAddress.toLowerCase();

            return `
                <div class="transaction-item" style="animation-delay: ${index * 0.1}s;">
                    <div class="transaction-header">
                        <div class="transaction-hash">
                            ${tx.hash.slice(0, 12)}...${tx.hash.slice(-10)}
                        </div>
                        <div class="transaction-value ${isOutgoing ? 'outgoing' : 'incoming'}">
                            ${isOutgoing ? '−' : '+'} ${parseFloat(value).toFixed(6)} ETH
                        </div>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-address">
                            <span class="direction-badge ${isOutgoing ? 'sent' : 'received'}">
                                <i class="fas fa-${isOutgoing ? 'arrow-up' : 'arrow-down'}"></i>
                                ${isOutgoing ? 'Sent' : 'Received'}
                            </span>
                            ${isOutgoing ? (tx.to || 'Contract') : tx.from}
                        </div>
                        <div class="transaction-date">
                            <i class="fas fa-clock" style="opacity: 0.6;"></i>
                            ${date}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayEmptyTransactions() {
        this.transactionsList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #718096;">
                <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3 style="font-size: 1.2rem; margin-bottom: 8px; color: #4a5568;">No Recent Transactions</h3>
                <p>No transactions found in the last 30 blocks.</p>
                <p style="margin-top: 8px; font-size: 0.9rem; opacity: 0.8;">
                    This could mean:
                </p>
                <ul style="text-align: left; max-width: 300px; margin: 12px auto 0; font-size: 0.85rem; opacity: 0.7; line-height: 1.4;">
                    <li>• This wallet hasn't been used recently</li>
                    <li>• Your transactions are in older blocks</li>
                    <li>• You're on a test network with limited activity</li>
                </ul>
                <p style="margin-top: 16px; font-size: 0.85rem; opacity: 0.6;">
                    <i class="fas fa-info-circle"></i> 
                    For complete history, use a block explorer like Etherscan
                </p>
            </div>
        `;
    }

    updateDynamicStats(transactions) {
        const sentTxs = transactions.filter(tx =>
            tx.from.toLowerCase() === this.userAddress.toLowerCase()
        );
        const receivedTxs = transactions.filter(tx =>
            tx.to?.toLowerCase() === this.userAddress.toLowerCase()
        );

        const totalSent = sentTxs.reduce((sum, tx) =>
            sum + parseFloat(ethers.formatEther(tx.value)), 0
        );
        const totalReceived = receivedTxs.reduce((sum, tx) =>
            sum + parseFloat(ethers.formatEther(tx.value)), 0
        );

        document.getElementById('totalTransactions').textContent = transactions.length;
        document.getElementById('totalSent').textContent = totalSent.toFixed(4);
        document.getElementById('totalReceived').textContent = totalReceived.toFixed(4);

        this.statsSection.style.display = 'grid';
        this.statsSection.classList.add('fade-in');
    }

    disconnect() {
        this.connectBtn.disabled = true;
        this.connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Disconnecting...';

        setTimeout(() => {
            this.provider = null;
            this.signer = null;
            this.userAddress = null;
            this.transactions = [];

            this.walletInfo.style.display = 'none';
            this.transactionsSection.style.display = 'none';
            this.statsSection.style.display = 'none';

            this.connectBtn.innerHTML = '<i class="fas fa-wallet" style="margin-right: 8px;"></i>Connect Wallet';
            this.connectBtn.classList.remove('connected');
            this.connectBtn.disabled = false;

            this.hideError();
        }, 300);
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';
        this.errorMessage.classList.add('fade-in');
    }

    hideError() {
        this.errorMessage.style.display = 'none';
        this.errorMessage.classList.remove('fade-in');
    }

    handleError(message, error) {
        console.error(message, error);
        let errorText = message;

        if (error.code === 4001) {
            errorText = 'Connection rejected by user.';
        } else if (error.message) {
            errorText += ': ' + error.message;
        }

        this.showError(errorText);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EthereumWalletInterface();
});