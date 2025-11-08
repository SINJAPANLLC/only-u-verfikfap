"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth, db } from "@/lib/firebase.client";

export type OnlyURole = "fan" | "creator" | "agency" | "admin";

export type OnlyUProfile = {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  links?: { label: string; url: string }[];
};

export type OnlyUUser = {
  uid: string;
  email: string | null;
  roles: OnlyURole[];
  profile: OnlyUProfile;
  firebaseUser: FirebaseUser;
};

type AuthContextValue = {
  user: OnlyUUser | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const defaultProfile: OnlyUProfile = {
  bio: "",
  links: []
};

async function ensureUserDocument(user: FirebaseUser, roles: OnlyURole[]) {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      roles,
      profile: {
        displayName: user.displayName ?? "",
        avatarUrl: user.photoURL ?? "",
        ...defaultProfile
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    await setDoc(
      ref,
      {
        roles,
        email: user.email,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OnlyUUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        const rolesClaim = tokenResult.claims.roles;
        const roles: OnlyURole[] = Array.isArray(rolesClaim)
          ? (rolesClaim as OnlyURole[])
          : ["fan"];

        await ensureUserDocument(firebaseUser, roles);
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          roles,
          profile: (userDoc.data()?.profile as OnlyUProfile) ?? defaultProfile,
          firebaseUser
        });
      } catch (error) {
        console.error("AuthProvider error", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signOutUser: () => signOut(auth)
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
