'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Star, MapPin, Camera, Upload, X } from 'lucide-react';

function CreatePostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeIdParam = searchParams.get('placeId');
  const { user } = useAuth();
  
  const [placeId, setPlaceId] = useState(placeIdParam || '');
  const [foodRating, setFoodRating] = useState(0);
  const [vibeRating, setVibeRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [caption, setCaption] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isVerifyingLoc, setIsVerifyingLoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch places for dropdown if no placeId is provided
  const { data: placesData } = useQuery({
    queryKey: ['places-list'],
    queryFn: async () => {
      const res = await fetch('/api/places?limit=50');
      return res.json();
    }
  });

  // Fetch vibes
  const { data: vibesData } = useQuery({
    queryKey: ['vibes'],
    queryFn: async () => {
      const res = await fetch('/api/vibes');
      return res.json();
    }
  });

  useEffect(() => {
    // Get user location for visit verification
    if (navigator.geolocation) {
      setIsVerifyingLoc(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsVerifyingLoc(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setIsVerifyingLoc(false);
          toast.error('Could not get your location for verified visit.');
        }
      );
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      if (files.length + newFiles.length > 5) {
        toast.error('Maximum 5 photos allowed');
        return;
      }
      
      const newPreviews = newFiles.map(f => URL.createObjectURL(f));
      setFiles([...files, ...newFiles]);
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const toggleVibe = (id: string) => {
    if (selectedVibes.includes(id)) {
      setSelectedVibes(selectedVibes.filter(v => v !== id));
    } else {
      if (selectedVibes.length >= 3) {
        toast.error('Select up to 3 vibes');
        return;
      }
      setSelectedVibes([...selectedVibes, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeId) return toast.error('Please select a place');
    if (!foodRating || !vibeRating || !serviceRating) return toast.error('Please rate all categories');
    
    setIsSubmitting(true);
    
    try {
      // 1. Upload images
      const mediaUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'posts');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        const uploadData = await uploadRes.json();
        mediaUrls.push(uploadData.url);
      }
      
      // 2. Create Post & Visit
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          foodRating,
          vibeRating,
          serviceRating,
          caption,
          mediaUrls,
          vibeIds: selectedVibes,
          latitude: location?.lat,
          longitude: location?.lng,
          isVerified: !!location, // Basic check. Real app calculates distance.
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create post');
      }
      
      toast.success('Experience shared successfully!');
      router.push(`/place/${placesData?.places?.find((p: any) => p.id === placeId)?.slug || ''}`);
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (rating: number, setRating: (r: number) => void, label: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={28} 
            fill={star <= rating ? 'var(--gold)' : 'transparent'} 
            color={star <= rating ? 'var(--gold)' : 'var(--ink-muted)'}
            onClick={() => setRating(star)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-content" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + var(--space-8))' }}>
      <h1 style={{ marginBottom: 'var(--space-6)' }}>Log Experience</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        
        {/* Place Selection */}
        <div className="input-group">
          <label className="input-label">Where are you?</label>
          <select 
            className="input-field" 
            value={placeId} 
            onChange={(e) => setPlaceId(e.target.value)}
            required
            disabled={!!placeIdParam}
          >
            <option value="">Select a place...</option>
            {placesData?.places?.map((place: any) => (
              <option key={place.id} value={place.id}>{place.name}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
            <MapPin size={14} color={location ? 'var(--teal)' : 'var(--ink-muted)'} />
            {isVerifyingLoc ? (
              <span style={{ color: 'var(--ink-muted)' }}>Verifying location...</span>
            ) : location ? (
              <span style={{ color: 'var(--teal)' }}>Location verified for GPS check</span>
            ) : (
              <span style={{ color: 'var(--chili)' }}>Location access denied. Cannot verify visit.</span>
            )}
          </div>
        </div>

        <div className="divider" />

        {/* Ratings */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Rate your experience</h3>
          {renderStarRating(foodRating, setFoodRating, 'Food & Drinks')}
          {renderStarRating(vibeRating, setVibeRating, 'Vibe & Atmosphere')}
          {renderStarRating(serviceRating, setServiceRating, 'Service')}
        </div>

        <div className="divider" />

        {/* Vibes */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>What were the vibes? (Max 3)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {vibesData?.vibes?.map((vibe: any) => (
              <button
                key={vibe.id}
                type="button"
                className={`badge ${selectedVibes.includes(vibe.id) ? 'badge-verified' : ''}`}
                style={{ 
                  background: selectedVibes.includes(vibe.id) ? 'var(--gold)' : 'var(--bg-surface)',
                  color: selectedVibes.includes(vibe.id) ? 'var(--bg-deep)' : 'var(--ink)'
                }}
                onClick={() => toggleVibe(vibe.id)}
              >
                {vibe.emoji} {vibe.name}
              </button>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* Photos */}
        <div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Add Photos</h3>
          
          <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            {previews.map((preview, idx) => (
              <div key={idx} style={{ position: 'relative', minWidth: '100px', height: '100px' }}>
                <img src={preview} alt="Upload preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                <button 
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="btn-icon" 
                  style={{ position: 'absolute', top: -5, right: -5, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {files.length < 5 && (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  minWidth: '100px', height: '100px', 
                  border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--ink-muted)'
                }}
              >
                <Camera size={24} style={{ marginBottom: 'var(--space-1)' }} />
                <span style={{ fontSize: 'var(--text-xs)' }}>Add Photo</span>
              </button>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
          />
        </div>

        {/* Caption */}
        <div className="input-group">
          <label className="input-label">Share your thoughts</label>
          <textarea
            className="input-field"
            rows={4}
            placeholder="What did you love about this place?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
          {isSubmitting ? 'Publishing...' : 'Share Experience'}
        </button>

      </form>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="page-content">Loading...</div>}>
      <CreatePostForm />
    </Suspense>
  );
}
