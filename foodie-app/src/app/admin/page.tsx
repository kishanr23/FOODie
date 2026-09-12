'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, ShieldAlert, Trash2, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin_reports'],
    queryFn: async () => {
      const res = await fetch('/api/admin/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
    enabled: user?.role === 'ADMIN'
  });

  const actionMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string, action: string }) => {
      const res = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action })
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_reports'] });
      toast.success('Action executed');
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isAuthLoading) return <div className="page-content">Loading...</div>;
  if (!user || user.role !== 'ADMIN') {
    router.push('/');
    return null;
  }

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <ShieldAlert size={28} color="var(--chili)" />
        <h1>Admin Dashboard</h1>
      </div>

      <h3 style={{ marginBottom: 'var(--space-4)' }}>Report Queue</h3>

      {isLoading ? (
        <div>Loading reports...</div>
      ) : data?.reports?.length > 0 ? (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {data.reports.map((report: any) => (
            <div key={report.id} className="card card-body" style={{ borderLeft: '4px solid var(--chili)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div>
                  <span className="badge" style={{ background: 'var(--chili)', color: '#fff', marginRight: 'var(--space-2)' }}>
                    {report.reason}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                    Reported by @{report.reporter?.username}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                  {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                  Target: {report.targetType} ({report.targetId})
                </div>
                {report.description && (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', marginTop: 'var(--space-2)' }}>
                    "{report.description}"
                  </p>
                )}
                {/* Preview target content if it's a POST */}
                {report.post && (
                  <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-2)' }}>
                    <div><strong>Post by:</strong> @{report.post.user?.username} (Status: {report.post.status})</div>
                    <div>{report.post.caption}</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => actionMutation.mutate({ reportId: report.id, action: 'HIDE_POST' })}
                  disabled={report.targetType !== 'POST' || actionMutation.isPending}
                >
                  <Trash2 size={14} /> Hide Content
                </button>
                <button 
                  className="btn btn-sm"
                  style={{ background: 'var(--chili)', color: '#fff' }}
                  onClick={() => actionMutation.mutate({ reportId: report.id, action: 'SUSPEND_USER' })}
                  disabled={actionMutation.isPending}
                >
                  <UserX size={14} /> Suspend User
                </button>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => actionMutation.mutate({ reportId: report.id, action: 'DISMISS' })}
                  disabled={actionMutation.isPending}
                >
                  <CheckCircle size={14} /> Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CheckCircle size={48} color="var(--mint)" style={{ marginBottom: 'var(--space-4)' }} />
          <h3>All clear!</h3>
          <p style={{ color: 'var(--ink-muted)' }}>There are no pending reports to review.</p>
        </div>
      )}
    </div>
  );
}
