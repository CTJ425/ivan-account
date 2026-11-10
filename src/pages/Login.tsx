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
        // Ignore sessionStorage access errors
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
    // Check for OAuth error returned in query string or URL hash
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
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">登入</h1>
      </header>

      <div className="card login-card">
        <p className="login-desc">
          請使用已加入白名單的 Google 帳號登入個人記帳系統。
        </p>

        {errorMsg && (
          <div className="alert-box" role="alert">
            <p>{errorMsg}</p>
          </div>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={handleGoogleSignIn}
          disabled={loading || isSigningIn}
        >
          {isSigningIn ? '連線中...' : '使用 Google 帳號登入'}
        </button>
      </div>
    </div>
  );
};

export default Login;
