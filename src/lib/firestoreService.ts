import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export interface TelemetryEventDoc {
  id: string;
  vehicleId: string;
  vibrationDelta: number;
  persistenceCount: number;
  alpha?: number;
  status?: string;
  timestamp: string;
  userId?: string;
  operatorEmail?: string;
}

export interface AssetDoc {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  userId?: string;
  updatedAt?: string;
}

/**
 * Saves a kinetic CAN telemetry event to Firestore.
 * Requires Firebase Authentication.
 */
export async function saveTelemetryEvent(event: Omit<TelemetryEventDoc, 'userId' | 'operatorEmail'>): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication Required: Operator must be signed in with Firebase Auth to commit telemetry data to Firestore.');
  }

  const path = `telemetry_events/${event.id}`;
  try {
    const docRef = doc(db, 'telemetry_events', event.id);
    const dataToSave: TelemetryEventDoc = {
      ...event,
      userId: user.uid,
      operatorEmail: user.email || 'operator@titangamessecurity.com',
    };
    await setDoc(docRef, dataToSave);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Fetches recent telemetry events from Firestore
 */
export async function getTelemetryEvents(maxResults = 25): Promise<TelemetryEventDoc[]> {
  const path = 'telemetry_events';
  try {
    const colRef = collection(db, 'telemetry_events');
    const q = query(colRef, limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as TelemetryEventDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Subscribes to real-time telemetry events from Firestore
 */
export function subscribeToTelemetry(
  onData: (events: TelemetryEventDoc[]) => void, 
  onError?: (err: any) => void
) {
  const path = 'telemetry_events';
  const colRef = collection(db, 'telemetry_events');
  const q = query(colRef, limit(30));

  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map(d => d.data() as TelemetryEventDoc);
      onData(docs);
    },
    (err) => {
      console.warn('Telemetry subscription error:', err);
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (formattedErr) {
        if (onError) onError(formattedErr);
      }
    }
  );
}

/**
 * Saves or updates a defense asset in Firestore
 */
export async function saveAsset(asset: Omit<AssetDoc, 'userId' | 'updatedAt'>): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication Required: Operator must be signed in with Firebase Auth to manage defense assets.');
  }

  const path = `assets/${asset.id}`;
  try {
    const docRef = doc(db, 'assets', asset.id);
    const assetData: AssetDoc = {
      ...asset,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, assetData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
