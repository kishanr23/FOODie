'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();

  // Simple debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(handler);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { results: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: debouncedQuery.length > 0
  });

  return (
    <div className="page-content">
      <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + var(--space-4))', zIndex: 10, background: 'var(--bg-deep)', paddingBottom: 'var(--space-4)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Explore Mysuru</h2>
        
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className="input-group" style={{ flex: 1, marginBottom: 0, position: 'relative' }}>
            <SearchIcon size={20} color="var(--ink-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search places, vibes, or cuisines..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            {query && (
              <button 
                className="btn-icon" 
                onClick={() => setQuery('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}
              >
                <X size={16} color="var(--ink-muted)" />
              </button>
            )}
          </div>
          <button className="btn btn-secondary btn-icon">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        {!debouncedQuery && (
          <div>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Popular Categories</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              {['Café', 'Restaurant', 'Street Food', 'Rooftop'].map(cat => (
                <div key={cat} className="card card-interactive card-body" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => setQuery(cat)}>
                  <span style={{ fontWeight: 600 }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && debouncedQuery && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card card-body" style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <div className="skeleton skeleton-image" style={{ width: '80px', height: '80px' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                  <div className="skeleton skeleton-text-sm" style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && data?.results?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {data.results.map((place: any) => (
              <div key={place.id} className="card card-interactive" onClick={() => router.push(`/place/${place.slug}`)}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3)' }}>
                  {place.coverImageUrl ? (
                    <img 
                      src={place.coverImageUrl} 
                      alt={place.name} 
                      style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'var(--ink-muted)' }}>No image</span>
                    </div>
                  )}
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
                      {place.name}
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', marginBottom: 'var(--space-2)' }}>
                      {place.category?.name} • {'$'.repeat(place.priceLevel || 1)}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {place.vibes?.slice(0, 2).map((pv: any) => (
                        <span key={pv.vibe.id} className="badge badge-verified" style={{ background: 'var(--bg-surface)', color: 'var(--ink-muted)' }}>
                          {pv.vibe.emoji} {pv.vibe.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && debouncedQuery && data?.results?.length === 0 && (
          <div className="empty-state">
            <h3 style={{ color: 'var(--ink)' }}>No results found</h3>
            <p style={{ color: 'var(--ink-muted)' }}>Try a different search term or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
