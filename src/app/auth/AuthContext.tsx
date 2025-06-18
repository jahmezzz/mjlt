
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, type User } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { createUserProfileInDbAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';


interface AuthContextType {
  currentUser: User | null;
  dbUserProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, fullName?: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  fetchDbUserProfile: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbUserProfile, setDbUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchDbUserProfile = async (userId: string) => {
    try {
      const result = await createUserProfileInDbAction({ uid: userId });
      if (result.success && result.profile) {
        setDbUserProfile(result.profile);
      } else if(result.message === "User profile already exists.") {
        // If profile already exists, try fetching it
        const existingProfileResult = await createUserProfileInDbAction({ uid: userId, fetchOnly: true });
        if(existingProfileResult.success && existingProfileResult.profile) {
            setDbUserProfile(existingProfileResult.profile);
        } else {
            console.error("Failed to fetch existing DB user profile:", existingProfileResult.message);
            setDbUserProfile(null);
        }
      }
       else {
        console.error("Failed to create/fetch DB user profile:", result.message);
        setDbUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching/creating DB user profile:", error);
      setDbUserProfile(null);
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchDbUserProfile(user.uid);
      } else {
        setDbUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/'); // Redirect to homepage after login
      toast({ title: "Login Successful", description: "Welcome back!" });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, pass: string, fullName?: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        const profileResult = await createUserProfileInDbAction({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: fullName || userCredential.user.displayName,
        });
        if (profileResult.success && profileResult.profile) {
          setDbUserProfile(profileResult.profile);
          toast({ title: "Signup Successful", description: "Welcome! Your profile has been created." });
          router.push('/'); // Redirect to homepage after signup
        } else {
          toast({ title: "Profile Creation Failed", description: profileResult.message || "Could not save profile.", variant: "destructive" });
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      if (userCredential.user) {
        const profileResult = await createUserProfileInDbAction({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
        });
        if (profileResult.success && profileResult.profile) {
          setDbUserProfile(profileResult.profile);
          toast({ title: "Login Successful", description: "Welcome!" });
          router.push('/'); // Redirect to homepage
        } else if (profileResult.message === "User profile already exists.") {
            // If profile already exists, means it's a login, fetch it
            await fetchDbUserProfile(userCredential.user.uid);
            toast({ title: "Login Successful", description: "Welcome back!" });
            router.push('/');
        }
        else {
          toast({ title: "Profile Sync Failed", description: profileResult.message || "Could not sync profile with Google login.", variant: "destructive" });
        }
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({ title: "Google Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setDbUserProfile(null);
      router.push('/login');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, dbUserProfile, loading, login, signup, googleLogin, logout, fetchDbUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
