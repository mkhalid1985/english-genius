import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, collection, getDocs, writeBatch } from 'firebase/firestore';
import type { Curriculum, ParticipationRecord, ActivityRecord } from '../types';

// We will load config from localStorage so the user can input it in the Admin Console
const getFirebaseConfig = () => {
    const saved = localStorage.getItem('firebaseConfig');
    if (!saved) return null;
    try {
        // Safely parse. If it fails (e.g. partial string), return null to prevent app crash.
        return JSON.parse(saved);
    } catch (e) {
        console.error("Failed to parse firebaseConfig from localStorage. Resetting config.", e);
        return null; 
    }
};

let db: any = null;

export const initFirebase = () => {
    const config = getFirebaseConfig();
    if (config && !db) {
        try {
            const app = initializeApp(config);
            db = getFirestore(app);
            console.log("Firebase initialized successfully");
            return true;
        } catch (e) {
            console.error("Firebase initialization failed (check your API key/Project ID):", e);
            return false;
        }
    }
    return !!db;
};

// --- CURRICULUM SYNC ---

export const saveCurriculumToCloud = async (curriculum: Curriculum) => {
    if (!db) return;
    try {
        // We store the whole curriculum in a single document 'school/curriculum'
        await setDoc(doc(db, 'school', 'curriculum'), curriculum);
    } catch (e) {
        console.error("Error saving curriculum to cloud:", e);
    }
};

export const getCurriculumFromCloud = async (): Promise<Curriculum | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, 'school', 'curriculum');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Curriculum;
        }
    } catch (e) {
        console.error("Error fetching curriculum from cloud:", e);
    }
    return null;
};

// --- PARTICIPATION SYNC ---

export const saveParticipationToCloud = async (record: ParticipationRecord) => {
    if (!db) return;
    try {
        // We store participation in a collection 'participation'
        // Using the record ID as the document ID ensures no duplicates
        await setDoc(doc(db, 'participation', record.id), record);
    } catch (e) {
        console.error("Error saving participation:", e);
    }
};

export const getAllParticipationFromCloud = async (): Promise<ParticipationRecord[]> => {
    if (!db) return [];
    try {
        const querySnapshot = await getDocs(collection(db, 'participation'));
        const records: ParticipationRecord[] = [];
        querySnapshot.forEach((doc) => {
            records.push(doc.data() as ParticipationRecord);
        });
        return records;
    } catch (e) {
        console.error("Error fetching participation:", e);
        return [];
    }
};

// --- ACTIVITY RECORDS SYNC ---

export const saveActivityRecordToCloud = async (record: ActivityRecord) => {
    if (!db) return;
    try {
        await setDoc(doc(db, 'activities', record.id), record);
    } catch (e) {
        console.error("Error saving activity record:", e);
    }
};

export const getAllActivityRecordsFromCloud = async (): Promise<ActivityRecord[]> => {
    if (!db) return [];
    try {
        const querySnapshot = await getDocs(collection(db, 'activities'));
        const records: ActivityRecord[] = [];
        querySnapshot.forEach((doc) => {
            records.push(doc.data() as ActivityRecord);
        });
        return records;
    } catch (e) {
        console.error("Error fetching activity records:", e);
        return [];
    }
};

// --- UTILS ---

export const checkDatabaseAccess = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!db) return { ok: false, error: "Firebase not initialized" };
    try {
        // Try to read a doc to check permissions
        await getDoc(doc(db, 'school', 'curriculum'));
        return { ok: true };
    } catch (e: any) {
        const code = e.code || (e.message && e.message.includes('permission') ? 'permission-denied' : 'unknown');
        return { ok: false, error: code };
    }
};

export const uploadLocalDataToCloud = async (
    curriculum: Curriculum,
    localParticipation: ParticipationRecord[],
    localActivities: ActivityRecord[]
): Promise<boolean> => {
    if (!db) {
        console.error("Database not initialized during upload.");
        return false;
    }

    try {
        console.log("Starting upload...");
        
        // 1. Save Curriculum
        await setDoc(doc(db, 'school', 'curriculum'), curriculum);
        console.log("Curriculum saved.");

        // 2. Save Participation Records in batches
        if (localParticipation && localParticipation.length > 0) {
            console.log(`Uploading ${localParticipation.length} participation records...`);
            const participationChunks = [];
            for (let i = 0; i < localParticipation.length; i += 400) {
                participationChunks.push(localParticipation.slice(i, i + 400));
            }

            for (const chunk of participationChunks) {
                const batch = writeBatch(db);
                chunk.forEach(record => {
                    const ref = doc(db, 'participation', record.id);
                    batch.set(ref, record);
                });
                await batch.commit();
            }
            console.log("Participation records saved.");
        }

        // 3. Save Activity Records in batches
        if (localActivities && localActivities.length > 0) {
            console.log(`Uploading ${localActivities.length} activity records...`);
            const activityChunks = [];
            for (let i = 0; i < localActivities.length; i += 400) {
                activityChunks.push(localActivities.slice(i, i + 400));
            }

            for (const chunk of activityChunks) {
                const batch = writeBatch(db);
                chunk.forEach(record => {
                    const ref = doc(db, 'activities', record.id);
                    batch.set(ref, record);
                });
                await batch.commit();
            }
            console.log("Activity records saved.");
        }

        return true;
    } catch (e) {
        console.error("Error uploading local data to cloud:", e);
        return false;
    }
};