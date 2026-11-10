import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext, type AuthContextType } from './context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let isChecking = false;
    let checkTimeout: ReturnType<typeof setTimeout> | null = null;

    const runWhitelistCheck = () => {
      if (isChecking) {
        return;
      }
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }

      checkTimeout = setTimeout(async () => {
        if (!isMounted || isChecking) return;
        isChecking = true;

        try {
          const { data: isAllowed, error } = await supabase.rpc('is_allowed_user');
          if (!isMounted) return;

          if (error) {
            console.error('Whitelist RPC error (keeping session):', error);
            return;
          }

          if (isAllowed === false) {
            setIsUnauthorized(true);
            setSession(null);
            await supabase.auth.signOut().catch((signOutErr) => {
              console.error('Error signing out unauthorized user:', signOutErr);
            });
          } else if (isAllowed === true) {
            setIsUnauthorized(false);
          }
        } catch (err) {
          if (!isMounted) return;
          console.error('Whitelist check unexpected error (keeping session):', err);
        } finally {
          isChecking = false;
        }
      }, 0);
    };

    // Handle initial session query with error and rejection handling
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('getSession error:', error);
          setSession(null);
          setLoading(false);
          return;
        }
        setSession(data.session);
        setLoading(false);
        if (data.session) {
          runWhitelistCheck();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('getSession rejection:', err);
        setSession(null);
        setLoading(false);
      });

    // Subscribe to auth state changes synchronously to avoid auth deadlock
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        if (checkTimeout) {
          clearTimeout(checkTimeout);
          checkTimeout = null;
        }
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(newSession);
      setLoading(false);

      if (
        newSession &&
        (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')
      ) {
        runWhitelistCheck();
      }
    });

    return () => {
      isMounted = false;
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setSession(null);
      setIsUnauthorized(false);
    }
  };

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    loading,
    isUnauthorized,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
