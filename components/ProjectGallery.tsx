'use client'

import { useEffect, useRef, useCallback } from 'react'
import Lenis from 'lenis'

export interface Project {
  id: number
  name: string
  categories: string[]
  services: string[]
  year: number
  image?: string
  color: string
  size: 'portrait' | 'landscape' | 'small' | 'large'
}

const SIZES = {
  portrait:  { w: 160, h: 240 },
  landscape: { w: 260, h: 160 },
  small:     { w: 260, h: 260 },
  large:     { w: 220, h: 290 },
}

export const PROJECTS: Project[] = [
  { id: 1,  name: "Obys' Design Books",       categories: ['Education', 'Books'],          services: ['Art Direction', 'Web Design/Dev'],      year: 1,  color: '#1a1a1a', size: 'portrait'  },
  { id: 2,  name: 'Eminente',                 categories: ['Luxury', 'Spirits'],           services: ['Creative Direction', 'Web Design/Dev'],  year: 2,  color: '#1e1e1e', size: 'large'     },
  { id: 3,  name: 'Abetka',                   categories: ['Education'],                   services: ['Concept', 'Web Design/Dev', 'Identity'], year: 3,  color: '#222',    size: 'small'     },
  { id: 4,  name: 'BlackSheep',               categories: ['Fashion', 'Photography'],      services: ['Creative Direction', 'Web Design/Dev'],  year: 4,  color: '#262626', size: 'landscape' },
  { id: 5,  name: 'Salience Labs',            categories: ['Technology'],                  services: ['Web Design/Dev'],                        year: 5,  color: '#2a2a2a', size: 'portrait'  },
  { id: 6,  name: 'AI Modernism of Kharkiv',  categories: ['Culture', 'Architecture'],     services: ['Concept', 'Web Design/Dev'],             year: 6,  color: '#2e2e2e', size: 'large'     },
  { id: 7,  name: 'Glyphic Biotechnologies',  categories: ['Technology', 'Science'],       services: ['Web Design/Dev', 'Identity'],            year: 7,  color: '#323232', size: 'small'     },
  { id: 8,  name: 'Porsche Taycan',           categories: ['Automotive'],                  services: ['Creative Direction', 'Web Design/Dev'],  year: 8,  color: '#363636', size: 'landscape' },
  { id: 9,  name: 'Ayocin (Atmos Lamp)',      categories: ['Technology', 'Furniture'],     services: ['Creative Direction', 'Web Design/Dev'],  year: 9,  color: '#3a3a3a', size: 'portrait'  },
  { id: 10, name: 'Grids',                    categories: ['Education', 'Side Project'],   services: ['Concept', 'Web Design/Dev', 'Identity'], year: 10, color: '#3e3e3e', size: 'small'     },
  { id: 11, name: 'Peter Lindbergh',          categories: ['Fashion', 'Photography'],      services: ['Creative Direction', 'Web Design/Dev'],  year: 11, color: '#424242', size: 'large'     },
  { id: 12, name: 'Makhno',                   categories: ['Architecture', 'Design'],      services: ['Web Design/Dev'],                        year: 12, color: '#464646', size: 'landscape' },
  { id: 13, name: 'Source Unknown',           categories: ['Fashion'],                     services: ['Creative Direction', 'Web Design/Dev'],  year: 13, color: '#4a4a4a', size: 'portrait'  },
  { id: 14, name: 'Autex',                    categories: ['Architecture', 'Materials'],   services: ['Web Design/Dev', 'Identity'],            year: 14, color: '#4e4e4e', size: 'small'     },
  { id: 15, name: "Odin's Crow",              categories: ['Music', 'Culture'],            services: ['Creative Direction', 'Web Design/Dev'],  year: 15, color: '#525252', size: 'large'     },
  { id: 16, name: 'Olga Prudka',              categories: ['Art', 'Photography'],          services: ['Creative Direction', 'Web Design/Dev'],  year: 16, color: '#565656', size: 'landscape' },
  { id: 17, name: 'Yulia',                    categories: ['Fashion', 'Photography'],      services: ['Creative Direction', 'Web Design/Dev'],  year: 17, color: '#5a5a5a', size: 'portrait'  },
  { id: 18, name: 'The Ways We Work (Miro)',  categories: ['Technology', 'Culture'],       services: ['Creative Direction', 'Web Design/Dev'],  year: 18, color: '#5e5e5e', size: 'small'     },
]

const N = PROJECTS.length
const GAP = 8

// Precompute center-to-center positions so each pair of adjacent cards has exactly GAP px between edges.
// POSITIONS[i] = distance from project-0 center to project-i center along the scroll axis.
const POSITIONS: number[] = new Array(N)
POSITIONS[0] = 0
for (let i = 1; i < N; i++) {
  const prev = PROJECTS[i - 1]
  const curr = PROJECTS[i]
  POSITIONS[i] = POSITIONS[i - 1] + (SIZES[prev.size].h + SIZES[curr.size].h) / 2 + GAP
}
// Total scroll distance for one full loop (wraps back to project 0)
const PERIOD = POSITIONS[N - 1] + (SIZES[PROJECTS[N - 1].size].h + SIZES[PROJECTS[0].size].h) / 2 + GAP
// Average step — used only for normalising dist into scale/opacity
const AVG_STEP = PERIOD / N

const SLOTS = 7
const HALF = Math.floor(SLOTS / 2)

function pmod(n: number, m: number) {
  return ((n % m) + m) % m
}

// Nearest project index to a normalised scroll position
function nearestIdx(normPos: number): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < N; i++) {
    const d = Math.abs(POSITIONS[i] - normPos)
    const dw = Math.min(d, PERIOD - d)
    if (dw < bestDist) { bestDist = dw; best = i }
  }
  return best
}

