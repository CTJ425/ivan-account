import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';

const Categories = lazy(() => import('./pages/Categories'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Charts = lazy(() => import('./pages/Charts'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

const LoadingFallback: React.FC = () => (
  <div className="page-container">
    <p className="placeholder-text">載入中...</p>
  </div>
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
            <Route
              path="/login"
              element={
                <div className="app-layout">
                  <main className="app-main">
                    <Login />
                  </main>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
