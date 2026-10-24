import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User,
  getIdToken
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Google Auth Provider configured for defense operator sign-in
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean | null;
    isAnonymous: boolean;
    token: Record<string, any> | null;
  };
}

/**
 * Traps Firestore security and permission errors and re-throws a formatted JSON string
 * complying strictly with FirestoreErrorInfo.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null = null): never {
  const err = error as { code?: string; message?: string };
  if (err?.code === 'permission-denied' || err?.message?.includes('insufficient permissions')) {
    const user = auth.currentUser;
    const errorInfo: FirestoreErrorInfo = {
      error: err.message || 'Permission denied',
      operationType,
      path,
      authInfo: {
        userId: user?.uid || null,
        email: user?.email || null,
        emailVerified: user?.emailVerified || null,
        isAnonymous: user?.isAnonymous || false,
        token: null,
      },
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
}

/**
 * Initiates client-side Google Login via popup
 */
export const googleSignIn = async (): Promise<{ user: User; idToken: string }> => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await result.user.getIdToken(true);
    return { user: result.user, idToken };
  } catch (error: any) {
    console.error('[Firebase Auth] Sign-in error:', error);
    throw error;
  }
};

/**
 * Sign out the current operator
 */
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Retrieves the current Firebase ID token for authenticated API requests
 */
export const getAuthToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await getIdToken(currentUser);
};

/**
 * Listener for auth state changes
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        if (onAuthSuccess) onAuthSuccess(user, token);
      } catch (err) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export default app;
