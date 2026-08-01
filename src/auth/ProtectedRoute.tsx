import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { UserRole } from '../lib/types';

export function ProtectedRoute({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: ReactNode;
}) {
  const { profile, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (!allowed.includes(profile.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
