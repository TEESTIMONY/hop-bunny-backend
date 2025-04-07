// Firebase configuration
// IMPORTANT: Replace with your own Firebase project config from the Firebase console
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC0rNjkzFY8w8uHflqVj1zwjxxJktcgImA",
  authDomain: "hop-bunny.firebaseapp.com",
  projectId: "hop-bunny",
  storageBucket: "hop-bunny.firebasestorage.app",
  messagingSenderId: "852537502069",
  appId: "1:852537502069:web:23662af5d8389e6b3e4b3c",
  measurementId: "G-Y52SKL03ZT"
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
  
  // Initialize Firebase services
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  // Test authentication state
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User is signed in:', user.email);
    } else {
      console.log('No user is signed in');
    }
  });

  // Test database connection
  db.collection('test').get()
    .then(() => console.log('Firestore connection successful'))
    .catch(error => console.error('Firestore connection error:', error));

} catch (error) {
  console.error('Firebase initialization error:', error);
} 