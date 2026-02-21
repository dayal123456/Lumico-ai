
import React, { useState } from 'react';
import { Mail, Lock, User, Asterisk, ArrowRight } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (authMode === 'signup' && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      setLoading(true);
      if (authMode === 'signup') {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto custom-scrollbar animate-fade-in font-inter">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md py-10">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#008080]/10 flex items-center justify-center mb-4 shadow-sm shadow-teal-500/20">
               <Asterisk className="w-7 h-7 text-[#008080]" strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-serif-custom font-black text-gray-900 tracking-tight">AI Chat</h1>
            <p className="text-gray-400 font-medium text-sm">Professional AI Workspace</p>
          </div>

          <div className="bg-white rounded-3xl p-1">
            
            <div className="flex bg-gray-100 rounded-xl p-1 mb-8 relative">
               <button 
                 onClick={() => setAuthMode('signin')}
                 className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all z-10 ${authMode === 'signin' ? 'bg-white text-gray-900 shadow-sm shadow-teal-500/20' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Sign In
               </button>
               <button 
                 onClick={() => setAuthMode('signup')}
                 className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all z-10 ${authMode === 'signup' ? 'bg-white text-gray-900 shadow-sm shadow-teal-500/20' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Sign Up
               </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {authMode === 'signin' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-gray-400 text-sm">
                  {authMode === 'signin' ? 'Enter your credentials to access your workspace.' : 'Get started with your intelligent companion.'}
              </p>
            </div>

            {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6 text-center border border-red-100 font-medium">{error}</div>}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#008080] transition-colors" />
                  <input 
                    type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] outline-none transition-all font-medium text-gray-900"
                  />
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#008080] transition-colors" />
                <input 
                  type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] outline-none transition-all font-medium text-gray-900"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#008080] transition-colors" />
                <input 
                  type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] outline-none transition-all font-medium text-gray-900"
                />
              </div>
              {authMode === 'signup' && (
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#008080] transition-colors" />
                  <input 
                    type="password" placeholder="Confirm Password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] outline-none transition-all font-medium text-gray-900"
                  />
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full py-4 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}</span>
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <div className="relative my-8 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <span className="relative bg-white px-4 text-xs font-bold text-gray-300 uppercase tracking-widest">Or continue with</span>
            </div>

            <button 
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
