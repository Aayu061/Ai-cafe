import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/auth";

export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  if (displayName) {
    try {
      await updateProfile(user, { displayName });
    } catch (profileError) {
      console.warn("Could not set displayName on auth profile:", profileError);
    }
  }

  return user;
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function mapAuthError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists. Please sign in instead.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
        return "No account found with this email address.";
      case "auth/wrong-password":
        return "Incorrect password. Please double check and try again.";
      case "auth/invalid-credential":
        return "Invalid email or password. Please verify your credentials.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/popup-closed-by-user":
        return "Sign-in was cancelled before completion.";
      case "auth/popup-blocked":
        return "Sign-in popup was blocked by browser. Please enable popups.";
      case "auth/too-many-requests":
        return "Too many unsuccessful attempts. Please wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      default:
        return (error as { message?: string }).message || "Authentication error. Please try again.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}
