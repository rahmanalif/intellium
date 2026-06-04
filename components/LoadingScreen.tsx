'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface LoadingScreenProps {
  onComplete?: () => void
}

const NUM_IMAGES = 8
const IMG_W      = 160
const IMG_H      = 220
const IMG_GAP    = 12
const ITEM_H     = IMG_H + IMG_GAP
const MAX_SCROLL = ITEM_H * (NUM_IMAGES - 1)

// Ellipse clip dimensions that match the [] bracket interior
// Bars at SVG x=24/76, arms at SVG y=12/88, displayed at 280px × 1.08 scale
const CLIP_HW = 79   // half-width  px
const CLIP_HH = 115  // half-height px

const BG_COLORS = [
  '#1a1a1a','#262626','#323232','#3e3e3e',
  '#4a4a4a','#565656','#626262','#6e6e6e',
]

// ── Arc state descriptors ────────────────────────────────────────────────────
// Each arc: M x1 y1  Q cx cy  x2 y2
const OPEN_L = { x1: 50, y1: 12, cx: 15, cy: 50, x2: 50, y2: 88 } // (
const OPEN_R = { x1: 50, y1: 12, cx: 85, cy: 50, x2: 50, y2: 88 } // )
const SHUT_L = { x1: 24, y1: 12, cx: 24, cy: 50, x2: 24, y2: 88 } // [
const SHUT_R = { x1: 76, y1: 12, cx: 76, cy: 50, x2: 76, y2: 88 } // ]

