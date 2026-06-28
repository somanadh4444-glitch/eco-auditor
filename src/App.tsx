/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  BarChart3, 
  PlusCircle, 
  Database, 
  Compass, 
  ShieldAlert,
  MapPin,
  FileSpreadsheet,
  LogOut,
  Loader2
} from 'lucide-react';
import FormPage from './components/FormPage';
import DashboardPage from './components/DashboardPage';
import AuthPage from './components/AuthPage';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard'>('form');
  // Trigger is used to notify dashboard to update if a form submission happens
  const [dashboardTrigger, setDashboardTrigger] = useState<number>(0);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleFormSuccess = () => {
    setDashboardTrigger(prev => prev + 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center" id="auth-loading-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 text-slate-800 font-sans antialiased flex flex-col justify-between" id="app-wrapper">
        <div className="bg-stone-950 text-stone-300 text-xs py-2.5 px-6 flex justify-between items-center border-b border-stone-900 shrink-0" id="top-status-bar">
          <div className="flex items-center gap-2 max-w-xl truncate">
            <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-[9px] uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-850 px-2 py-0.5 rounded-sm">
              Live Database Sync
            </span>
            <span className="truncate opacity-90 hidden sm:inline text-[11px] text-stone-400">
              Auto-synchronized with the secure community Firestore database
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Compass className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Auto-Coordinate Capture</span>
          </div>
        </div>

        <header className="h-20 bg-white border-b border-stone-200 shadow-sm sticky top-0 z-50 shrink-0" id="main-header">
          <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-3" id="logo-block">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Leaf className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <h1 className="font-display font-bold text-xl tracking-tight text-emerald-900">
                    EcoAudit
                  </h1>
                </div>
                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest -mt-0.5">Community Waste Logger</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Secure Gateway</p>
              <p className="text-xs font-mono text-emerald-700">auth-v1-active</p>
            </div>
          </div>
        </header>

        <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 flex items-center justify-center" id="main-content">
          <AuthPage />
        </main>

        <footer className="bg-white border-t border-stone-200 py-8 text-center text-xs text-slate-400 shrink-0" id="main-footer">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-left">
              <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-xs tracking-tight">EcoAudit - Community Waste Logger</span>
                <p className="text-[11px] text-slate-500">Promoting transparent waste tracking and environmental auditing.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans antialiased flex flex-col justify-between" id="app-wrapper">
      
      {/* Top Banner indicating Database Sync Status */}
      <div className="bg-stone-950 text-stone-300 text-xs py-2.5 px-6 flex justify-between items-center border-b border-stone-900 shrink-0" id="top-status-bar">
        <div className="flex items-center gap-2 max-w-xl truncate">
          <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="font-semibold text-[9px] uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-850 px-2 py-0.5 rounded-sm">
            Live Database Sync
          </span>
          <span className="truncate opacity-90 hidden sm:inline text-[11px] text-stone-400">
            Auto-synchronized with the secure community Firestore database
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Compass className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Auto-Coordinate Capture</span>
        </div>
      </div>

      {/* Main Header / Navigation Area */}
      <header className="h-20 bg-white border-b border-stone-200 shadow-sm sticky top-0 z-50 shrink-0" id="main-header">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          
          {/* Logo / Branding */}
          <div 
            className={`flex items-center gap-3 ${isFormSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => {
              if (!isFormSubmitting) {
                setActiveTab('form');
              }
            }} 
            id="logo-block"
          >
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform duration-200">
              <Leaf className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="font-display font-bold text-xl tracking-tight text-emerald-900">
                  EcoAudit
                </h1>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border border-emerald-100">
                  v1.0
                </span>
              </div>
              <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest -mt-0.5">Community Waste Logger</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex gap-8 text-xs font-bold uppercase tracking-widest text-slate-500" id="navigation-tabs">
            <button
              id="nav-tab-form"
              onClick={() => {
                if (!isFormSubmitting) {
                  setActiveTab('form');
                }
              }}
              disabled={isFormSubmitting}
              className={`pb-1 transition-all border-b-2 ${
                isFormSubmitting 
                  ? 'cursor-not-allowed text-slate-300 border-transparent'
                  : activeTab === 'form'
                    ? 'text-emerald-600 border-emerald-600 font-bold cursor-pointer'
                    : 'text-slate-500 hover:text-emerald-600 border-transparent cursor-pointer'
              }`}
            >
              Form View
            </button>
            <button
              id="nav-tab-dashboard"
              onClick={() => {
                if (!isFormSubmitting) {
                  setActiveTab('dashboard');
                }
              }}
              disabled={isFormSubmitting}
              className={`pb-1 transition-all border-b-2 ${
                isFormSubmitting 
                  ? 'cursor-not-allowed text-slate-300 border-transparent'
                  : activeTab === 'dashboard'
                    ? 'text-emerald-600 border-emerald-600 font-bold cursor-pointer'
                    : 'text-slate-500 hover:text-emerald-600 border-transparent cursor-pointer'
              }`}
            >
              Dashboard
            </button>
          </nav>

          {/* Active Logger Profile info & Sign Out */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                {isFormSubmitting ? 'Syncing Audit...' : 'Active Logger'}
              </p>
              <p className="text-xs font-mono text-emerald-700 truncate max-w-[150px]" title={user.email || 'Guest'}>
                {user.isAnonymous ? 'Guest User' : user.email}
              </p>
            </div>
            <button
              onClick={() => {
                if (!isFormSubmitting) {
                  signOut(auth);
                }
              }}
              disabled={isFormSubmitting}
              title={isFormSubmitting ? "Submission in progress" : "Sign Out"}
              className={`p-2 rounded-xl transition-all border flex items-center justify-center ${
                isFormSubmitting 
                  ? 'opacity-40 cursor-not-allowed text-slate-300 border-stone-100'
                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-stone-100 hover:border-rose-150 cursor-pointer'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1" id="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <motion.div
              key="form-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <FormPage 
                onSuccess={handleFormSuccess} 
                onSubmittingStateChange={setIsFormSubmitting}
                onViewDashboard={() => setActiveTab('dashboard')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <DashboardPage updateTrigger={dashboardTrigger} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-8 text-center text-xs text-slate-400 shrink-0 mt-12" id="main-footer">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-left">
            <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block text-xs tracking-tight">EcoAudit - Community Waste Logger</span>
              <p className="text-[11px] text-slate-500">Promoting transparent waste tracking and environmental auditing.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Automatic Coordinate Capture Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
