/**
 * UI Manager for authentication and leaderboard components
 */
class UIManager {
    constructor() {
        this.auth = new Auth();
        this.currentView = 'start'; // start, login, register, game, leaderboard
        
        // Initialize UI
        this.initUI();
        
        // Create game instance once player logged in
        this.gameInstance = null;
    }
    
    /**
     * Initialize UI elements
     */
    initUI() {
        // Add auth container
        this.createAuthUI();
        
        // Add leaderboard container
        this.createLeaderboardUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check if user is already logged in
        if (this.auth.isLoggedIn()) {
            this.showView('start');
            this.updateUserInfo();
        } else {
            this.showView('login');
        }
    }
    
    /**
     * Create authentication UI containers
     */
    createAuthUI() {
        // Create auth containers
        const gameContainer = document.querySelector('.game-container');
        
        // Auth container (login/register)
        const authContainer = document.createElement('div');
        authContainer.id = 'authContainer';
        authContainer.className = 'overlay hidden';
        
        // Login form
        const loginForm = `
            <div id="loginView">
                <h2><i class="fas fa-sign-in-alt"></i> Login</h2>
                <div class="auth-form">
                    <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" placeholder="Enter your password">
                    </div>
                    <div class="auth-error" id="loginError"></div>
                    <button id="loginButton" class="game-button"><i class="fas fa-sign-in-alt"></i> Login</button>
                    <div class="form-footer">
                        <p>Don't have an account? <a href="#" id="showRegisterLink">Register</a></p>
                    </div>
                </div>
            </div>
        `;
        
        // Register form
        const registerForm = `
            <div id="registerView" class="hidden">
                <h2><i class="fas fa-user-plus"></i> Register</h2>
                <div class="auth-form">
                    <div class="form-group">
                        <label for="registerUsername">Username</label>
                        <input type="text" id="registerUsername" placeholder="Choose a username">
                    </div>
                    <div class="form-group">
                        <label for="registerEmail">Email</label>
                        <input type="email" id="registerEmail" placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="registerPassword">Password</label>
                        <input type="password" id="registerPassword" placeholder="Choose a password">
                    </div>
                    <div class="auth-error" id="registerError"></div>
                    <button id="registerButton" class="game-button"><i class="fas fa-user-plus"></i> Register</button>
                    <div class="form-footer">
                        <p>Already have an account? <a href="#" id="showLoginLink">Login</a></p>
                    </div>
                </div>
            </div>
        `;
        
        // Add forms to container
        authContainer.innerHTML = loginForm + registerForm;
        
        // Add auth container to game container
        gameContainer.appendChild(authContainer);
        
        // Add user info to start screen
        const startScreen = document.getElementById('startScreen');
        const userInfoDiv = document.createElement('div');
        userInfoDiv.id = 'userInfo';
        userInfoDiv.className = 'user-info';
        userInfoDiv.innerHTML = `
            <div class="user-info-container">
                <div id="userName">Guest</div>
                <button id="logoutButton" class="small-button"><i class="fas fa-sign-out-alt"></i></button>
            </div>
        `;
        
        // Add user info before start button
        const startButton = document.getElementById('startButton');
        startScreen.insertBefore(userInfoDiv, startButton);
        
        // Add leaderboard button
        const leaderboardButton = document.createElement('button');
        leaderboardButton.id = 'leaderboardButton';
        leaderboardButton.className = 'game-button leaderboard-button';
        leaderboardButton.innerHTML = '<i class="fas fa-trophy"></i> Leaderboard';
        
        // Insert after start button
        startButton.parentNode.insertBefore(leaderboardButton, startButton.nextSibling);
    }
    
