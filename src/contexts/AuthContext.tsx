import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPartner: boolean;
  setIsPartner: (value: boolean) => void;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116' && !error.message.includes('406')) {
        console.error('Error fetching user profile:', error);
      }
      
      const hasPartnerRole = !!(profile && (profile as any).is_partner_onboarded);
      setIsPartner(hasPartnerRole);
      // Ensure local storage is in sync
      localStorage.setItem('isPartner', hasPartnerRole.toString());
    } catch (err) {
      console.error('Catch error fetching user profile:', err);
      // Fallback to local storage if DB fetch fails
      const stored = localStorage.getItem('isPartner');
      if (stored !== null) {
        setIsPartner(stored === 'true');
      }
    }
  };

  const handleSetIsPartner = async (value: boolean) => {
    setIsPartner(value);
    localStorage.setItem('isPartner', value.toString());

    if (user) {
      // Update partner status in DB
      const { error } = await supabase
        .from('users')
        .update({ is_partner_onboarded: value } as any)
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating partner status:', error);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          // Fetch role in background, don't block initial loading
          fetchUserRole(initialSession.user.id);
        }
      } catch (err) {
        console.error('Error during initial auth check:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setIsPartner(false);
          localStorage.removeItem('isPartner');
        }
        
        // Initial loading might already be false from initAuth, but ensure it stays consistent
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  };

  const deleteAccount = async () => {
    // Delete user's profile first (cascades handled by DB)
    if (user) {
      await supabase.from('profiles').delete().eq('user_id', user.id);
    }
    
    // Sign out the user (actual account deletion requires admin API)
    await supabase.auth.signOut();
    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state to prevent being stuck logged in
      setSession(null);
      setUser(null);
      setIsPartner(false);
      localStorage.removeItem('isPartner');
      // If we're on a protected route, this will trigger the ProtectedRoute redirect
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isPartner,
      setIsPartner: handleSetIsPartner,
      signUp, 
      signIn, 
      signInWithGoogle, 
      signOut,
      resetPassword,
      updatePassword,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};
