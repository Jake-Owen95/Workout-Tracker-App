import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  AuthError
} from 'firebase/auth.js';
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
    } catch (err) {
      const authError = err as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
      <div className="flex items-center gap-3 mb-8">
        <DumbbellIcon className="h-10 w-10 text-indigo-400" />
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Gemini Fitness
        </h1>
      </div>
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isLoginView ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <form onSubmit={handleAuthAction} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition disabled:bg-indigo-400/50"
            >
              {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError(null);
            }}
            className="font-medium text-indigo-400 hover:text-indigo-300 ml-1"
          >
            {isLoginView ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};