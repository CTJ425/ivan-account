import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/useAuth';

export const Login: React.FC = () => {
  const { session, loading, isUnauthorized } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      let target = '/';
      try {
        const saved = sessionStorage.getItem('post_login_redirect');
        if (saved) {
          sessionStorage.removeItem('post_login_redirect');
          if (saved.startsWith('/') && !saved.startsWith('//')) {
            target = saved;
          }
        }
      } catch {
        // Ignore storage errors
      }
      navigate(target, { replace: true });
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    if (isUnauthorized) {
      setErrorMsg('此 Google 帳號未被授權使用，請聯絡管理員');
    }
  }, [isUnauthorized]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashString = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashString);

    const error = searchParams.get('error') || hashParams.get('error');
    const errorDesc =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error_code') ||
      hashParams.get('error_code');

    if (error || errorDesc) {
      const descLower = (errorDesc || '').toLowerCase();
      if (
        descLower.includes('whitelist') ||
        descLower.includes('not in the allowed emails') ||
        descLower.includes('database error saving new user') ||
        descLower.includes('not allowed') ||
        descLower.includes('unauthorized')
      ) {
        setErrorMsg('此 Google 帳號未被授權使用，請聯絡管理員');
      } else if (descLower.includes('access_denied') || descLower.includes('user cancelled')) {
        setErrorMsg('已取消 Google 登入程序');
      } else if (errorDesc) {
        setErrorMsg(errorDesc.replace(/\+/g, ' '));
      } else {
        setErrorMsg('登入發生錯誤，請稍後再試');
      }

      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // Ignore history errors
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login',
        },
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '登入發生錯誤');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <main className="login-wrapper">
      <article className="slip-card login-slip">
        <header className="login-header">
          <h1 className="login-title">個人記帳</h1>
        </header>

        <div className="login-content">
          <p className="login-desc">請使用已加入白名單的 Google 帳號登入系統。</p>

          {errorMsg && (
            <p className="login-error" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            type="button"
            className="google-auth-btn"
            onClick={handleGoogleSignIn}
            disabled={loading || isSigningIn}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isSigningIn ? '連線中...' : '使用 Google 帳號登入'}</span>
          </button>
        </div>
      </article>
    </main>
  );
};

export default Login;
