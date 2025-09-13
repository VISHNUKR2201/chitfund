// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1DEK1L3PoYbl2LHy8Dd4pFX0ilLJ2EYE",
  authDomain: "chitfund-fb3a9.firebaseapp.com",
  projectId: "chitfund-fb3a9",
  storageBucket: "chitfund-fb3a9.firebasestorage.app",
  messagingSenderId: "130762098794",
  appId: "1:130762098794:web:606853b755d86787bd2213",
  measurementId: "G-T53C6DWDRQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);