'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PostCard } from '@/components/feed/PostCard';

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: feedData, isLoading: isFeedLoading } = useQuery({
    queryKey: ['feed', user?.id],
    queryFn: async () => {
      const res = await fetch('/api/feed');
      if (!res.ok) throw new Error('Failed to fetch feed');
      return res.json();
    },
    enabled: !isAuthLoading
  });

  if (isAuthLoading) {
    return (
      <div className="page-content" style={{ marginTop: 'var(--space-8)' }}>
        <div className="skeleton skeleton-image" style={{ height: '200px', marginBottom: 'var(--space-4)' }} />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text-sm" />
      </div>
    );
  }

  return (
    <div className="page-content" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-8))' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
          {user ? `Welcome back, ${user.displayName.split(' ')[0]}` : 'Discover Mysuru'}
        </h2>
        <p style={{ color: 'var(--ink-muted)', marginTop: 'var(--space-1)' }}>
          Real people. Real places. Real vibes.
        </p>
      </div>

      {!user && (
        <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Join the community</h3>
          <p style={{ color: 'var(--ink-muted)', marginBottom: 'var(--space-4)' }}>
            Sign up to discover hidden gems and share your own experiences.
          </p>
          <Link href="/signup" className="btn btn-primary">
            Create an Account
          </Link>
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>{user ? 'Your Feed' : 'Trending Experiences'}</h3>
        
        {isFeedLoading ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
             {[1, 2].map(i => (
                <div key={i} className="card card-body">
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <div className="skeleton skeleton-image" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                      <div className="skeleton skeleton-text-sm" style={{ width: '20%' }} />
                    </div>
                  </div>
                  <div className="skeleton skeleton-image" style={{ height: '200px' }} />
                </div>
             ))}
           </div>
        ) : feedData?.posts?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {feedData.posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-8)' }}>
            <p style={{ color: 'var(--ink-subtle)' }}>No experiences found. Go explore and be the first to post!</p>
          </div>
        )}
      </div>
    </div>
  );
}
