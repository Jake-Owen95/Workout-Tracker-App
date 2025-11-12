import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// =================================================================
// TODO: Follow these steps to configure your Firebase project.
//
// 1. Go to the Firebase console: https://console.firebase.google.com/
// 2. Create a new project or select an existing one.
// 3. In your project, go to Project Settings (gear icon).
// 4. In the "Your apps" card, click the web icon (</>) to add a web app if you haven't already.
// 5. Register your app and Firebase will provide you with a `firebaseConfig` object.
// 6. Copy that object and paste it below, replacing the existing one.
// 7. Go to Authentication -> Sign-in method and enable "Email/Password".
// 8. Go to Firestore Database -> Create database -> Start in production mode.
//    Then, go to the "Rules" tab and paste the following rules:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workouts/{workoutId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
*/
// =================================================================

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmTnSj6ErRq4b6CzkcHFplEiO5uZXzffE",
  authDomain: "workout-tracker-922fa.firebaseapp.com",
  projectId: "workout-tracker-922fa",
  storageBucket: "workout-tracker-922fa.firebasestorage.app",
  messagingSenderId: "854612308469",
  appId: "1:854612308469:web:c344cee96786ca5d53b0bc",
  measurementId: "G-HP75SC8K81"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
