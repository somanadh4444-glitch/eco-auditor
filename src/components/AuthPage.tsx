import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Mail, 
  Lock, 
  Leaf, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Sparkles,
  User,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = 'An error occurred during authentication.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email is already registered.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be stronger (at least 6 characters).';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error(err);
      setError('Anonymous sign-in is disabled or encountered an error. Please sign up instead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 px-4" id="auth-page-container">
      <div className="max-w-md w-full" id="auth-card-wrapper">
        
        {/* Decorative elements */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-emerald-600 rounded-xl items-center justify-center text-white shadow-md mb-4">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-emerald-900">
            Welcome to EcoAudit
          </h2>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-semibold">
            Community Waste Logger
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          {/* Subtle design accents */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600" />
          <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />

          <h3 className="font-display text-lg font-bold text-slate-900 mb-2">
            {isSignUp ? 'Create your Account' : 'Sign In to EcoAudit'}
          </h3>
          <p className="text-slate-400 text-xs mb-6">
            {isSignUp 
              ? 'Join the community-driven environmental ledger.' 
              : 'Access your waste logs and view community statistics.'}
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-start gap-2.5"
                id="auth-error-banner"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-normal font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@example.com"
                  disabled={loading}
                  className="block w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/40 font-medium transition-all"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                  className="block w-full pl-10 pr-10 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/40 font-medium transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password field (Sign Up only) */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-1">
                    <label htmlFor="confirmPassword" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="••••••••"
                        disabled={loading}
                        className="block w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-stone-50/40 font-medium transition-all"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 active:scale-[0.99] transition-all text-white font-bold rounded-xl shadow-md shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-xs uppercase tracking-wider mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please Wait...
                </>
              ) : isSignUp ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Account
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-stone-100"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-stone-100"></div>
          </div>

          {/* Continue as Guest option */}
          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full py-2.5 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-slate-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <User className="w-4 h-4 text-slate-400" />
            Continue as Guest / Anonymous
          </button>

          {/* Toggle View */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-all cursor-pointer"
            >
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
