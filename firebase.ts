
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// =================================================================
// 🛠️ MULTI-ENVIRONMENT CONFIGURATION
// =================================================================
// The app now uses environment variables to distinguish between 
// "Development" (Local) and "Production" (Stable/GitHub Pages).
//
// Create .env.development and .env.production in your project root.
// Variables must start with VITE_ to be accessible via import.meta.env.
// =================================================================

// Fix: Use a type assertion to access Vite-specific environment variables without global type definitions for import.meta.env
const env = (import.meta as any).env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * SECURITY RULES REMINDER (Apply to BOTH projects):
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /workouts/{workoutId} {
 *       allow read, write: if request.auth != null && (
 *         (request.method == 'create' && request.resource.data.userId == request.auth.uid) ||
 *         (resource != null && resource.data.userId == request.auth.uid) ||
 *         (request.method == 'list' && request.query.limit <= 100)
 *       );
 *     }
 *   }
 * }
 */
