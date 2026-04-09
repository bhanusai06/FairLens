import { db } from './firebase';
import {
  collection, addDoc, query, where,
  orderBy, limit, getDocs, serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { BiasAnalysisResult } from './gemini';

export interface AuditRecord {
  id?: string;
  userId?: string;
  datasetName: string;
  datasetType: string;
  biasScore: number;
  severity: string;
  analyzedAt: Timestamp | null;
  result: BiasAnalysisResult;
}

/**
 * Save an audit result to Firestore (optional — only if user is signed in)
 */
export async function saveAuditRecord(
  userId: string | undefined,
  datasetName: string,
  datasetType: string,
  result: BiasAnalysisResult
): Promise<string | null> {
  if (!userId) return null; // Anonymous users don't get saved history
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return null; // Firebase not configured

  try {
    const ref = await addDoc(collection(db, 'audits'), {
      userId,
      datasetName,
      datasetType,
      biasScore: result.bias_score,
      severity: result.severity,
      analyzedAt: serverTimestamp(),
      result,
    });
    return ref.id;
  } catch (err) {
    console.warn('[Firestore] Could not save audit:', err);
    return null;
  }
}

/**
 * Fetch the last 10 audits for a user
 */
export async function getUserAudits(userId: string): Promise<AuditRecord[]> {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return [];

  try {
    const q = query(
      collection(db, 'audits'),
      where('userId', '==', userId),
      orderBy('analyzedAt', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditRecord[];
  } catch (err) {
    console.warn('[Firestore] Could not fetch audits:', err);
    return [];
  }
}
