'use client';

import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';
import { LogOut, User as UserIcon } from 'lucide-react';

export function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="page-header" style={{ justifyContent: 'space-between' }}>
      <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0, color: 'var(--gold)' }}>
          FOODie
        </h1>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {user ? (
          <>
            <Link href="/profile" className="avatar avatar-sm" title="Profile">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} />
              ) : (
                <span>{user.displayName.charAt(0).toUpperCase()}</span>
              )}
            </Link>
            <button onClick={logout} className="btn-icon" title="Logout">
              <LogOut size={20} color="var(--ink-muted)" />
            </button>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
