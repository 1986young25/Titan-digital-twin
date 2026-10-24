import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleSignIn, 
  logout, 
  getAuthToken, 
  initAuth, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';

export interface DefenseUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  clearanceLevel: string;
  role: string;
  cageCode: string;
  duns: string;
  samGov: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: DefenseUserProfile | null;
  loading: boolean;
  error: string | null;
  idToken: string | null;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutOperator: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<DefenseUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  // Sync profile document to Firestore and backend Postgres
  const syncUserProfile = useCallback(async (firebaseUser: User, token: string) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const nowIso = new Date().toISOString();

      let profileData: DefenseUserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Defense Systems Operator',
        photoURL: firebaseUser.photoURL || '',
        clearanceLevel: 'LEVEL 4 // CAGE ACTIVE - ARI #21270632',
        role: 'SOVEREIGN_SYSTEMS_ENGINEER',
        cageCode: 'ACTIVE',
        duns: '145054895',
        samGov: 'REGISTERED',
        lastLogin: nowIso,
      };

      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const existing = snap.data() as Partial<DefenseUserProfile>;
          profileData = {
            ...profileData,
            ...existing,
            lastLogin: nowIso,
          };
        }
        
        await setDoc(userRef, {
          uid: profileData.uid,
          email: profileData.email,
          displayName: profileData.displayName,
          photoURL: profileData.photoURL,
          clearanceLevel: profileData.clearanceLevel,
          role: profileData.role,
          lastLogin: profileData.lastLogin
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore user profile sync error:', firestoreErr);
        handleFirestoreError(firestoreErr, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }

      setUserProfile(profileData);

      // Backend API sync
      try {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (apiErr) {
        console.warn('PostgreSQL /api/auth/login sync non-fatal warning:', apiErr);
      }
    } catch (err: any) {
      console.error('Error during user profile sync:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setIdToken(token);
        await syncUserProfile(firebaseUser, token);
        setLoading(false);
      },
      () => {
        setUser(null);
        setUserProfile(null);
        setIdToken(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [syncUserProfile]);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const { user: signedInUser, idToken: token } = await googleSignIn();
      setUser(signedInUser);
      setIdToken(token);
      await syncUserProfile(signedInUser, token);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOutOperator = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setUserProfile(null);
      setIdToken(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const token = await getAuthToken();
      if (token) {
        await syncUserProfile(user, token);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        idToken,
        isAuthenticated: !!user,
        signInWithGoogle,
        signOutOperator,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
