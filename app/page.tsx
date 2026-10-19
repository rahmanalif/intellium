'use client'

import { useState, useEffect, useRef } from 'react'
import NavHeader from '@/components/NavHeader'
import ProjectGallery, { PROJECTS } from '@/components/ProjectGallery'
import AboutSection from '@/components/AboutSection'
import LoadingScreen from '@/components/LoadingScreen'

const SB_ITEM_H = 34     // Increased to match text-xl/2xl height + spacing
const SB_SLOTS = 11      
const SB_HALF = Math.floor(SB_SLOTS / 2)

function pmod(n: number, m: number) { return ((n % m) + m) % m }

function SidebarDrum({ activeIndex }: { activeIndex: number }) {
  // Continuous position that lerps toward activeIndex
  const posRef = useRef(activeIndex)
  const targetRef = useRef(activeIndex)
  const rafRef = useRef<number | null>(null)
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([])

  const paint = () => {
    const pos = posRef.current
    const centre = Math.round(pos)
    for (let s = 0; s < SB_SLOTS; s++) {
      const el = slotRefs.current[s]
      if (!el) continue
      const offset = s - SB_HALF
      const projIdx = pmod(centre + offset, PROJECTS.length)
      const dist = Math.abs(pos - centre + offset)
      // Translate slot to its position relative to centre
      const y = (offset - (pos - centre)) * SB_ITEM_H
      el.style.transform = `translateY(${y}px)`
      el.style.color = dist < 0.3 ? '#FF6B00' : '#999'
      el.style.fontWeight = dist < 0.3 ? '700' : '600'
      el.style.opacity = dist > SB_HALF - 0.5 ? '0' : '1'
      el.textContent = PROJECTS[projIdx].name
      
      // Matched with text-xl md:text-2xl from categories/services
      el.className = `text-xl md:text-2xl transition-colors duration-300 whitespace-nowrap absolute left-0 right-0 text-left`
    }
  }

  const tick = () => {
    const diff = targetRef.current - posRef.current
    if (Math.abs(diff) < 0.005) {
      posRef.current = targetRef.current
      paint()
      rafRef.current = null
      return
    }
    posRef.current += diff * 0.12
    paint()
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    // Always take the shortest circular path
    const cur = posRef.current
    const n = PROJECTS.length
    let delta = ((activeIndex - cur) % n + n) % n
    if (delta > n / 2) delta -= n
    targetRef.current = cur + delta
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex])

  useEffect(() => { paint() }, [])

  return (
    <div style={{
      position: 'relative',
      height: SB_ITEM_H,
      overflow: 'visible',
      pointerEvents: 'none',
    }}>
      {Array.from({ length: SB_SLOTS }, (_, s) => (
        <span
          key={s}
          ref={el => { slotRefs.current[s] = el }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            lineHeight: `${SB_ITEM_H}px`,
            whiteSpace: 'nowrap',
            cursor: 'default',
            transition: 'color 0.2s ease',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [showWorkText, setShowWorkText] = useState(true)
  const [isAbout, setIsAbout] = useState(false)
  const [introDone, setIntroDone] = useState(false)

  const activeProject = PROJECTS[activeIndex]
  const chromeOn = introDone && !isAbout

  return (
    <>
      {/* Intro; its mark stays on as the bracket frame around the centred card */}
      <LoadingScreen onComplete={() => setIntroDone(true)} frameHidden={isAbout} />

      <div>
        <NavHeader
          revealed={introDone}
          onWorkClick={() => {
            setShowWorkText(!showWorkText)
            if (isAbout) setIsAbout(false)
          }} 
          isAbout={isAbout}
          onAboutClick={() => {
            setIsAbout(!isAbout)
            if (showWorkText) setShowWorkText(false)
          }}
        />

        {/* Main canvas */}
        <main style={{ position: 'relative', width: '100vw' }}>

          {/* ── Left sidebar: project name drum ── */}
          <aside style={{
            position: 'fixed',
            left: 28,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 50,
            opacity: chromeOn ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}>
            <SidebarDrum activeIndex={activeIndex} />
          </aside>

          {/* ── Center: scroll gallery ── */}
          <div style={{ marginLeft: 0 }}>
            <ProjectGallery
              setActiveIndex={setActiveIndex}
              isAbout={isAbout}
              hidden={!introDone}
              locked={!introDone}
            />
          </div>

          {/* ── Center-left label (categories) ── */}
          <div style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(calc(-50% - 450px), -50%)',
            zIndex: 50,
            textAlign: 'left',
            opacity: chromeOn ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}>
            <span className="text-xl md:text-2xl font-medium tracking-tight text-[#FF6B00]">
              {activeProject.categories.join(', ')}
            </span>
          </div>

          {/* ── Center-right label (services) + project number ── */}
          <div style={{
            position: 'fixed',
            right: 28,
            top: '50%',
            transform: 'translateY(-50%)', // Aligned with center axis
            zIndex: 50,
            display: 'flex',
            alignItems: 'baseline',
            gap: 40,
            opacity: chromeOn ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}>
            <span className="text-xl md:text-2xl font-medium tracking-tight text-[#FF6B00]">
              {activeProject.services.join(', ')}
            </span>
            <span className="text-xl md:text-2xl font-medium text-[#FF6B00] min-w-[24px] text-right">
              {activeProject.id}
            </span>
          </div>

          {/* ── Bottom bar ── */}
          <footer style={{
            position: 'fixed',
            bottom: 18,
            left: 28,
            right: 28,
            zIndex: 50,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: chromeOn ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}>
            <span style={{ fontSize: 11, color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Vertical, Horizontal, Grid
            </span>
            <span style={{ fontSize: 11, color: '#bbb' }}>
              All rights reserved. ©2026 Intelium
            </span>
          </footer>
        </main>

        <AboutSection isVisible={isAbout} showStudioInfo={introDone && (showWorkText || isAbout)} />
      </div>
    </>
  )
}
