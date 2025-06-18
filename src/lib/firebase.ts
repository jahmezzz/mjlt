// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDyFsvl01Pgp05xi-c7obUoKaXd2U170V0",
  authDomain: "mjlt-56538.firebaseapp.com",
  projectId: "mjlt-56538",
  storageBucket: "mjlt-56538.appspot.com", // Corrected storageBucket name
  messagingSenderId: "609731031148",
  appId: "1:609731031148:web:b9ecc59307b760fb2de849",
  measurementId: "G-ZCEVK93NN7"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only if supported (works in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, googleProvider, analytics };
