import { useState } from 'react';
import { ENTITIES } from '../../data/mockTitanData';
import { ChevronDown, ShieldCheck, Sun, Moon, Printer, LogIn, Lock, CheckCircle2 } from 'lucide-react';
import { useEntityContext } from '../../context/EntityContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';

export function TopBar() {
  const { activeEntityId, setActiveEntityId, activeEntity } = useEntityContext();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, userProfile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/50 flex items-center justify-between px-6 z-40 sticky top-0 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded text-[10px] text-gray-500 font-mono transition-colors duration-200">
            <span className="font-bold text-gray-700 dark:text-gray-300">Ctrl+K</span> to search
          </div>
          <div className="relative group">
            <label htmlFor="entity-select" className="sr-only">Select Active Entity</label>
            <select
              id="entity-select"
              value={activeEntityId}
              onChange={(e) => setActiveEntityId(e.target.value)}
              aria-label="Active Entity Selector"
              className="appearance-none bg-white dark:bg-black/50 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {ENTITIES.map(entity => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-emerald-500 transition-colors" aria-hidden="true" />
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-mono">EIN / REGISTRATION</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold tracking-widest">{activeEntity.ein}</span>
          </div>
          
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-800 mx-2 transition-colors duration-200" />
          
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-mono">JURISDICTION</span>
            <span className="text-xs text-gray-700 dark:text-gray-300 font-mono uppercase">{activeEntity.jurisdiction}</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold">CAGE: ACTIVE</span>
            <span className="text-gray-400">|</span>
            <span>SAM.GOV</span>
            <span className="text-gray-400">|</span>
            <span>D-U-N-S: 145054895</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-200"
            title="Print Report"
            aria-label="Print Current View"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-200"
            title="Toggle Diagnostic Theme"
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
          </button>

          {/* Defense Operator Authentication Badge */}
          {isAuthenticated && user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 rounded-lg text-xs font-mono transition-all group"
              title="Click to view Operator Profile & Security Credentials"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Operator'} 
                  className="w-6 h-6 rounded-full border border-emerald-400"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                  {user.email?.slice(0, 2).toUpperCase() || 'OP'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 leading-none">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>OPERATOR VERIFIED</span>
                </div>
                <div className="text-[10px] text-gray-400 truncate max-w-[120px] leading-tight">
                  {user.email}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
              title="Operator sign-in required to secure Firestore telemetry data"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>OPERATOR SIGN IN</span>
            </button>
          )}

          <div className="hidden lg:flex bg-emerald-100/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 px-3 py-1.5 rounded-md items-center gap-2 transition-colors duration-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">Ed25519 ENFORCED</span>
          </div>

          <div 
            onClick={() => setIsAuthModalOpen(true)}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center transition-colors duration-200 cursor-pointer hover:border-emerald-500"
            title="Operator Clearance / Profile"
          >
            <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
              {user ? (user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'OP') : 'NY'}
            </span>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}
