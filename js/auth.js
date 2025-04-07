/**
 * Authentication service for the Hop Bunny game
 * Handles user registration, login, and high scores
 * Now uses Firebase for authentication and database storage
 */
class AuthService {
    constructor() {
        // Initialize from localStorage if available
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.isAuthenticated = !!this.user;
        
        // Listen for auth state changes
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                this.user = {
                    id: user.uid,
                    username: user.displayName || user.email.split('@')[0],
                    email: user.email
                };
                this.isAuthenticated = true;
                localStorage.setItem('user', JSON.stringify(this.user));
                console.log('Firebase auth state: signed in as', this.user.username);
            } else {
                // User is signed out
                this.user = null;
                this.isAuthenticated = false;
                localStorage.removeItem('user');
                console.log('Firebase auth state: signed out');
            }
        });
    }
    
    /**
     * Register a new user
     * @param {string} username - Username
     * @param {string} email - Email
     * @param {string} password - Password
     * @returns {Promise} - Registration result
     */
    async register(username, email, password) {
        try {
            console.log(`Registering new user: ${username}`);
            
            // Create user in Firebase Authentication
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update profile with username
            await user.updateProfile({
                displayName: username
            });
            
            // Create user document in Firestore
            await firebase.firestore().collection('users').doc(user.uid).set({
                username,
                email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update local state
            this.user = {
                id: user.uid,
                username,
                email
            };
            this.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(this.user));
            
            return {
                message: 'User registered successfully',
                userId: user.uid
            };
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Login a user
     * @param {string} email - Email
     * @param {string} password - Password
     * @returns {Promise} - Login result
     */
    async login(email, password) {
        try {
            console.log(`Logging in user: ${email}`);
            
            // Sign in with Firebase Authentication
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get user data from Firestore
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data() || {};
            
            // Update local state
            this.user = {
                id: user.uid,
                username: user.displayName || userData.username || email.split('@')[0],
                email: user.email
            };
            this.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(this.user));
            
            return {
                message: 'Login successful',
                user: this.user
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Logout the current user
     */
    logout() {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('user');
            this.user = null;
            this.isAuthenticated = false;
        }).catch(error => {
            console.error('Logout error:', error);
        });
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    isLoggedIn() {
        return this.isAuthenticated;
    }

    /**
     * Get current user data
     * @returns {Object|null} - User data
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Submit a score to the leaderboard
     * @param {number} score - Score to submit
     * @returns {Promise} - Submission result
     */
    async submitScore(score) {
        try {
            if (!this.isAuthenticated || !this.user) {
                throw new Error('User not authenticated');
            }
            
            const userId = this.user.id;
            const username = this.user.username;
            
            // Create score document in Firestore
            const scoreRef = await firebase.firestore().collection('scores').add({
                userId,
                username,
                score,
                date: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Check if this is the user's best score
            const userScoresRef = firebase.firestore().collection('scores')
                .where('userId', '==', userId)
                .orderBy('score', 'desc')
                .limit(1);
            
            const userScores = await userScoresRef.get();
            const topScore = userScores.empty ? 0 : userScores.docs[0].data().score;
            
            // Update user's top score if needed
            if (score > topScore) {
                await firebase.firestore().collection('users').doc(userId).update({
                    topScore: score
                });
            }
            
            return {
                message: 'Score submitted successfully',
                scoreId: scoreRef.id
            };
        } catch (error) {
            console.error('Score submission error:', error);
            throw error;
        }
    }

    /**
     * Get leaderboard data
     * @returns {Promise} - Leaderboard data
     */
    async getLeaderboard() {
        try {
            // Get top 10 scores from Firestore
            const leaderboardRef = firebase.firestore().collection('scores')
                .orderBy('score', 'desc')
                .limit(10);
            
            const snapshot = await leaderboardRef.get();
            
            if (snapshot.empty) {
                return [];
            }
            
            // Convert to array of score objects
            const leaderboard = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    username: data.username,
                    score: data.score,
                    date: data.date ? data.date.toDate() : new Date()
                };
            });
            
            return leaderboard;
        } catch (error) {
            console.error('Leaderboard error:', error);
            throw error;
        }
    }

    /**
     * Get user's personal best score
     * @returns {Promise} - Personal best score
     */
    async getPersonalBest() {
        try {
            if (!this.isAuthenticated || !this.user) {
                throw new Error('User not authenticated');
            }
            
            const userId = this.user.id;
            
            // Get user's top score from Firestore
            const userScoresRef = firebase.firestore().collection('scores')
                .where('userId', '==', userId)
                .orderBy('score', 'desc')
                .limit(1);
            
            const snapshot = await userScoresRef.get();
            
            if (snapshot.empty) {
                return { score: 0 };
            }
            
            const topScore = snapshot.docs[0].data().score;
            
            return { score: topScore };
        } catch (error) {
            console.error('Personal best error:', error);
            throw error;
        }
    }
} 