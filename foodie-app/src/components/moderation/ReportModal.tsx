'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Flag, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportModalProps {
  targetType: 'POST' | 'COMMENT' | 'USER' | 'PLACE' | 'VISIT';
  targetId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: 'SPAM', label: 'It\'s spam' },
  { value: 'FAKE_CONTENT', label: 'Fake content or review' },
  { value: 'HARASSMENT', label: 'Harassment or bullying' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { value: 'INCORRECT_PLACE', label: 'Incorrect place details' },
  { value: 'FRAUDULENT_VISIT', label: 'Fraudulent visit/location spoofing' },
  { value: 'PROMOTIONAL', label: 'Unwanted promotional content' },
  { value: 'OTHER', label: 'Other' },
];

export function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [description, setDescription] = useState('');

  const reportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, description })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');
      return data;
    },
    onSuccess: () => {
      toast.success('Report submitted successfully. Thank you for keeping our community safe.');
      onClose();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportMutation.mutate();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600 }}>
            <Flag size={18} color="var(--chili)" /> Report {targetType.toLowerCase()}
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-4)' }}>
          <div className="input-group">
            <label>Why are you reporting this?</label>
            <select 
              className="input-field" 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              style={{ padding: '12px', appearance: 'auto' }}
            >
              {REPORT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Additional details (optional)</label>
            <textarea 
              className="input-field" 
              rows={3} 
              placeholder="Provide any additional context..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={reportMutation.isPending}>
              {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