    /**
     * Create leaderboard UI
     */
    createLeaderboardUI() {
        const gameContainer = document.querySelector('.game-container');
        
        // Leaderboard container
        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.id = 'leaderboardContainer';
        leaderboardContainer.className = 'overlay hidden';
        
        leaderboardContainer.innerHTML = `
            <h2><i class="fas fa-trophy"></i> Leaderboard</h2>
            <div class="leaderboard-content">
                <div class="leaderboard-list" id="leaderboardList">
                    <div class="leaderboard-loading">Loading scores...</div>
                </div>
            </div>
            <button id="backFromLeaderboardButton" class="game-button back-button">
                <i class="fas fa-arrow-left"></i> Back
            </button>
        `;
        
        gameContainer.appendChild(leaderboardContainer);
    }
    
    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
        // Auth navigation
        document.getElementById('showRegisterLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthView('register');
        });
        
        document.getElementById('showLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthView('login');
        });
        
        // Login form
        document.getElementById('loginButton').addEventListener('click', () => this.handleLogin());
        
        // Register form
        document.getElementById('registerButton').addEventListener('click', () => this.registerUser());
        
        // Logout button
        document.getElementById('logoutButton').addEventListener('click', () => this.logoutUser());
        
        // Leaderboard button
        document.getElementById('leaderboardButton').addEventListener('click', () => {
            this.showView('leaderboard');
            this.fetchLeaderboard();
        });
        
        // Back from leaderboard
        document.getElementById('backFromLeaderboardButton').addEventListener('click', () => {
            this.showView('start');
        });
        
        // Enter key handler for login and register forms
        document.getElementById('loginPassword').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        
        document.getElementById('registerPassword').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.registerUser();
        });
        
        // Modified start button click event
        const originalStartButton = document.getElementById('startButton');
        const originalClickHandler = originalStartButton.onclick;
        
        originalStartButton.onclick = (e) => {
            // First check if user is logged in
            if (!this.auth.isLoggedIn()) {
                this.showView('login');
                return;
            }
            
            // If logged in, proceed with original handler
            if (originalClickHandler) {
                originalClickHandler.call(originalStartButton, e);
            }
            
            this.showView('game');
        };
        
        // Modified game over handler to submit score
        const gameOverCheck = setInterval(() => {
            const gameOverElement = document.getElementById('gameOver');
            
            if (gameOverElement && !gameOverElement.classList.contains('hidden') && window.game) {
                // If game over and authenticated, submit score
                if (this.auth.isLoggedIn()) {
                    this.submitScore(window.game.score);
                }
                
                // Add personal best to game over screen if it doesn't exist yet
                if (!document.getElementById('personalBest')) {
                    const scoreDisplay = document.querySelector('.score-display');
                    
                    if (scoreDisplay) {
                        const personalBestElement = document.createElement('div');
                        personalBestElement.className = 'score-item';
                        personalBestElement.innerHTML = `
                            <span class="score-label"><i class="fas fa-star"></i> Personal Best:</span>
                            <span id="personalBest" class="score-value">Loading...</span>
                        `;
                        
                        scoreDisplay.appendChild(personalBestElement);
                        
                        // Fetch personal best
                        this.fetchPersonalBest();
                    }
                }
                
                clearInterval(gameOverCheck);
            }
        }, 200);
    }
    
    /**
     * Toggle between login and register views
     * @param {string} view - View to show ('login' or 'register')
     */
    toggleAuthView(view) {
        if (view === 'login') {
            document.getElementById('loginView').classList.remove('hidden');
            document.getElementById('registerView').classList.add('hidden');
        } else {
            document.getElementById('loginView').classList.add('hidden');
            document.getElementById('registerView').classList.remove('hidden');
        }
    }
    
    /**
     * Show a specific view
     * @param {string} view - View to show ('start', 'login', 'register', 'game', 'leaderboard')
     */
    showView(view) {
        this.currentView = view;
        
        // Hide all views
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('leaderboardContainer').classList.add('hidden');
        
        if (document.getElementById('gameOver')) {
            document.getElementById('gameOver').classList.add('hidden');
        }
        
        // Show selected view
        switch (view) {
            case 'start':
                document.getElementById('startScreen').classList.remove('hidden');
                break;
            case 'login':
                document.getElementById('authContainer').classList.remove('hidden');
                this.toggleAuthView('login');
                break;
            case 'register':
                document.getElementById('authContainer').classList.remove('hidden');
                this.toggleAuthView('register');
                break;
            case 'leaderboard':
                document.getElementById('leaderboardContainer').classList.remove('hidden');
                break;
            case 'game':
                // Game view is handled by the game code
                break;
        }
    }
    
    /**
     * Handle login form submission
     * @param {Event} e - Form event
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const errorElement = document.getElementById('loginError');
        
        // Get input values
        const email = form.email.value.trim();
        const password = form.password.value.trim();
        
        // Simple validation
        if (!email || !password) {
            errorElement.textContent = 'All fields are required';
            return;
        }
        
        try {
            errorElement.textContent = 'Logging in...';
            await this.auth.login(email, password);
            errorElement.textContent = '';
            
            // Update UI with user info
            this.updateUserInfo();
            
            // Show start screen
            this.showView('start');
        } catch (error) {
            errorElement.textContent = error.message || 'Login failed. Please try again.';
        }
    }
    
    /**
     * Register a new user
     */
    async registerUser() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const errorElement = document.getElementById('registerError');
        
        // Validate inputs
        if (!username || !email || !password) {
            errorElement.textContent = 'Please fill all fields';
            return;
        }
        
        if (password.length < 6) {
            errorElement.textContent = 'Password must be at least 6 characters';
            return;
        }
        
        if (!email.includes('@') || !email.includes('.')) {
            errorElement.textContent = 'Please enter a valid email';
            return;
        }
        
        try {
            errorElement.textContent = 'Registering...';
            await this.auth.register(username, email, password);
            errorElement.textContent = '';
            
            // Auto login after registration
            await this.auth.login(username, password);
            
            // Update UI with user info
            this.updateUserInfo();
            
            // Show start screen
            this.showView('start');
        } catch (error) {
            errorElement.textContent = error.message || 'Registration failed. Please try again.';
        }
    }
    
    /**
     * Logout current user
     */
    logoutUser() {
        this.auth.logout();
        this.showView('login');
        document.getElementById('userName').textContent = 'Guest';
    }
    
    /**
     * Update UI with user information
     */
    updateUserInfo() {
        const user = this.auth.getCurrentUser();
        if (user) {
            document.getElementById('userName').textContent = user.username;
        }
    }
    
    /**
     * Submit score to leaderboard
     * @param {number} score - Score to submit
     */
    async submitScore(score) {
        if (!this.auth.isLoggedIn()) return;
        
        try {
            await this.auth.submitScore(score);
            console.log('Score submitted successfully');
            
            // Fetch personal best
            this.fetchPersonalBest();
        } catch (error) {
            console.error('Failed to submit score:', error);
        }
    }
    
    /**
     * Fetch and display personal best
     */
    async fetchPersonalBest() {
        if (!this.auth.isLoggedIn()) return;
        
        try {
            const result = await this.auth.getPersonalBest();
            const personalBestElement = document.getElementById('personalBest');
            
            if (personalBestElement) {
                personalBestElement.textContent = result.score || 0;
            }
        } catch (error) {
            console.error('Failed to fetch personal best:', error);
        }
    }
    
    /**
     * Fetch and display leaderboard
     */
    async fetchLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '<div class="leaderboard-loading">Loading scores...</div>';
        
        try {
            const scores = await this.auth.getLeaderboard();
            
            // Clear loading message
            leaderboardList.innerHTML = '';
            
            if (scores.length === 0) {
                leaderboardList.innerHTML = '<div class="no-scores">No scores yet. Be the first to play!</div>';
                return;
            }
            
            // Create table
            const table = document.createElement('table');
            table.className = 'leaderboard-table';
            
            // Create header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Score</th>
                    <th>Date</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Create body
            const tbody = document.createElement('tbody');
            
            scores.forEach((score, index) => {
                const row = document.createElement('tr');
                
                // Check if current user
                const isCurrentUser = this.auth.user && score.userId === this.auth.user.id;
                if (isCurrentUser) {
                    row.className = 'current-user';
                }
                
                // Format date
                const scoreDate = new Date(score.date);
                const formattedDate = `${scoreDate.toLocaleDateString()}`;
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${score.username}</td>
                    <td>${score.score}</td>
                    <td>${formattedDate}</td>
                `;
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            leaderboardList.appendChild(table);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            leaderboardList.innerHTML = '<div class="leaderboard-error">Error loading leaderboard. Please try again.</div>';
        }
    }

    /**
     * Login a user
     */
    async loginUser() {
        const email = document.getElementById('loginEmail').value.trim(); // Using existing input field but for email
        const password = document.getElementById('loginPassword').value.trim();
        const errorElement = document.getElementById('loginError');
        
        // Validate inputs
        if (!email || !password) {
            errorElement.textContent = 'Please enter email and password';
            return;
        }
        
        try {
            errorElement.textContent = 'Logging in...';
            await this.auth.login(email, password);
            errorElement.textContent = '';
            
            // Update UI with user info
            this.updateUserInfo();
            
            // Show start screen
            this.showView('start');
        } catch (error) {
            errorElement.textContent = error.message || 'Login failed. Please try again.';
        }
    }
} 