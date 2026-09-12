'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { PostCard } from '@/components/feed/PostCard';
import { UserPlus, UserMinus, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) throw new Error('Profile not found');
      return res.json();
    }
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error('Please log in to follow users');
        router.push('/login');
        throw new Error('Not logged in');
      }
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' });
      if (!res.ok) throw new Error('Follow action failed');
      return res.json();
    },
    onSuccess: (result) => {
      // Optimistically update the cache
      queryClient.setQueryData(['profile', username], (old: any) => ({
        ...old,
        isFollowing: result.following,
        stats: {
          ...old.stats,
          followers: result.following ? old.stats.followers + 1 : old.stats.followers - 1
        }
      }));
      toast.success(result.following ? 'Followed' : 'Unfollowed');
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div className="skeleton skeleton-image" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '50%', height: '32px' }} />
            <div className="skeleton skeleton-text-sm" style={{ width: '30%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="page-content empty-state">
        <h2>User not found</h2>
        <p>The profile you're looking for doesn't exist.</p>
        <button className="btn btn-secondary" onClick={() => router.push('/')}>Go Home</button>
      </div>
    );
  }

  const { profile, stats, isFollowing, posts } = data;
  const isMe = user?.username === username;

  return (
    <div className="page-content" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-8))' }}>
      
      {/* Profile Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div className="avatar" style={{ width: '100px', height: '100px', fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} />
          ) : (
            profile.displayName.charAt(0).toUpperCase()
          )}
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
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{stats.posts}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Experiences</div>
          </div>
        </div>

        {!isMe && (
          <button 
            className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => followMutation.mutate()}
            disabled={followMutation.isPending}
            style={{ minWidth: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
          >
            {isFollowing ? <><UserMinus size={18}/> Unfollow</> : <><UserPlus size={18}/> Follow</>}
          </button>
        )}
        
        {isMe && (
          <button className="btn btn-secondary" onClick={() => router.push('/profile')} style={{ minWidth: '150px' }}>
            Edit Profile
          </button>
        )}
      </div>

      <div className="divider" />

      {/* User's Feed */}
      <div>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Recent Experiences</h3>
        {posts?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {posts.map((post: any) => (
              <PostCard key={post.id} post={{...post, user: { profile }}} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p style={{ color: 'var(--ink-muted)' }}>{isMe ? "You haven't shared any experiences yet." : "This user hasn't shared any experiences yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
