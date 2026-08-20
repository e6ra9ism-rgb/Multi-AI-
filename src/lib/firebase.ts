import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PaperPosition, ClosedTrade, TraderAccount, CryptoNewsSignal } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth & Firestore
// Note: When custom firestoreDatabaseId is provided in firebase-applet-config.json, use it
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Firebase Sign-Out error:', error);
    throw error;
  }
};

// Sync Account Profile with Firestore
export const saveUserAccount = async (userId: string, account: TraderAccount, userInfo?: { email?: string | null; displayName?: string | null }) => {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      id: userId,
      email: userInfo?.email || null,
      displayName: userInfo?.displayName || 'Quant Trader',
      balanceUsd: account.balanceUsd,
      initialBalanceUsd: account.initialBalanceUsd,
      equityUsd: account.equityUsd,
      totalRealizedPnlUsd: account.totalRealizedPnlUsd,
      winCount: account.winCount,
      lossCount: account.lossCount,
      totalTrades: account.totalTrades,
      autoTraderActive: account.autoTraderActive,
      autoTraderMinConfidence: account.autoTraderMinConfidence,
      autoTraderDefaultLeverage: account.autoTraderDefaultLeverage,
      autoTraderPositionSizeUsd: account.autoTraderPositionSizeUsd,
      telegramBotToken: account.telegramBotToken || '',
      telegramChatId: account.telegramChatId || '',
      telegramNotificationsEnabled: account.telegramNotificationsEnabled || false,
      telegramAutoTradeExecutedOnly: account.telegramAutoTradeExecutedOnly || false,
      executionMode: account.executionMode || 'PAPER',
      bitunixApiKey: account.bitunixApiKey || '',
      bitunixSecretKey: account.bitunixSecretKey || '',
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to save user account to Firestore:', err);
  }
};

// Load User Account from Firestore
export const loadUserAccount = async (userId: string): Promise<Partial<TraderAccount> | null> => {
  if (!userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as Partial<TraderAccount>;
    }
  } catch (err) {
    console.warn('Failed to load user account from Firestore:', err);
  }
  return null;
};

// Save Open Position
export const savePositionToFirestore = async (userId: string, position: PaperPosition) => {
  if (!userId) return;
  try {
    const posRef = doc(db, 'users', userId, 'positions', position.id);
    await setDoc(posRef, position);
  } catch (err) {
    console.warn('Failed to save position to Firestore:', err);
  }
};

// Remove Closed Position
export const removePositionFromFirestore = async (userId: string, positionId: string) => {
  if (!userId) return;
  try {
    const posRef = doc(db, 'users', userId, 'positions', positionId);
    await deleteDoc(posRef);
  } catch (err) {
    console.warn('Failed to delete position from Firestore:', err);
  }
};

// Save Closed Trade History
export const saveClosedTradeToFirestore = async (userId: string, trade: ClosedTrade) => {
  if (!userId) return;
  try {
    const tradeRef = doc(db, 'users', userId, 'trades', trade.id);
    await setDoc(tradeRef, trade);
  } catch (err) {
    console.warn('Failed to save closed trade to Firestore:', err);
  }
};

// Save Cached News Signal
export const saveNewsSignalToFirestore = async (news: CryptoNewsSignal) => {
  if (!auth.currentUser) return; // Only save to cloud Firestore when authenticated
  try {
    const newsRef = doc(db, 'news_signals', news.id || `news_${news.symbol}_${Date.now()}`);
    await setDoc(newsRef, news);
  } catch (err) {
    // Silently ignore if unauthenticated or network restricted
  }
};

// Subscribe to User Positions
export const subscribeToPositions = (userId: string, onUpdate: (positions: PaperPosition[]) => void) => {
  if (!userId) return () => {};
  const posCol = collection(db, 'users', userId, 'positions');
  return onSnapshot(posCol, (snapshot) => {
    const positions: PaperPosition[] = [];
    snapshot.forEach((d) => {
      positions.push(d.data() as PaperPosition);
    });
    // Sort descending by openTime
    positions.sort((a, b) => b.openTime - a.openTime);
    onUpdate(positions);
  }, (err) => {
    console.warn('Positions Firestore subscription error:', err);
  });
};

// Subscribe to Closed Trades History
export const subscribeToClosedTrades = (userId: string, onUpdate: (trades: ClosedTrade[]) => void) => {
  if (!userId) return () => {};
  const tradesCol = collection(db, 'users', userId, 'trades');
  return onSnapshot(tradesCol, (snapshot) => {
    const trades: ClosedTrade[] = [];
    snapshot.forEach((d) => {
      trades.push(d.data() as ClosedTrade);
    });
    trades.sort((a, b) => b.closeTime - a.closeTime);
    onUpdate(trades);
  }, (err) => {
    console.warn('Trades Firestore subscription error:', err);
  });
};