const toD = (s: typeof OPEN_L) =>
  `M ${s.x1} ${s.y1} Q ${s.cx} ${s.cy} ${s.x2} ${s.y2}`

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const overlayRef   = useRef<HTMLDivElement>(null)
  const logoWrapRef  = useRef<HTMLDivElement>(null)
  const circleRef    = useRef<SVGCircleElement>(null)
  const arc1Ref      = useRef<SVGPathElement>(null)
  const arc2Ref      = useRef<SVGPathElement>(null)
  const topArmRef    = useRef<SVGPathElement>(null)
  const botArmRef    = useRef<SVGPathElement>(null)
  const leftHalfRef  = useRef<HTMLDivElement>(null)
  const rightHalfRef = useRef<HTMLDivElement>(null)
  const clipViewRef  = useRef<HTMLDivElement>(null)
  const columnRef    = useRef<HTMLDivElement>(null)
  const imgWrappers  = useRef<HTMLDivElement[]>([])
  const hintRef      = useRef<HTMLDivElement>(null)
  const counterRef   = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const overlay   = overlayRef.current!
    const logoWrap  = logoWrapRef.current!
    const circle    = circleRef.current!
    const arc1      = arc1Ref.current!
    const arc2      = arc2Ref.current!
    const topArm    = topArmRef.current!
    const botArm    = botArmRef.current!
    const leftHalf  = leftHalfRef.current!
    const rightHalf = rightHalfRef.current!
    const clipView  = clipViewRef.current!
    const column    = columnRef.current!
    const wrappers  = imgWrappers.current
    const counterEl = counterRef.current!
    const hint      = hintRef.current!

    document.body.style.overflow = 'hidden'

    // ── Scroll state ─────────────────────────────────────────────────────────
    let curY = 0, tgtY = 0
    let scrollActive = false, revealScheduled = false, revealDone = false
    let rafId = 0

    // ── Reveal ───────────────────────────────────────────────────────────────
    function triggerReveal() {
      if (revealDone) return
      revealDone = true
      scrollActive = false
      cancelAnimationFrame(rafId)

      gsap.set(logoWrap,              { opacity: 0 })
      gsap.set([leftHalf, rightHalf], { opacity: 1 })
      gsap.set(hint,                  { opacity: 0 })

      gsap.timeline({
        onComplete() {
          overlay.style.visibility    = 'hidden'
          overlay.style.pointerEvents = 'none'
          document.body.style.overflow = ''
          onCompleteRef.current?.()
        },
      })
        .to(leftHalf,  { x: -700, opacity: 0, duration: 1.2, ease: 'power3.inOut' }, 0)
        .to(rightHalf, { x:  700, opacity: 0, duration: 1.2, ease: 'power3.inOut' }, 0)
        .to(overlay,   { backgroundColor: '#ffffff', duration: 0.8 }, 0)
        .to(clipView,  { clipPath: 'ellipse(3000px 3000px at 50% 50%)', duration: 1.2, ease: 'power3.inOut' }, 0)
        .to(overlay,   { opacity: 0, duration: 0.5 }, 1.2)
    }

    // ── Scroll loop ───────────────────────────────────────────────────────────
    function startScrollLoop() {
      scrollActive = true
      function tick() {
        curY += (tgtY - curY) * 0.1
        gsap.set(column, { y: -curY })

        wrappers.forEach((wrap, i) => {
          const dist  = Math.abs(i * ITEM_H - curY)
          const t     = Math.max(0, 1 - dist / ITEM_H)
          gsap.set(wrap, { scale: 1 + t * 0.2, transformOrigin: 'center center' })
        })

        if (curY >= MAX_SCROLL - 2 && !revealScheduled) {
          revealScheduled = true
          gsap.delayedCall(0.9, triggerReveal)
        }
        if (scrollActive) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }

    // ── Wheel ─────────────────────────────────────────────────────────────────
    function onWheel(e: WheelEvent) {
      if (!scrollActive) return
      e.preventDefault()
      tgtY = Math.max(0, Math.min(MAX_SCROLL, tgtY + e.deltaY * 0.8))
    }
    window.addEventListener('wheel', onWheel, { passive: false })

    // ── Mutable arc state objects (GSAP mutates these in-place) ──────────────
    const leftState  = { ...OPEN_L }
    const rightState = { ...OPEN_R }

    const count = { val: 0 }
    const tl    = gsap.timeline()

    // Phase 1 (0 – 1.5 s): logo draws in
    tl.fromTo(logoWrap,
      { scale: 0.3, opacity: 0 },
      { scale: 1,   opacity: 1, duration: 1.5, ease: 'power2.out' },
      0,
    )

    // Counter 0 → 100 over intro
    tl.to(count, {
      val: 100, duration: 3.5, ease: 'power1.inOut',
      onUpdate() { counterEl.textContent = Math.round(count.val).toString() },
    }, 0)

    // Phase 2 (2 – 3.5 s): () → []
    // Left arc morphs to left bar
    tl.to(leftState, {
      ...SHUT_L,
      duration: 1.5, ease: 'power2.inOut',
      onUpdate() { arc1.setAttribute('d', toD(leftState)) },
    }, 2)
    // Right arc morphs to right bar
    tl.to(rightState, {
      ...SHUT_R,
      duration: 1.5, ease: 'power2.inOut',
      onUpdate() { arc2.setAttribute('d', toD(rightState)) },
    }, 2)
    // Stroke turns white + thicker
    tl.to([arc1, arc2], { attr: { stroke: '#ffffff', 'stroke-width': '3' }, duration: 1.5, ease: 'power2.inOut' }, 2)
    // Circle fades out
    tl.to(circle,       { attr: { opacity: '0' }, duration: 0.8 }, 2)
    // Horizontal arms fade in to complete the []
    tl.to([topArm, botArm], { attr: { opacity: '1' }, duration: 0.5, ease: 'power2.in' }, 3.0)
    // Slight scale-up
    tl.to(logoWrap, { scale: 1.08, duration: 1.5, ease: 'power2.inOut' }, 2)

    // Phase 3 (3.5 s): images burst in through a wide clip, then bracket closes
    tl.set(clipView, { opacity: 1, clipPath: 'ellipse(500px 500px at 50% 50%)' }, 3.5)
    wrappers.forEach((wrap, i) => {
      tl.fromTo(wrap,
        { y: -160, scale: 0.5, opacity: 0 },
        { y:    0, scale: 1,   opacity: 1, duration: 0.6, ease: 'power3.out' },
        3.65 + i * 0.16,
      )
    })

    const burstEnd = 3.65 + (NUM_IMAGES - 1) * 0.16 + 0.6   // ≈ 5.37 s

    // Bracket closes in on the images
    tl.to(clipView, {
      clipPath: `ellipse(${CLIP_HW}px ${CLIP_HH}px at 50% 50%)`,
      duration: 0.7, ease: 'power2.inOut',
    }, burstEnd + 0.1)

    tl.to(hint,  { opacity: 1, duration: 0.4 }, burstEnd + 0.9)
    tl.call(startScrollLoop, [],                 burstEnd + 0.9)

    return () => {
      tl.kill()
      cancelAnimationFrame(rafId)
      window.removeEventListener('wheel', onWheel)
      document.body.style.overflow = ''
    }
  }, [])

  const SVG_SIZE = 280
  const HALF     = SVG_SIZE / 2

  return (
    <div
      ref={overlayRef}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'black', overflow: 'hidden' }}
    >
      {/* ── images clipped to bracket ellipse ── */}
      <div
        ref={clipViewRef}
        style={{
          position: 'absolute', inset: 0,
          clipPath: `ellipse(${CLIP_HW}px ${CLIP_HH}px at 50% 50%)`,
          opacity: 0, overflow: 'hidden',
        }}
      >
        {/* image-0 centre = screen centre at scroll 0 */}
        <div style={{
          position: 'absolute',
          left: '50%', top: `calc(50% - ${IMG_H / 2}px)`,
          transform: 'translateX(-50%)',
        }}>
          <div ref={columnRef} style={{ display: 'flex', flexDirection: 'column', gap: IMG_GAP }}>
            {Array.from({ length: NUM_IMAGES }).map((_, i) => (
              <div
                key={i}
                ref={el => { if (el) imgWrappers.current[i] = el }}
                style={{
                  width: IMG_W, height: IMG_H,
                  backgroundColor: BG_COLORS[i],
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{
                  fontFamily: 'monospace', fontSize: 11,
                  color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── animated logo / bracket frame ── */}
      <div
        ref={logoWrapRef}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100" fill="none">
          {/* outer circle — fades out during () → [] */}
          <circle ref={circleRef} cx="50" cy="50" r="38" stroke="#c8c8c8" strokeWidth="1" />
          {/* curved arcs — morph into straight bars */}
          <path ref={arc1Ref} d={toD(OPEN_L)} stroke="#c8c8c8" strokeWidth="1" fill="none" />
          <path ref={arc2Ref} d={toD(OPEN_R)} stroke="#c8c8c8" strokeWidth="1" fill="none" />
          {/* horizontal bracket arms — fade in to complete [] */}
          <path ref={topArmRef} d="M 24 12 L 76 12" stroke="white" strokeWidth="3" fill="none" opacity="0" />
          <path ref={botArmRef} d="M 24 88 L 76 88" stroke="white" strokeWidth="3" fill="none" opacity="0" />
        </svg>
      </div>

      {/* ── left split half (shows left [) ── */}
      <div
        ref={leftHalfRef}
        style={{
          position: 'absolute',
          left: `calc(50% - ${HALF}px)`, top: `calc(50% - ${HALF}px)`,
          width: HALF, height: SVG_SIZE,
          overflow: 'hidden', opacity: 0, pointerEvents: 'none',
        }}
      >
        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100" fill="none">
          <path d="M 24 12 Q 24 50 24 88" stroke="white" strokeWidth="3" fill="none" />
          <path d="M 76 12 Q 76 50 76 88" stroke="white" strokeWidth="3" fill="none" />
          <path d="M 24 12 L 76 12"       stroke="white" strokeWidth="3" fill="none" />
          <path d="M 24 88 L 76 88"       stroke="white" strokeWidth="3" fill="none" />
        </svg>
      </div>

      {/* ── right split half (shows right ]) ── */}
      <div
        ref={rightHalfRef}
        style={{
          position: 'absolute',
          left: '50%', top: `calc(50% - ${HALF}px)`,
          width: HALF, height: SVG_SIZE,
          overflow: 'hidden', opacity: 0, pointerEvents: 'none',
        }}
      >
        <svg style={{ marginLeft: -HALF }} width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100" fill="none">
          <path d="M 24 12 Q 24 50 24 88" stroke="white" strokeWidth="3" fill="none" />
          <path d="M 76 12 Q 76 50 76 88" stroke="white" strokeWidth="3" fill="none" />
          <path d="M 24 12 L 76 12"       stroke="white" strokeWidth="3" fill="none" />
          <path d="M 24 88 L 76 88"       stroke="white" strokeWidth="3" fill="none" />
        </svg>
      </div>

      {/* ── scroll hint ── */}
      <div
        ref={hintRef}
        style={{
          position: 'absolute', bottom: 52, left: '50%',
          transform: 'translateX(-50%)', opacity: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          pointerEvents: 'none',
        }}
      >
        <span style={{
          fontFamily: 'monospace', fontSize: 10,
          color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em',
        }}>
          SCROLL
        </span>
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
          <line x1="5" y1="0" x2="5" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <polyline points="1,10 5,14 9,10" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* ── counter ── */}
      <div style={{ position: 'absolute', bottom: 24, right: 24 }}>
        <span
          ref={counterRef}
          style={{ fontFamily: 'monospace', fontSize: 13, color: 'white', lineHeight: 1 }}
        >
          0
        </span>
      </div>
    </div>
  )
}
