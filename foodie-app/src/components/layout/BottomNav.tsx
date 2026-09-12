'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, PlusSquare, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Feed', href: '/', icon: Home },
    { name: 'Explore', href: '/explore', icon: Search },
    { name: 'Log', href: '/create', icon: PlusSquare },
    { name: 'Map', href: '/map', icon: Map },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // Hide on auth pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/signup')) {
    return null;
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--bottom-nav-height)',
      backgroundColor: 'var(--bg-elevated)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50,
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name} 
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: isActive ? 'var(--sky)' : 'var(--ink-muted)',
              textDecoration: 'none',
              position: 'relative'
            }}
          >
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                style={{
                  position: 'absolute',
                  top: '-1px',
                  width: '40px',
                  height: '3px',
                  backgroundColor: 'var(--sky)',
                  borderBottomLeftRadius: '4px',
                  borderBottomRightRadius: '4px'
                }}
              />
            )}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </motion.div>
            <span style={{ 
              fontSize: '10px', 
              marginTop: '4px',
              fontWeight: isActive ? 600 : 400 
            }}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
