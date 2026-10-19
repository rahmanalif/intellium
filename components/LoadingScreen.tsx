'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PROJECTS, SIZES, GAP, cardLayout, galleryLayout } from '@/components/ProjectGallery'

gsap.registerPlugin(useGSAP)

// Intro sequence (modelled on obys.agency's preloader):
//   1. a thin globe — two crescents — draws itself on black
//   2. the crescents morph into the solid [ ] mark
//   3. the first project cards grow out of the centre beneath the mark (mix-blend: difference)
//   4. the cards drop into a column under the mark, the background flips to white
//   5. the cards fly to their gallery slots while the mark spreads and thins into the ( ) frame
// The mark stays mounted afterwards as the gallery's bracket frame.

// ── Mark geometry ────────────────────────────────────────────────────────────
// Drawn in a 400×400 viewBox shown at LOGO_PX. Each half is an outer edge (top → bottom)
// plus an inner edge (bottom → top), both resampled to EDGE_PTS points, so any two
// states can be morphed point by point.

type Pt = [number, number]
interface Half { outer: Pt[]; inner: Pt[] }

const VB = 400
const C = VB / 2
const LOGO_PX = 130
const K = LOGO_PX / VB            // px per viewBox unit
const EDGE_PTS = 160

function resample(pts: Pt[], n: number): Pt[] {
  const lens = [0]
  for (let i = 1; i < pts.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  }
  const total = lens[lens.length - 1]
  const out: Pt[] = []
  let j = 1
  for (let i = 0; i < n; i++) {
    const d = (i / (n - 1)) * total
    while (j < lens.length - 1 && lens[j] < d) j++
    const t = (d - lens[j - 1]) / (lens[j] - lens[j - 1] || 1)
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t])
  }
  return out
}

const curve = (f: (t: number) => Pt, n = 240): Pt[] => Array.from({ length: n + 1 }, (_, i) => f(i / n))
const half = (outer: Pt[], inner: Pt[]): Half => ({ outer: resample(outer, EDGE_PTS), inner: resample(inner, EDGE_PTS) })
const mirror = ({ outer, inner }: Half): Half => ({
  outer: outer.map(([x, y]): Pt => [VB - x, y]),
  inner: inner.map(([x, y]): Pt => [VB - x, y]),
})

// 1. Globe: circle + meridian per side, split at the poles with a small gap
const R = 196
const TIP = (8 * Math.PI) / 180
const TIP_X = C - R * Math.sin(TIP)
const TIP_Y = R * Math.cos(TIP)
const MERIDIAN_RX = TIP_X - C / 2
const GLOBE_L = half(
  curve(t => {
    const a = -Math.PI / 2 - TIP - t * (Math.PI - 2 * TIP)
    return [C + R * Math.cos(a), C + R * Math.sin(a)]
  }),
  curve(t => {
    const a = Math.PI / 2 + t * Math.PI
    return [TIP_X + MERIDIAN_RX * Math.cos(a), C + TIP_Y * Math.sin(a)]
  }),
)

// 2. Solid [ ] mark
const ARM = 150
const BAR = 48
const BRACKET_L = half(
  [[ARM, 0], [0, 0], [0, VB], [ARM, VB]],
  [[ARM, VB], [ARM, VB - BAR], [BAR, VB - BAR], [BAR, BAR], [ARM, BAR], [ARM, 0]],
)

// 3. The page's thin ( ) frame — a 1.5px line along a quadratic curve.
//    Points are in px relative to the viewport centre; side -1 = left half, +1 = right half.
function frameHalf(p0: Pt, p1: Pt, p2: Pt, side: 1 | -1, width = 1.5): Half {
  const w = width / 2
  const at = (t: number) => {
    const u = 1 - t
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]
    const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
    const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
    const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
    const len = Math.hypot(dx, dy) || 1
    return { x, y, nx: (side * dy) / len, ny: (side * -dx) / len }
  }
  const toUnits = (x: number, y: number): Pt => [C + x / K, C + y / K]
  return half(
    curve(t => { const p = at(t); return toUnits(p.x + p.nx * w, p.y + p.ny * w) }),
    curve(t => { const p = at(1 - t); return toUnits(p.x - p.nx * w, p.y - p.ny * w) }),
  )
}

const outline = ({ outer, inner }: Half) => [...outer, ...inner]
const GLOBE = [GLOBE_L, mirror(GLOBE_L)].map(outline)
const BRACKET = [BRACKET_L, mirror(BRACKET_L)].map(outline)
const FRAME = [
  frameHalf([-186, -160], [-226, 0], [-186, 160], -1),
  frameHalf([196, -160], [236, 0], [196, 160], 1),
].map(outline)
const GLOBE_STROKES = [GLOBE_L, mirror(GLOBE_L)].flatMap(h => [h.outer, h.inner])

const fmt = (n: number) => n.toFixed(1)
const toPath = (pts: Pt[], close = true) =>
  'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L') + (close ? 'Z' : '')
