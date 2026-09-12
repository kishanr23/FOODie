'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, List, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CollectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionPublic, setNewCollectionPublic] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await fetch('/api/collections');
      if (!res.ok) throw new Error('Failed to fetch collections');
      return res.json();
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName, isPublic: newCollectionPublic })
      });
      if (!res.ok) throw new Error('Failed to create collection');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsCreating(false);
      setNewCollectionName('');
      toast.success('Collection created');
    },
    onError: (err: any) => toast.error(err.message)
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="page-content" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-8))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1>Your Collections</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setIsCreating(!isCreating)}>
          <Plus size={16} /> New List
        </button>
      </div>

      {isCreating && (
        <form className="card card-body" style={{ marginBottom: 'var(--space-6)' }} onSubmit={handleCreate}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Create a New Collection</h3>
          <div className="input-group">
            <input 
              className="input-field" 
              placeholder="e.g. Best Late Night Dosa" 
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
              autoFocus
              maxLength={50}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <input 
              type="checkbox" 
              id="isPublic" 
              checked={newCollectionPublic} 
              onChange={e => setNewCollectionPublic(e.target.checked)} 
            />
            <label htmlFor="isPublic" style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)' }}>
              Make this list public
            </label>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={createMutation.isPending || !newCollectionName.trim()}>
              Save
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {[1, 2].map(i => <div key={i} className="skeleton skeleton-image" style={{ height: '100px' }} />)}
        </div>
      ) : data?.collections?.length > 0 ? (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {data.collections.map((col: any) => (
            <div key={col.id} className="card card-interactive card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{col.name}</h3>
                  {col.isPublic ? <Globe size={14} color="var(--ink-muted)"/> : <Lock size={14} color="var(--ink-muted)"/>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--ink-secondary)', fontSize: 'var(--text-sm)' }}>
                  <List size={14} />
                  <span>{col._count.places} places</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p style={{ color: 'var(--ink-muted)' }}>You haven't created any collections yet.</p>
        </div>
      )}
    </div>
  );
}
