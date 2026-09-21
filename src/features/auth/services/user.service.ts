import { doc, getDoc, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firestore";
import { app, EXPECTED_PROJECT_ID } from "@/lib/firebase/client";
import { UserDocument } from "@/types";

/**
 * Diagnostic logger matching all 9 inspection points required for diagnosis
 */
async function logDiagnostic(
  operationName: string,
  targetUid: string
): Promise<{ valid: boolean; idTokenProjectId?: string }> {
  const currentAuthUser = auth.currentUser;
  const currentAuthUid = currentAuthUser?.uid || null;
  const docPath = `users/${targetUid}`;
  const isUidEqual = Boolean(currentAuthUid && currentAuthUid === targetUid);
  const clientProjectId = app.options.projectId;

  let idTokenAud: string | undefined = undefined;
  let tokenError: string | undefined = undefined;

  if (currentAuthUser) {
    try {
      const tokenResult = await currentAuthUser.getIdTokenResult();
      idTokenAud = (tokenResult.claims.aud as string) || (tokenResult.claims.project_id as string);
    } catch (e: unknown) {
      tokenError = (e as Error).message;
    }
  }

  const report = {
    operation: operationName,
    "1. auth.currentUser?.uid": currentAuthUid,
    "2. target document path": docPath,
    "3. auth.currentUser exists?": Boolean(currentAuthUser),
    "4. path UID === auth.currentUser.uid?": isUidEqual,
    "5. initialized client projectId": clientProjectId,
    "5b. expected projectId": EXPECTED_PROJECT_ID,
    "5c. idToken audience (aud)": idTokenAud,
    "token error": tokenError,
  };

  console.log(`[Firestore Diagnostic - ${operationName}]:`, JSON.stringify(report, null, 2));

  return {
    valid: isUidEqual,
    idTokenProjectId: idTokenAud,
  };
}

/**
 * Creates or updates a user profile document in Firestore with detailed step-by-step instrumentation.
 */
export async function createUserDocument(
  user: User,
  additionalData?: { displayName?: string }
): Promise<UserDocument> {
  if (!user?.uid) throw new Error("User UID is required");

  const now = new Date().toISOString();
  const fallbackUser: UserDocument = {
    uid: user.uid,
    displayName: additionalData?.displayName || user.displayName || "Café Guest",
    email: user.email || "",
    photoURL: user.photoURL || null,
    createdAt: now,
    updatedAt: now,
    role: "customer",
  };

  // 1 & 3: Never attempt Firestore write if there is no authenticated session or if UID does not match
  if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
    console.warn("[User Service: createUserDocument skipped]: auth.currentUser is not set or UID mismatch.");
    return fallbackUser;
  }

  // Instrument before operation
  const diag = await logDiagnostic("createUserDocument", user.uid);
  if (!diag.valid) {
    console.warn("[User Service: createUserDocument aborted]: UID validation failed.");
    return fallbackUser;
  }

  const userDocRef = doc(db, "users", user.uid);

  // 8a: Test getDoc step
  let docExists = false;
  try {
    console.log(`[User Service: createUserDocument]: Executing getDoc(${userDocRef.path})...`);
    const userSnapshot = await getDoc(userDocRef);
    docExists = userSnapshot.exists();
    console.log(`[User Service: createUserDocument]: getDoc result exists = ${docExists}`);

    if (docExists) {
      return userSnapshot.data() as UserDocument;
    }
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error(`[User Service: FAILURE in getDoc(${userDocRef.path})]:`, {
      code: err?.code,
      message: err?.message,
      error,
    });
    // If getDoc failed, do not return yet, attempt setDoc below or report
  }

  // 8b: Test setDoc step
  try {
    console.log(`[User Service: createUserDocument]: Executing setDoc(${userDocRef.path})...`);
    await setDoc(userDocRef, fallbackUser, { merge: true });
    console.log(`[User Service: createUserDocument]: setDoc(${userDocRef.path}) SUCCEEDED.`);
    return fallbackUser;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error(`[User Service: FAILURE in setDoc(${userDocRef.path})]:`, {
      code: err?.code,
      message: err?.message,
      error,
    });
    return fallbackUser;
  }
}

/**
 * Retrieves a user document from Firestore with detailed instrumentation.
 */
export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  // 1. When Firebase reports no authenticated user, do NOT attempt to read users/{uid}
  if (!uid || typeof uid !== "string") {
    return null;
  }

  // 2 & 4. Ensure current auth session exists and matches target UID exactly
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return null;
  }

  // Instrument before getDoc
  const diag = await logDiagnostic("getUserDocument", uid);
  if (!diag.valid) {
    return null;
  }

  const userDocRef = doc(db, "users", uid);

  try {
    console.log(`[User Service: getUserDocument]: Executing getDoc(${userDocRef.path})...`);
    const userSnapshot = await getDoc(userDocRef);

    // 9. Verify getDoc correctly returns exists() === false when missing
    if (userSnapshot.exists()) {
      console.log(`[User Service: getUserDocument]: getDoc(${userDocRef.path}) SUCCEEDED. Document exists.`);
      return userSnapshot.data() as UserDocument;
    } else {
      console.log(`[User Service: getUserDocument]: getDoc(${userDocRef.path}) SUCCEEDED. Document does not exist (exists = false).`);
      return null;
    }
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error(`[User Service: FAILURE in getUserDocument -> getDoc(${userDocRef.path})]:`, {
      code: err?.code,
      message: err?.message,
      error,
    });
    return null;
  }
}
