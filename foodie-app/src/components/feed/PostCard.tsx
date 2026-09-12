'use client';

import Link from 'next/link';
import { Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { ReportModal } from '@/components/moderation/ReportModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function PostCard({ post }: { post: any }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(post.isLikedByMe || false);
  const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please log in to like');
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to like post');
      return res.json();
    },
    onMutate: async () => {
      // Optimistic update
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    },
    onError: (err: any) => {
      // Revert on error
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      toast.error(err.message);
    }
  });

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      return res.json();
    },
    enabled: showComments
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Please log in to comment');
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('Failed to post comment');
      return res.json();
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card card-body"
      style={{ overflow: 'hidden' }}
    >
      {/* Header: User and Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
        <Link href={`/u/${post.user.profile?.username}`} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <div className="avatar avatar-sm">
            {post.user.profile?.avatarUrl ? (
              <img src={post.user.profile.avatarUrl} alt={post.user.profile.displayName} />
            ) : (
              post.user.profile?.displayName?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{post.user.profile?.displayName}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-subtle)' }}>@{post.user.profile?.username}</div>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-subtle)' }}>
            {new Date(post.createdAt).toLocaleDateString()}
          </div>
          <div style={{ position: 'relative' }}>
            <button className="btn-icon" onClick={() => setShowOptions(!showOptions)}>
              <MoreHorizontal size={20} color="var(--ink-subtle)" />
            </button>
            <AnimatePresence>
              {showOptions && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', zIndex: 10, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--chili)', width: '100%', textAlign: 'left', padding: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}
                    onClick={() => { setShowOptions(false); setShowReportModal(true); }}
                  >
                    Report Post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Place tag */}
      {post.place && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Link href={`/place/${post.place.slug}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--sky)', textDecoration: 'none', fontWeight: 600 }}>
            📍 {post.place.name}
          </Link>
        </div>
      )}

      {/* Text Content */}
      {post.caption && (
        <p style={{ marginBottom: 'var(--space-3)', color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap' }}>
          {post.caption}
        </p>
      )}

      {/* Media Carousel (simplified) */}
      {post.media?.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
          {post.media.map((m: any) => (
            <img key={m.id} src={m.url} alt="Experience" style={{ height: '240px', minWidth: '240px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
          ))}
        </div>
      )}

      {/* Vibes tagged */}
      {post.vibes?.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          {post.vibes.map((pv: any) => (
            <span key={pv.vibe.id} className="badge" style={{ background: 'var(--bg-surface)', color: 'var(--ink-muted)' }}>
              {pv.vibe.emoji} {pv.vibe.name}
            </span>
          ))}
        </div>
      )}

      {/* Interactions */}
      <div className="divider" style={{ margin: '0 0 var(--space-3) 0' }} />
      <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="btn-icon" 
          onClick={() => likeMutation.mutate()} 
          style={{ display: 'flex', gap: 'var(--space-2)', color: isLiked ? 'var(--chili)' : 'var(--ink-muted)' }}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span style={{ fontSize: 'var(--text-sm)' }}>{likesCount}</span>
        </motion.button>
        <button 
          className="btn-icon" 
          onClick={() => setShowComments(!showComments)}
          style={{ display: 'flex', gap: 'var(--space-2)', color: showComments ? 'var(--sky)' : 'var(--ink-muted)' }}
        >
          <MessageCircle size={20} />
          <span style={{ fontSize: 'var(--text-sm)' }}>{post._count?.comments || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
              {/* Comment list */}
              {commentsLoading ? (
                <div className="skeleton skeleton-text" />
              ) : commentsData?.comments?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  {commentsData.comments.map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <div className="avatar avatar-sm" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                        {c.user.profile?.avatarUrl ? (
                          <img src={c.user.profile.avatarUrl} alt="" />
                        ) : (
                          c.user.profile?.displayName?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'inline-block', background: 'var(--bg-surface)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', marginBottom: '2px' }}>{c.user.profile?.displayName}</div>
                          <div style={{ fontSize: 'var(--text-sm)' }}>{c.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-subtle)', marginBottom: 'var(--space-4)' }}>No comments yet. Be the first!</p>
              )}
              
              {/* Add comment input */}
              <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  style={{ flex: 1, padding: 'var(--space-2) var(--space-3)' }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!newComment.trim() || commentMutation.isPending}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showReportModal && (
        <ReportModal 
          targetType="POST" 
          targetId={post.id} 
          onClose={() => setShowReportModal(false)} 
        />
      )}
    </motion.div>
  );
}
