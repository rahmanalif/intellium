'use client'

import { useEffect, useState } from 'react'

export default function NavHeader({ onWorkClick, isAbout, onAboutClick, revealed = true }: {
  onWorkClick?: () => void,
  isAbout?: boolean,
  onAboutClick?: () => void,
  revealed?: boolean,
}) {
  const [time, setTime] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      const h = now.getHours().toString().padStart(2, '0')
      const m = now.getMinutes().toString().padStart(2, '0')
      setTime(`${h}:${m}`)
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    .replace('_', ' ')
    .split('/')
    .pop() ?? 'LOCAL'

  return (
    <header id="header" style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      padding: '2.4rem 2.8rem', // Adjusted to match the airy feel
      pointerEvents: 'none',
      // Slides in once the intro hands off
      opacity: revealed ? 1 : 0,
      transform: revealed ? 'translateY(0)' : 'translateY(-2rem)',
      transition: 'opacity 0.8s ease, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Left: Brand */}
      <a id="header-title" href="/" style={{ pointerEvents: 'auto' }}>
        <div style={{
          fontFamily: 'var(--font-satoshi), sans-serif',
          fontSize: isAbout ? '2.4rem' : '11.5rem', // Animate from big to small
          fontWeight: 500,
          letterSpacing: '-0.04em',
          color: '#000',
          lineHeight: 0.65,
          textTransform: '',
          transition: 'font-size 1.6s cubic-bezier(0.2, 1, 0.2, 1)',
        }}>
          Intelium<span style={{ color: '#FF6B00' }}>.</span>
        </div>
      </a>

      {/* Right: Navigation Group */}
      <div id="header-right" style={{
        display: 'flex',
        gap: '8rem',
        alignItems: 'start',
        pointerEvents: 'auto',
        marginTop: '0.6rem',
      }}>
        {/* Nav Links */}
        <div id="header-menu" style={{
          display: 'flex',
          gap: '2.4rem',
          fontSize: '1.3rem',
          fontWeight: 1000,
          color: '#000',
        }}>
          <a 
            href="#work" 
            onClick={(e) => {
              e.preventDefault();
              onWorkClick?.();
            }}
            style={{ 
              borderBottom: !isAbout ? '1.5px solid #FF6B00' : 'none', 
              paddingBottom: '2px',
              color: 'inherit'
            }}
          >
            Work
          </a>
          <a 
            href="#about" 
            onClick={(e) => {
              e.preventDefault();
              onAboutClick?.();
            }}
            style={{ 
              borderBottom: isAbout ? '1.5px solid #FF6B00' : 'none', 
              paddingBottom: '2px',
              color: 'inherit' 
            }}
          >
            About
          </a>
        </div>

        {/* Clock */}
        <div id="header-time" style={{
          fontSize: '1.3rem',
          fontWeight: 1000,
          color: '#000',
          minWidth: '120px',
        }}>
          {time && (
            <span>
              {tz.charAt(0).toUpperCase() + tz.slice(1).toLowerCase()} {time}
            </span>
          )}
        </div>

        {/* Contact */}
        <div id="header-contact_" style={{
          fontSize: '1.3rem',
          fontWeight: 1000,
          color: '#000',
        }}>
          <button id="header-contact" style={{ 
            background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontWeight: 1000
          }}>
            Contact
          </button>
        </div>
      </div>
    </header>
  )
}
