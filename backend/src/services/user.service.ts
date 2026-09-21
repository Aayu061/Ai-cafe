import { getFirebaseAdminDb } from "../config/firebase-admin";

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export class UserService {
  /**
   * Retrieves a user profile document from Cloud Firestore via Firebase Admin SDK.
   * Access path: users/{uid}
   */
  async getUserProfile(uid: string): Promise<UserProfileData | null> {
    if (!uid || typeof uid !== "string") {
      throw new Error("Invalid UID provided for profile lookup");
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection("users").doc(uid);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data();
    return {
      uid,
      email: data?.email || "",
      displayName: data?.displayName || "Café Guest",
      photoURL: data?.photoURL || null,
      role: data?.role || "customer",
      createdAt: data?.createdAt || new Date().toISOString(),
      updatedAt: data?.updatedAt || new Date().toISOString(),
      ...data,
    };
  }
}

export const userService = new UserService();
