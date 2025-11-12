import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// =================================================================
// TODO: Replace the following with your app's Firebase project configuration
//
// 1. Go to the Firebase console: https://console.firebase.google.com/
// 2. Create a new project or select an existing one.
// 3. In your project, go to Project Settings (gear icon).
// 4. In the "Your apps" card, click the web icon (</>) to add a web app.
// 5. Register your app and Firebase will provide you with a `firebaseConfig` object.
// 6. Copy the values from that object and paste them here.
// 7. Go to Authentication -> Sign-in method and enable "Email/Password".
// 8. Go to Firestore Database -> Create database -> Start in production mode.
//    Then, go to the "Rules" tab and paste the following rules:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
*/
// =================================================================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);