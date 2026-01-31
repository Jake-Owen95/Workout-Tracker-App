import React, { useState } from 'react';
// @ts-ignore
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebase';
import { DumbbellIcon } from './Icons';

export const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth Error Object:", err);
      
      const errorCode = err.code || 'unknown-error';
      const errorMessage = err.message || 'An unexpected error occurred.';

      // provide more detailed feedback
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/Password login is not enabled in Firebase Console.');
          break;
        case 'auth/invalid-api-key':
          setError('Firebase API Key is invalid. Check your environment variables.');
          break;
        default:
          setError(`[${errorCode}] ${errorMessage}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-4 font-sans">
      <div className="flex items-center gap-4 mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/20">
          <DumbbellIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase">
          LWJ <span className="text-indigo-400">Tracker</span>
        </h1>
      </div>

      <div className="w-full max-w-md bg-gray-900 rounded-[2.5rem] shadow-2xl p-10 border border-white/5 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-2">
            {isLoginView ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-gray-500 font-medium">
            {isLoginView ? 'Enter your details to log in' : 'Create an account to track gains'}
          </p>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-gray-600"
              placeholder="name@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-gray-600"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-red-400 text-sm text-center font-bold tracking-tight leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (isLoginView ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-gray-500 font-medium">
            {isLoginView ? "New here?" : 'Already a member?'}
            <button
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError(null);
              }}
              className="font-black text-indigo-400 hover:text-indigo-300 ml-2 transition-colors"
            >
              {isLoginView ? 'Join Now' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};