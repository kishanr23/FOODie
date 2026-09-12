import InteractiveMap from '@/components/map/Map';

export default function MapPage() {
  return (
    <div style={{ height: 'calc(100vh - var(--nav-height) - var(--bottom-nav-height))', width: '100%', position: 'relative' }}>
      <InteractiveMap />
    </div>
  );
}
