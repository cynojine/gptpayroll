import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { getProfileForUser, getBrandingSettings } from '../services/api';
import { Profile, BrandingSettings } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  branding: BrandingSettings | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            setSession(session);
            setUser(session?.user ?? null);
            
            const [brandingSettings, userProfile] = await Promise.all([
                getBrandingSettings(),
                session?.user ? getProfileForUser() : Promise.resolve(null),
            ]);
            
            setBranding(brandingSettings);
            setProfile(userProfile);
        } catch (error) {
            console.error("Error during session initialization:", error);
        } finally {
            setLoading(false);
        }
    };
    
    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      const userProfile = session?.user ? await getProfileForUser() : null;
      setProfile(userProfile);
      
      // If auth state changes, we are no longer in the initial loading state.
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
    // No need to set states here, onAuthStateChange will handle it.
  }, []);

  const value = {
    session,
    user,
    profile,
    branding,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