const lerpPath = (a: Pt[], b: Pt[], p: number) =>
  toPath(a.map(([x, y], i): Pt => [x + (b[i][0] - x) * p, y + (b[i][1] - y) * p]))

const GLOBE_D = GLOBE.map(pts => toPath(pts))
const FRAME_D = FRAME.map(pts => toPath(pts))
const STROKE_D = GLOBE_STROKES.map(pts => toPath(pts, false))

// ── Cards ────────────────────────────────────────────────────────────────────
// The first INTRO_COUNT projects take part in the intro; the other cards visible at
// scroll position 0 fade in at their final spots during the spread.

const INTRO_COUNT = 6
const INTRO = PROJECTS.slice(0, INTRO_COUNT).map((_, i) => i)
const FINAL = galleryLayout(0)
const GHOSTS = FINAL.filter(c => c.projIdx >= INTRO_COUNT)
const INTRO_FINAL = INTRO.map(i => FINAL.find(c => c.projIdx === i) ?? cardLayout(i, 0))

// Centre-y of each card when stacked in a column just under the mark
const COLUMN_Y: number[] = []
{
  let top = LOGO_PX / 2 + GAP
  for (const i of INTRO) {
    const { h } = SIZES[PROJECTS[i].size]
    COLUMN_Y.push(top + h / 2)
    top += h + GAP
  }
}

// ── Timing (seconds) ─────────────────────────────────────────────────────────

const DRAW = 1.3
const MORPH = 1.4
const GROW = 1.6
const STAGGER = 0.18
const HOLD = GROW + (INTRO_COUNT - 1) * STAGGER
const COLUMN = 1.2
const FLIP = 0.3
const SPREAD = 1.6

const T_MORPH = DRAW
const T_CARDS = T_MORPH + MORPH
const T_COLUMN = T_CARDS + HOLD
const T_FLIP = T_COLUMN + COLUMN
const T_SPREAD = T_FLIP + FLIP

interface LoadingScreenProps {
  onComplete?: () => void
  frameHidden?: boolean
}

