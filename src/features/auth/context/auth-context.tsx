"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/auth";
import { UserDocument } from "@/types";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  sendPasswordReset,
} from "../services/auth.service";
import { getUserDocument, createUserDocument } from "../services/user.service";

interface AuthContextType {
  user: User | null;
  userProfile: UserDocument | null;
  loading: boolean;
  signUp: (email: string, pass: string, name: string) => Promise<User>;
  signIn: (email: string, pass: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize Firestore profile only when a valid authenticated user is present
  const syncProfile = useCallback(async (authenticatedUser: User) => {
    if (!authenticatedUser?.uid) return;

    try {
      console.log(`[Auth Context: syncProfile]: Awaiting ID token for UID ${authenticatedUser.uid}...`);
      await authenticatedUser.getIdToken();
      console.log(`[Auth Context: syncProfile]: ID token ready. Calling getUserDocument...`);

      let doc = await getUserDocument(authenticatedUser.uid);
      if (!doc) {
        console.log(`[Auth Context: syncProfile]: Document does not exist. Calling createUserDocument...`);
        doc = await createUserDocument(authenticatedUser);
      }
      if (doc) {
        setUserProfile(doc);
      }
    } catch (err) {
      console.warn("[Auth Context]: Profile sync error:", err);
    }
  }, []);

  useEffect(() => {
    // onAuthStateChanged is the authoritative listener for session changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Authenticated session confirmed
        setUser(firebaseUser);
        setLoading(false);
        // Asynchronously synchronize Firestore user profile
        await syncProfile(firebaseUser);
      } else {
        // No authenticated session: do NOT call getUserDocument or touch Firestore
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [syncProfile]);

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  const handleSignUp = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const newUser = await signUpWithEmail(email, pass, name);
      // Auth state observer (onAuthStateChanged) will automatically synchronize profile
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const signedInUser = await signInWithEmail(email, pass);
      // Auth state observer (onAuthStateChanged) will automatically synchronize profile
      return signedInUser;
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      // Auth state observer (onAuthStateChanged) will automatically synchronize profile
      return googleUser;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    await sendPasswordReset(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signInWithGoogle: handleGoogleSignIn,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
