'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PostCard } from '@/components/feed/PostCard';
import { LogOut, Settings, MapPin, Edit2 } from 'lucide-react';

export default function PrivateProfilePage() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const { data, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', user?.username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.username}`);
      if (!res.ok) throw new Error('Profile not found');
      return res.json();
    },
    enabled: !!user?.username
  });

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
          <div className="skeleton skeleton-image" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '50%', height: '32px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const profile = data?.profile || user;
  const stats = data?.stats || { followers: 0, following: 0, posts: 0, saves: 0 };
  const posts = data?.posts || [];

  return (
    <div className="page-content" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-8))' }}>
      
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button className="btn-icon" title="Settings">
          <Settings size={20} color="var(--ink-muted)" />
        </button>
        <button className="btn-icon" onClick={logout} title="Logout">
          <LogOut size={20} color="var(--chili)" />
        </button>
      </div>

      {/* Profile Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div className="avatar" style={{ width: '100px', height: '100px', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)', position: 'relative' }}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} />
          ) : (
            profile.displayName?.charAt(0).toUpperCase()
          )}
          <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--bg-elevated)', borderRadius: '50%', padding: '4px', border: '2px solid var(--bg-deep)' }}>
            <Edit2 size={14} color="var(--ink-muted)" />
          </div>
        </div>
        
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-1)' }}>{profile.displayName}</h1>
        <p style={{ color: 'var(--ink-secondary)', marginBottom: 'var(--space-3)' }}>@{profile.username}</p>
        
        {profile.bio && <p style={{ marginBottom: 'var(--space-3)', maxWidth: '400px' }}>{profile.bio}</p>}
        
        {profile.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--ink-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            <MapPin size={14} />
            <span>{profile.city}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{stats.followers}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Followers</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{stats.following}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Following</div>
          </div>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => router.push('/collections')}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)', color: 'var(--sky)' }}>{stats.saves}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Saved Places</div>
          </div>
        </div>

        <button className="btn btn-secondary" style={{ minWidth: '150px' }}>
          Edit Profile
        </button>
      </div>

      <div className="divider" />

      {/* User's Feed */}
      <div>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Your Experiences</h3>
        {posts?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {posts.map((post: any) => (
              <PostCard key={post.id} post={{...post, user: { profile }}} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p style={{ color: 'var(--ink-muted)' }}>You haven't shared any experiences yet.</p>
            <button className="btn btn-primary" onClick={() => router.push('/create')} style={{ marginTop: 'var(--space-4)' }}>
              Log an Experience
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
