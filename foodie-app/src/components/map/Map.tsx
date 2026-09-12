'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_STYLE_URL } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function InteractiveMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const router = useRouter();
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  // Fetch places
  const { data } = useQuery({
    queryKey: ['places-map'],
    queryFn: async () => {
      const res = await fetch('/api/places?limit=100');
      if (!res.ok) throw new Error('Failed to fetch places');
      return res.json();
    }
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: MAP_STYLE_URL,
        center: [MAP_DEFAULT_CENTER.lng, MAP_DEFAULT_CENTER.lat],
        zoom: MAP_DEFAULT_ZOOM,
        pitch: 45, // slight 3D perspective
        attributionControl: false,
      });

      map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      
      // Geolocate control
      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
      });
      map.current.addControl(geolocate, 'bottom-right');
    }

    return () => {
      // Don't completely destroy on unmount to keep it snappy if user navigates back quickly
      // but usually we destroy. For Next.js strict mode, we'll keep it simple:
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers when data loads
  useEffect(() => {
    if (!map.current || !data?.places) return;

    // Clean up existing markers (simplified for MVP)
    const markers = document.querySelectorAll('.custom-marker');
    markers.forEach(m => m.remove());

    data.places.forEach((place: any) => {
      // Create custom HTML marker
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.backgroundColor = 'var(--gold)';
      el.style.borderRadius = '50% 50% 50% 0';
      el.style.transform = 'rotate(-45deg)';
      el.style.border = '2px solid var(--bg-deep)';
      el.style.boxShadow = 'var(--shadow-sm)';
      el.style.cursor = 'pointer';

      const inner = document.createElement('div');
      inner.style.width = '26px';
      inner.style.height = '26px';
      inner.style.borderRadius = '50%';
      inner.style.backgroundColor = 'var(--bg-deep)';
      inner.style.transform = 'rotate(45deg)';
      inner.style.display = 'flex';
      inner.style.alignItems = 'center';
      inner.style.justifyContent = 'center';
      inner.style.position = 'absolute';
      inner.style.top = '0';
      inner.style.left = '0';
      
      // Simplified icon or first letter
      inner.innerHTML = `<span style="font-size: 12px; color: var(--gold); font-weight: bold;">${place.name.charAt(0)}</span>`;
      el.appendChild(inner);

      el.addEventListener('click', () => {
        setSelectedPlace(place);
        if (map.current) {
          map.current.flyTo({
            center: [place.longitude, place.latitude],
            zoom: 15,
            duration: 1000
          });
        }
      });

      new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map.current!);
    });

  }, [data]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map Container */}
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, bottom: 0, width: '100%' }} />

      {/* Place Preview Bottom Sheet */}
      {selectedPlace && (
        <div style={{
          position: 'absolute',
          bottom: 'var(--space-20)',
          left: 'var(--space-4)',
          right: 'var(--space-4)',
          zIndex: 10,
        }}>
          <div className="card card-interactive" onClick={() => router.push(`/place/${selectedPlace.slug}`)}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3)' }}>
              {selectedPlace.coverImageUrl ? (
                <img 
                  src={selectedPlace.coverImageUrl} 
                  alt={selectedPlace.name} 
                  style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--ink-muted)' }}>No image</span>
                </div>
              )}
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
                  {selectedPlace.name}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', marginBottom: 'var(--space-2)' }}>
                  {selectedPlace.category?.name} • {'$'.repeat(selectedPlace.priceLevel || 1)}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {selectedPlace.vibes?.slice(0, 2).map((pv: any) => (
                    <span key={pv.vibe.id} className="badge badge-verified" style={{ background: 'var(--bg-surface)', color: 'var(--ink-muted)' }}>
                      {pv.vibe.emoji} {pv.vibe.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setSelectedPlace(null)} 
            className="btn-icon"
            style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
