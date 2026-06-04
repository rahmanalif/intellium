'use client'

import { useState, useEffect } from 'react'

interface Founder {
  id: string
  name: string
  role: string
  color: string
}

const FOUNDERS: Founder[] = [
  { 
    id: 'F1',
    name: 'Ahmed Raiyan', 
    role: 'Creative Director', 
    color: '#1a1a1a'
  },
  { 
    id: 'F2',
    name: 'Ahmed Raiyan', 
    role: 'Managing Director', 
    color: '#333'
  }
]

export default function AboutSection({ isVisible, showStudioInfo }: { isVisible: boolean, showStudioInfo: boolean }) {
  const [hoveredFounder, setHoveredFounder] = useState<Founder | null>(null)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 400)
      return () => clearTimeout(timer)
    } else {
      setShowContent(false)
    }
  }, [isVisible])

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none px-[2.8rem]">
      {/* Work/About Detail Block (Right-aligned under Nav) */}
      <div 
        className="transition-opacity duration-300"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: '2.8rem',
          paddingTop: '2.4rem',
          display: 'flex',
          justifyContent: 'space-between',
          opacity: showStudioInfo ? 1 : 0,
        }}
      >
        {/* Brand Spacer (Mirrors NavHeader left side for perfect alignment) */}
        <div style={{
          fontFamily: 'var(--font-satoshi), sans-serif',
          fontSize: isVisible ? '2.4rem' : '11.5rem',
          lineHeight: 0.65,
          letterSpacing: '-0.04em',
          fontWeight: 500,
          visibility: 'hidden',
          transition: 'font-size 1.6s cubic-bezier(0.2, 1, 0.2, 1)',
        }}>
          Intelium.
        </div>

        <div style={{
          display: 'flex',
          gap: '8rem',
          marginTop: '0.6rem',
        }}>
          <div style={{
            display: 'flex',
            gap: '2.4rem',
          }}>
            {/* Alignment anchor relative to "Work" tab */}
            <div style={{ position: 'relative' }}>
              <span style={{ visibility: 'hidden', fontSize: '1.3rem', fontWeight: 600 }}>Work</span>
              <div style={{
                position: 'absolute',
                left: 0,
                top: '8.5rem',
                width: '32rem',
                textAlign: 'left',
                pointerEvents: showStudioInfo ? 'auto' : 'none',
              }}>
                <p style={{
                  fontSize: '1.4rem',
                  lineHeight: '1.5',
                  fontWeight: 500,
                  color: '#000',
                  marginBottom: '4rem',
                  letterSpacing: '0.01em',
                }}>
                  The studio is shaped by people who care deeply about design and the process behind. Each project becomes a case study and a meaningful part of our portfolio, developed with care and attention.
                </p>
                
                <div style={{ fontSize: '1.4rem', fontWeight: 600 }}>
                  <span style={{ display: 'block', marginBottom: '4px' }}>Contact:</span>
                  <a 
                    href="mailto:omorraiyan369999@gmail.com" 
                    style={{ 
                      color: '#000', 
                      textDecoration: 'none',
                      display: 'inline-block',
                      position: 'relative',
                    }}
                  >
                    <span style={{ display: 'block' }}>omorraiyan369999@gmail.com</span>
                    <div style={{ borderBottom: '1.5px solid #000', width: '100%', marginTop: '4px' }}></div>
                  </a>
                </div>
              </div>
            </div>
            {/* Spacers to match NavHeader right side structure */}
            <div style={{ visibility: 'hidden', fontSize: '1.3rem', fontWeight: 1000 }}>About</div>
          </div>
          <div style={{ visibility: 'hidden', fontSize: '1.3rem', fontWeight: 1000, minWidth: '120px' }}>DHAKA 00:00</div>
          <div style={{ visibility: 'hidden', fontSize: '1.3rem', fontWeight: 1000 }}>Contact</div>
        </div>
      </div>

      {/* Left side: Large Manifesto Text */}
      {isVisible && (
        <div 
          className={`max-w-[65%] mt-[10rem] transition-all duration-1000 ease-out transform ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ pointerEvents: 'auto' }}
        >
          <h2 className="text-[4.2rem] md:text-[5.2rem] leading-[1.1] font-medium tracking-tight text-black text-pretty">
            Intelium is a concept-driven design studio founded by{' '}
            <span 
              className="inline-block relative cursor-pointer border-b-2 border-black hover:text-[#FF6B00] hover:border-[#FF6B00] transition-colors"
              onMouseEnter={() => setHoveredFounder(FOUNDERS[0])}
              onMouseLeave={() => setHoveredFounder(null)}
            >
              Ahmed Raiyan
            </span>
            {' '}and{' '}
            <span 
              className="inline-block relative cursor-pointer border-b-2 border-black hover:text-[#FF6B00] hover:border-[#FF6B00] transition-colors"
              onMouseEnter={() => setHoveredFounder(FOUNDERS[1])}
              onMouseLeave={() => setHoveredFounder(null)}
            >
              Ahmed Raiyan
            </span>
            {' '}in 2026 and based in Dhaka. Rooted in modernist design principles and graphic design tradition, our work combines typography, grid systems and motion to create digital experiences that balance clarity, usability and bold visual expression. Our team remains intentionally small, which allows creative direction to stay personal and decisions to stay sharp. Every project is led closely by the founders. No layers. No dilution.
          </h2>
        </div>
      )}

      {/* Right side: Placeholder Hover Image - Aligned with manifesto text */}
      {isVisible && (
        <div className="absolute right-[8rem] top-[10.5rem] w-[38rem] pointer-events-none">
          <div className={`transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] transform ${
            hoveredFounder ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
          }`}>
            {hoveredFounder && (
              <div className="flex flex-col gap-4">
                <div 
                  className="aspect-[3/4] overflow-hidden relative flex items-end p-6"
                  style={{ backgroundColor: hoveredFounder.color }}
                >
                  <span className="font-mono text-[14px] text-white/20 tracking-[0.15em] font-bold">
                    {hoveredFounder.id}
                  </span>
                </div>
                <div className="text-[1.3rem] font-medium text-black">
                  {hoveredFounder.name} ({hoveredFounder.role})
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