interface ProjectGalleryProps {
  setActiveIndex: (i: number) => void
  isAbout?: boolean
}

export default function ProjectGallery({ setActiveIndex, isAbout }: ProjectGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const posRef = useRef(0)
  const targetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const paint = useCallback(() => {
    const pos = posRef.current
    const normPos = ((pos % PERIOD) + PERIOD) % PERIOD
    const centreIdx = nearestIdx(normPos)

    setActiveIndex(centreIdx)

    // Absolute position of the centred project in scroll space
    const centreAbsPos = POSITIONS[centreIdx] + Math.round((pos - POSITIONS[centreIdx]) / PERIOD) * PERIOD

    for (let s = 0; s < SLOTS; s++) {
      const el = slotRefs.current[s]
      if (!el) continue

      const projIdx = pmod(centreIdx + (s - HALF), N)
      const project = PROJECTS[projIdx]
      const { w, h } = SIZES[project.size]

      // Pick the loop repetition of this project that is closest to centreAbsPos
      const projAbsPos = POSITIONS[projIdx] + Math.round((centreAbsPos - POSITIONS[projIdx]) / PERIOD) * PERIOD
      const dy = projAbsPos - pos

      // dist in "average slot" units for scale/opacity
      const dist = Math.abs(dy) / AVG_STEP

      const scale = Math.max(0.91, 1 - Math.min(dist, 2) * 0.045)
      const opacity = dist < 0.6 ? 1 : dist < 1.6 ? 1 - (dist - 0.6) * 0.65 : Math.max(0.22, 1 - dist * 0.4)

      el.style.width = `${w}px`
      el.style.height = `${h}px`
      el.style.transform = `translate(${-(w / 2)}px, calc(${-(h / 2)}px + ${dy}px)) scale(${scale})`
      el.style.opacity = String(Math.max(0.22, opacity))
      el.style.backgroundColor = project.color

      const label = el.querySelector<HTMLSpanElement>('.card-label')
      if (label) {
        label.textContent = String(project.id).padStart(2, '0')
        label.style.color = dist < 0.5 ? '#FF6B00' : 'rgba(255,255,255,0.2)'
        label.style.fontWeight = dist < 0.5 ? '700' : '400'
      }

      const img = el.querySelector<HTMLImageElement>('img')
      if (img) {
        if (project.image) {
          img.src = project.image
          img.style.display = 'block'
          if (label) label.style.display = 'none'
        } else {
          img.style.display = 'none'
          if (label) label.style.display = ''
        }
      }
    }
  }, [setActiveIndex])

  const tick = useCallback(() => {
    const diff = targetRef.current - posRef.current
    if (Math.abs(diff) < 0.05) {
      posRef.current = targetRef.current
      paint()
      rafRef.current = null
      return
    }
    posRef.current += diff * 0.065
    paint()
    rafRef.current = requestAnimationFrame(tick)
  }, [paint])

  const kickRaf = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const scroll = useCallback((delta: number) => {
    targetRef.current += delta

    if (Math.abs(targetRef.current) > PERIOD * 200) {
      const shift = Math.round(targetRef.current / PERIOD) * PERIOD
      targetRef.current -= shift
      posRef.current -= shift
    }

    if (snapTimer.current) clearTimeout(snapTimer.current)
    snapTimer.current = setTimeout(() => {
      const normTarget = ((targetRef.current % PERIOD) + PERIOD) % PERIOD
      const snapIdx = nearestIdx(normTarget)
      targetRef.current = POSITIONS[snapIdx] + Math.round((targetRef.current - POSITIONS[snapIdx]) / PERIOD) * PERIOD
      kickRaf()
    }, 120)

    kickRaf()
  }, [kickRaf])

  // Wheel — driven by Lenis for inertia/smoothness
  useEffect(() => {
    const lenis = new Lenis({
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.6,
      touchMultiplier: 1.2,
      lerp: 0.08,
    })

    lenis.on('virtual-scroll', ({ deltaY }: { deltaY: number }) => {
      if (deltaY !== 0) scroll(deltaY)
    })

    let raf: number
    const loop = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)

    const el = containerRef.current
    if (el) {
      const block = (e: WheelEvent) => e.preventDefault()
      el.addEventListener('wheel', block, { passive: false })
      return () => {
        lenis.destroy()
        cancelAnimationFrame(raf)
        el.removeEventListener('wheel', block)
      }
    }
    return () => { lenis.destroy(); cancelAnimationFrame(raf) }
  }, [scroll])

  // Touch
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let lastY = 0
    const onStart = (e: TouchEvent) => { lastY = e.touches[0].clientY }
    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      const dy = lastY - e.touches[0].clientY
      lastY = e.touches[0].clientY
      scroll(dy * 1.5)
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
    }
  }, [scroll])

  useEffect(() => { paint() }, [paint])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center overflow-hidden cursor-ns-resize transition-all duration-1000 ease-in-out"
      style={{
        opacity: isAbout ? 0 : 1,
        transform: isAbout ? 'translateY(-100px)' : 'translateY(0)',
        pointerEvents: isAbout ? 'none' : 'auto',
      }}
    >
      <div className="relative w-0 h-0">
        {Array.from({ length: SLOTS }, (_, s) => (
          <div
            key={s}
            ref={el => { slotRefs.current[s] = el }}
            className="absolute top-0 left-0 overflow-hidden origin-center will-change-transform opacity"
          >
            <img
              src=""
              alt=""
              className="w-full h-full object-cover hidden"
            />
            <div className="absolute inset-0 flex items-end p-4">
              <span
                className="card-label font-mono text-[11px] text-white/20 tracking-[0.12em]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
