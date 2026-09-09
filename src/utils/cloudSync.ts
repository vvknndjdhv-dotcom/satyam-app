import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const CLOUD_DOC_PATH = "satyamData";
const CLOUD_DOC_ID = "main";

const STORAGE_KEYS = [
  "satyam_vehicles_v1",
  "satyam_workers_v1",
  "satyam_sheets_v1",
  "satyam_statements_v1",
  "satyam_opening_balance_v1",
  "satyam_worker_advances_v2",
];

/**
 * PC ke local data ko Firebase par upload karega.
 */
export async function uploadLocalDataToCloud(): Promise<boolean> {
  try {
    const payload: Record<string, any> = {};

    for (const key of STORAGE_KEYS) {
      const value = localStorage.getItem(key);

      if (value !== null) {
        try {
          payload[key] = JSON.parse(value);
        } catch {
          payload[key] = value;
        }
      }
    }

    await setDoc(
      doc(db, CLOUD_DOC_PATH, CLOUD_DOC_ID),
      {
        data: payload,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("SATYAM cloud backup successful");
    return true;
  } catch (error) {
    console.error("Cloud upload failed:", error);
    return false;
  }
}

/**
 * Firebase ka data is PC ke localStorage me load karega.
 */
export async function downloadCloudDataToLocal(): Promise<boolean> {
  try {
    const ref = doc(db, CLOUD_DOC_PATH, CLOUD_DOC_ID);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      console.log("Cloud par abhi SATYAM data nahi hai");
      return false;
    }

    const cloudData = snapshot.data()?.data;

    if (!cloudData || typeof cloudData !== "object") {
      return false;
    }

    for (const [key, value] of Object.entries(cloudData)) {
      if (typeof value === "string") {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }

    console.log("SATYAM cloud data downloaded");
    return true;
  } catch (error) {
    console.error("Cloud download failed:", error);
    return false;
  }
}

/**
 * Check karta hai ki cloud par data available hai ya nahi.
 */
export async function hasCloudData(): Promise<boolean> {
  try {
    const snapshot = await getDoc(doc(db, CLOUD_DOC_PATH, CLOUD_DOC_ID));
    return snapshot.exists();
  } catch (error) {
    console.error("Cloud check failed:", error);
    return false;
  }
}