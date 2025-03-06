// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtaaogojae7QS9rIzz6q7igw--xOyVN5U",
  authDomain: "collaborative-whiteboard-8d281.firebaseapp.com",
  databaseURL: "https://collaborative-whiteboard-8d281-default-rtdb.firebaseio.com",
  projectId: "collaborative-whiteboard-8d281",
  storageBucket: "collaborative-whiteboard-8d281.firebasestorage.app",
  messagingSenderId: "21232394304",
  appId: "1:21232394304:web:bd1a5a0904e0830681ffa5",
  measurementId: "G-FP05JC3GJR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
const db = getDatabase(app);

// Export the Firestore instance
export { db };