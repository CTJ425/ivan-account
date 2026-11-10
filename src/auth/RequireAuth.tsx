import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export const RequireAuth: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      const target = location.pathname + location.search;
      try {
        sessionStorage.setItem('post_login_redirect', target);
      } catch {
        // Ignore storage errors
      }
    }
  }, [loading, session, location]);

  if (loading) {
    return (
      <div className="page-container">
        <p className="placeholder-text">載入中...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Navigate
        to={{
          pathname: '/login',
          search: location.search,
          hash: location.hash,
        }}
        replace
      />
    );
  }

  return <Outlet />;
};
