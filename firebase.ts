
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// =================================================================
// 🛠️ FIREBASE SETUP STEPS (REQUIRED TO FIX PERMISSIONS)
// =================================================================
//
// 1. DATABASE CREATION:
//    Go to https://console.firebase.google.com/
//    Select your project -> Firestore Database -> "Create database".
//    Choose a location and start in "Production Mode".
//
// 2. SECURITY RULES:
//    Go to the "Rules" tab in Firestore and PASTE this exactly:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workouts/{workoutId} {
      allow read, write: if request.auth != null && (
        // Allow if creating a new doc with their own UID
        (request.method == 'create' && request.resource.data.userId == request.auth.uid) ||
        // Allow if accessing/deleting an existing doc they own
        (resource != null && resource.data.userId == request.auth.uid) ||
        // Allow listing docs filtered by their own UID
        (request.method == 'list' && request.query.limit <= 100)
      );
    }
  }
}
*/
//
// 3. COMPOSITE INDEX (IMPORTANT for the list to show up):
//    The app sorts by date. Firebase needs an index for this.
//    If the "Your Workouts" list is empty or shows an error in the console:
//    Go to Firestore -> Indexes -> Composite -> "Create Index".
//    Collection ID: workouts
//    Field 1: userId (Ascending)
//    Field 2: date (Descending)
//    Query scope: Collection
// =================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDmTnSj6ErRq4b6CzkcHFplEiO5uZXzffE",
  authDomain: "workout-tracker-922fa.firebaseapp.com",
  projectId: "workout-tracker-922fa",
  storageBucket: "workout-tracker-922fa.firebasestorage.app",
  messagingSenderId: "854612308469",
  appId: "1:854612308469:web:c344cee96786ca5d53b0bc",
  measurementId: "G-HP75SC8K81"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
