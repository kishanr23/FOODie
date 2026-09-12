'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.details) {
          // Show first validation error
          const firstError = Object.values(data.details)[0];
          throw new Error(Array.isArray(firstError) ? firstError[0] : (firstError as any)._errors?.[0] || 'Validation failed');
        }
        throw new Error(data.error || 'Signup failed');
      }
      
      login(data.user);
      toast.success('Account created successfully!');
      router.push('/');
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-content" style={{ maxWidth: '400px', marginTop: 'var(--space-12)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1>Join FOODie</h1>
        <p style={{ marginTop: 'var(--space-2)' }}>Discover real places and real vibes</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="input-group">
          <label className="input-label" htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            type="text"
            className="input-field"
            value={formData.displayName}
            onChange={handleChange}
            required
            placeholder="John Doe"
            maxLength={50}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="input-field"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="johndoe"
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscores only"
            maxLength={30}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input-field"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input-field"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            minLength={8}
          />
          <p className="input-error" style={{ color: 'var(--ink-muted)', marginTop: '4px' }}>
            Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number.
          </p>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
        Already have an account? <Link href="/login" style={{ fontWeight: 600 }}>Sign in</Link>
      </p>
    </div>
  );
}
