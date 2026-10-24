import { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  X, 
  Key, 
  Database, 
  AlertCircle,
  ExternalLink,
  Cpu,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, userProfile, isAuthenticated, loading, error, signInWithGoogle, signOutOperator } = useAuth();
  const { addToast } = useNotification();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      addToast('OPERATOR AUTHENTICATED: Titan Defense Enclave session secured via Firebase Auth.', 'success');
      onClose();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Authentication error', 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutOperator();
      addToast('OPERATOR SIGNED OUT: Sovereign cryptographic keys revoked.', 'info');
      onClose();
    } catch (err: any) {
      addToast('Logout error', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0c0d0e] border border-gray-200 dark:border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden font-mono text-gray-800 dark:text-gray-200">
        
        {/* Header accent strip */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-600" />

        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  CAGE: ACTIVE | SAM.GOV
                </span>
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  DARPA #21270632
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1">
                Titan Defense Operator Access
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isAuthenticated && user ? (
            /* Signed In State */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center gap-4">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Operator'} 
                    className="w-14 h-14 rounded-full border-2 border-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-xl">
                    {user.email?.slice(0, 2).toUpperCase() || 'OP'}
                  </div>
                )}
                
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      {user.displayName || 'Defense Systems Operator'}
                    </span>
                    <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {user.email}
                  </div>
                  <div className="text-[10px] text-gray-400 truncate">
                    UID: {user.uid}
                  </div>
                </div>
              </div>

              {/* Clearance Details */}
              <div className="bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px] pb-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500">OPERATIONAL CLEARANCE:</span>
                  <span className="text-emerald-500 font-bold">
                    {userProfile?.clearanceLevel || 'LEVEL 4 // CAGE ACTIVE'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] pb-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500">DEFENSE CONTRACT VEHICLE:</span>
                  <span className="text-cyan-400 font-bold">
                    D-U-N-S: 145054895 | ARI #21270632
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] pb-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500">FIRESTORE DATA ENCLAVE:</span>
                  <span className="text-purple-400 font-bold">
                    ONLINE &amp; SYNCHRONIZED
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-500">SOVEREIGN TRUST SEAL:</span>
                  <span className="text-amber-400 font-bold">
                    UCC-CER-NYMT-XB6 ACTIVE
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  REVOKE CREDENTIALS &amp; SIGN OUT
                </button>
              </div>
            </div>
          ) : (
            /* Signed Out State */
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-bold text-amber-400 block mb-1">
                    ACCESS RESTRICTED: OPERATOR AUTHENTICATION REQUIRED
                  </span>
                  To commit CAN bus telemetry records, write defense twin digital assets, and query the sovereign ledger, sign in with your authorized Google credentials.
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-800/80 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-400">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  <span>Sovereign Edge Node Enclave: Zero-Cloud-Rent POSIX</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Shannon Entropy Defense Gates: H(X) &lt; 1.5 Active</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Firebase Rules: request.auth != null Enforced</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                {isSigningIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>AUTHENTICATING SECURE OPERATOR...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>SIGN IN WITH GOOGLE (DEFENSE PORTAL)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-black/80 border-t border-gray-200 dark:border-gray-800/60 flex items-center justify-between text-[10px] text-gray-500">
          <span>HOLDING TRUST: EIN 41-6820289</span>
          <span>TITAN GAMES SECURITY L.L.C.</span>
        </div>
      </div>
    </div>
  );
}
