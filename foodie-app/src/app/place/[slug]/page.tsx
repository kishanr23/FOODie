'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, Phone, Globe, Star, Bookmark, Share2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import toast from 'react-hot-toast';

export default function PlacePage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['place', slug],
    queryFn: async () => {
      const res = await fetch(`/api/places/${slug}`);
      if (!res.ok) throw new Error('Place not found');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="skeleton skeleton-image" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <div className="skeleton skeleton-text" style={{ width: '60%', height: '32px' }} />
          <div className="skeleton skeleton-text-sm" style={{ width: '40%' }} />
        </div>
      </div>
    );
  }

  if (error || !data?.place) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <h2>Place not found</h2>
          <button className="btn btn-secondary" onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  const { place, stats, posts } = data;

  const handleSave = async () => {
    if (!user) {
      toast.error('Please log in to save places');
      return;
    }
    toast.success('Place saved to your bookmarks');
    // Implement actual save logic API call here later
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `Check out ${place.name} on FOODie`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="page-content">
      {/* Cover Image */}
      <div style={{
        width: '100%',
        height: '300px',
        borderRadius: 'var(--radius-lg)',
        background: place.coverImageUrl ? `url(${place.coverImageUrl}) center/cover` : 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-6)',
        position: 'relative'
      }}>
        {!place.coverImageUrl && <span style={{ color: 'var(--ink-muted)' }}>No cover photo</span>}
      </div>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-1)' }}>{place.name}</h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: 'var(--text-md)' }}>
            {place.category?.name} • {place.cuisines?.map((c: any) => c.cuisine.name).join(', ')} • {'$'.repeat(place.priceLevel || 1)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn-icon" onClick={handleSave} style={{ background: 'var(--bg-surface)' }}>
            <Bookmark size={24} />
          </button>
          <button className="btn-icon" onClick={handleShare} style={{ background: 'var(--bg-surface)' }}>
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Vibes & Ratings Summary */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-6)' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 'var(--space-2)' }}>Community Vibes</h4>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {place.vibes?.length > 0 ? place.vibes.slice(0, 5).map((pv: any) => (
              <span key={pv.vibe.id} className="badge badge-verified">
                {pv.vibe.emoji} {pv.vibe.name}
              </span>
            )) : <span style={{ color: 'var(--ink-subtle)', fontSize: 'var(--text-sm)' }}>No vibes tagged yet</span>}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: 'var(--space-2)' }}>Average Ratings ({stats.totalRatings})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Food</span>
              <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{stats.avgFood ? stats.avgFood.toFixed(1) : '-'} <Star size={12} fill="currentColor" style={{ display: 'inline' }}/></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Vibe</span>
              <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{stats.avgVibe ? stats.avgVibe.toFixed(1) : '-'} <Star size={12} fill="currentColor" style={{ display: 'inline' }}/></span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', color: 'var(--ink-secondary)' }}>
          <MapPin size={20} color="var(--sky)" />
          <span>{place.address}</span>
        </div>
        
        {place.openingHours && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', color: 'var(--ink-secondary)' }}>
            <Clock size={20} color="var(--teal)" />
            <span>Open today (Hours info)</span>
          </div>
        )}

        {place.phone && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', color: 'var(--ink-secondary)' }}>
            <Phone size={20} />
            <span>{place.phone}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            {place.websiteUrl && (
              <a href={place.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--ink-secondary)', textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
                <Globe size={16} />
                <span>Website</span>
              </a>
            )}
        </div>
      </div>

      <div className="divider" />

      {/* User Experiences / Posts Feed */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)' }}>Real Experiences</h3>
          <button className="btn btn-primary btn-sm" onClick={() => router.push(`/create?placeId=${place.id}`)}>
            Log Visit
          </button>
        </div>

        {posts?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {posts.map((post: any) => (
              <div key={post.id} className="card card-body">
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
                  <div className="avatar avatar-sm">
                    {post.user.profile?.avatarUrl ? (
                      <img src={post.user.profile.avatarUrl} alt={post.user.profile.displayName} />
                    ) : (
                      post.user.profile?.displayName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{post.user.profile?.displayName}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-subtle)' }}>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <p style={{ marginBottom: 'var(--space-3)' }}>{post.caption}</p>

                {post.media?.length > 0 && (
                  <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', marginBottom: 'var(--space-3)' }}>
                    {post.media.map((m: any) => (
                      <img key={m.id} src={m.url} alt="Experience" style={{ height: '200px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--ink-muted)' }}>No experiences logged yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
