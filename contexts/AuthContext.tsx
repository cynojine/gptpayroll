import * as React from 'react';
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

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [branding, setBranding] = React.useState<BrandingSettings | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Supabase v2.x onAuthStateChange fires on initial load, and on subsequent auth events.
    // This handles everything: initial load, login, logout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile and branding settings in parallel.
        // This ensures all required app-level data is loaded on any auth change.
        const [userProfile, brandingSettings] = await Promise.all([
          session?.user ? getProfileForUser() : Promise.resolve(null),
          getBrandingSettings()
        ]);

        setProfile(userProfile);
        setBranding(brandingSettings);
      } catch (error) {
        console.error("Error in onAuthStateChange handler:", error);
      } finally {
        // This is crucial. It ensures the app is never stuck in a loading state.
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  const signOut = React.useCallback(async () => {
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
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};