export default function LoadingScreen({ onComplete, frameHidden }: LoadingScreenProps) {
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  const bgRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLDivElement>(null)
  const fillRefs = useRef<(SVGPathElement | null)[]>([])
  const strokeRefs = useRef<(SVGPathElement | null)[]>([])
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const ghostRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useGSAP(() => {
    const fills = fillRefs.current as SVGPathElement[]
    const strokes = strokeRefs.current as SVGPathElement[]
    const cards = cardRefs.current as HTMLDivElement[]
    const ghosts = ghostRefs.current as HTMLDivElement[]
    const counter = counterRef.current!
    const setShape = (from: Pt[][], to: Pt[][], p: number) =>
      fills.forEach((el, i) => el.setAttribute('d', lerpPath(from[i], to[i], p)))

    const finish = () => {
      setDone(true)
      onCompleteRef.current?.()
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }

    // Initial state (set explicitly so a StrictMode re-run starts clean)
    fills.forEach((el, i) => {
      el.setAttribute('d', GLOBE_D[i])
      el.setAttribute('fill-opacity', '0')
      el.setAttribute('stroke', 'none')
    })
    gsap.set(strokes, { attr: { 'stroke-dashoffset': 1 }, opacity: 1 })
    gsap.set(bgRef.current, { opacity: 1 })
    gsap.set(counter, { yPercent: 0 })
    INTRO.forEach((p, i) => {
      const { w, h } = SIZES[PROJECTS[p].size]
      gsap.set(cards[i], { x: -w / 2, y: -h / 2, scale: 0, opacity: 1, transformOrigin: '50% 50%' })
    })
    GHOSTS.forEach((c, i) => {
      gsap.set(ghosts[i], { x: -c.w / 2, y: -c.h / 2 + c.dy, scale: c.scale, opacity: 0, transformOrigin: '50% 50%' })
    })

    const count = { v: 0 }
    const writeCount = () => {
      const v = Math.min(100, Math.round(count.v))
      counter.textContent = v < 10 ? `0${v}` : String(v)
    }
    const morph = { p: 0 }
    const spread = { p: 0 }

    const tl = gsap.timeline({ onComplete: finish })

    // 1. Globe draws in: outer edges top → bottom, meridians bottom → top
    tl.to(strokes, { attr: { 'stroke-dashoffset': 0 }, duration: DRAW, ease: 'power4.inOut' }, 0)
    tl.to(count, { v: 30, duration: DRAW, ease: 'none', onUpdate: writeCount }, 0)

    // 2. Crescents morph into the solid mark; stroke fades out as the fill fades in
    tl.call(() => {
      gsap.set(strokes, { opacity: 0 })
      fills.forEach(el => {
        el.setAttribute('stroke', 'currentColor')
        el.setAttribute('stroke-width', '3')
      })
    }, [], T_MORPH)
    tl.to(morph, {
      p: 1,
      duration: MORPH,
      ease: 'expo.inOut',
      onUpdate: () => {
        setShape(GLOBE, BRACKET, morph.p)
        fills.forEach(el => {
          el.setAttribute('fill-opacity', morph.p.toFixed(3))
          el.setAttribute('stroke-opacity', (1 - morph.p).toFixed(3))
        })
      },
      onComplete: () => fills.forEach(el => el.setAttribute('stroke', 'none')),
    }, T_MORPH)
    tl.to(count, { v: 50, duration: MORPH, ease: 'none', onUpdate: writeCount }, T_MORPH)

    // 3. Cards grow out of the centre, each on top of the last
    cards.forEach((el, i) => {
      tl.to(el, { scale: 1, duration: GROW, ease: 'expo.out' }, T_CARDS + i * STAGGER)
    })
    tl.to(count, { v: 100, duration: HOLD + COLUMN, ease: 'none', onUpdate: writeCount }, T_CARDS)

    // 4. Cards drop into a column under the mark, then the background flips to white
    cards.forEach((el, i) => {
      const { h } = SIZES[PROJECTS[INTRO[i]].size]
      tl.to(el, { y: -h / 2 + COLUMN_Y[i], duration: COLUMN, ease: 'expo.inOut' }, T_COLUMN)
    })
    tl.to(counter, { yPercent: -110, duration: FLIP, ease: 'power2.in' }, T_FLIP)
    tl.to(bgRef.current, { opacity: 0, duration: FLIP, ease: 'none' }, T_FLIP)

    // 5. Cards fly to their gallery slots while the mark opens into the frame
    cards.forEach((el, i) => {
      const c = INTRO_FINAL[i]
      tl.to(el, { y: -c.h / 2 + c.dy, scale: c.scale, opacity: c.opacity, duration: SPREAD, ease: 'expo.inOut' }, T_SPREAD)
    })
    ghosts.forEach((el, i) => {
      tl.to(el, { opacity: GHOSTS[i].opacity, duration: 0.8, ease: 'power1.out' }, T_SPREAD + SPREAD * 0.4)
    })
    tl.to(spread, {
      p: 1,
      duration: SPREAD,
      ease: 'expo.inOut',
      onUpdate: () => setShape(BRACKET, FRAME, spread.p),
    }, T_SPREAD)
  }, [])

  return (
    <>
      {!done && (
        <>
          <div ref={bgRef} style={{ position: 'fixed', inset: 0, zIndex: 9996, backgroundColor: '#000' }} />

          <div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 9997 }}
          >
            <div className="relative w-0 h-0">
              {GHOSTS.map((c, i) => (
                <IntroCard key={`g${c.projIdx}`} projIdx={c.projIdx} centred={c.dist < 0.5} ref={el => { ghostRefs.current[i] = el }} />
              ))}
              {INTRO.map((p, i) => (
                <IntroCard key={p} projIdx={p} centred={INTRO_FINAL[i].dist < 0.5} ref={el => { cardRefs.current[i] = el }} />
              ))}
            </div>
          </div>

          <div style={{
            position: 'fixed',
            right: 28,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 9999,
            overflow: 'hidden',
            color: '#fff',
            mixBlendMode: 'difference',
            fontSize: '1.3rem',
            fontWeight: 500,
            lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
            pointerEvents: 'none',
          }}>
            <div ref={counterRef}>00</div>
          </div>
        </>
      )}

      {/* The mark — a top-level fixed layer so difference blending reaches the cards and page below */}
      <div style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: LOGO_PX,
        height: LOGO_PX,
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        color: '#fff',
        mixBlendMode: 'difference',
        opacity: frameHidden ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}>
        <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" overflow="visible" fill="none">
          {[0, 1].map(i => (
            <path
              key={`f${i}`}
              ref={el => { fillRefs.current[i] = el }}
              d={done ? FRAME_D[i] : GLOBE_D[i]}
              fill="currentColor"
              fillOpacity={done ? 1 : 0}
            />
          ))}
          {!done && STROKE_D.map((d, i) => (
            <path
              key={`s${i}`}
              ref={el => { strokeRefs.current[i] = el }}
              d={d}
              pathLength={1}
              stroke="currentColor"
              strokeWidth={3}
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          ))}
        </svg>
      </div>
    </>
  )
}

// Same markup and styling as a ProjectGallery slot, so the hand-off is invisible
function IntroCard({ projIdx, centred, ref }: { projIdx: number; centred: boolean; ref: React.Ref<HTMLDivElement> }) {
  const project = PROJECTS[projIdx]
  const { w, h } = SIZES[project.size]
  return (
    <div
      ref={ref}
      className="absolute top-0 left-0 overflow-hidden origin-center will-change-transform"
      style={{ width: w, height: h, backgroundColor: project.color, transform: 'scale(0)' }}
    >
      {project.image && <img src={project.image} alt="" className="w-full h-full object-cover" />}
      <div className="absolute inset-0 flex items-end p-4">
        <span
          className="font-mono text-[11px] tracking-[0.12em]"
          style={{ color: centred ? '#FF6B00' : 'rgba(255,255,255,0.2)', fontWeight: centred ? 700 : 400 }}
        >
          {String(project.id).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
