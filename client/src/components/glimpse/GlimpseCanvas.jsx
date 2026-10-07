import { useEffect, useRef } from 'react'

/**
 * 3D Holographic Canvas Engine for NodeMind GLIMPSE Experience
 * Inspired by edolus.com WebGL real-time visual system:
 * - 3D Perspective Projection Matrix
 * - 6 Geometric Scene States that morph seamlessly with scroll progress
 * - Interactive Cursor Parallax Tilt
 * - Dynamic Lighting, Depth Fog, and Laser Energy Conduits
 */
export default function GlimpseCanvas({
  scrollProgress = 0, // Float from 0.0 to 5.0 (6 chapters)
  mousePos = { x: 0, y: 0 },
}) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const scrollProgressRef = useRef(scrollProgress)
  scrollProgressRef.current = scrollProgress
  const stateRef = useRef({
    particles: [],
    radarAngle: 0,
    time: 0,
    // Parallel Cursor Glide State
    shiftX: 0,
    shiftY: 0,
    targetShiftX: 0,
    targetShiftY: 0,
    // Subtle Perspective Tilt
    camRotX: 0,
    camRotY: 0,
    targetRotX: 0,
    targetRotY: 0,
    curScroll: 0,
    pointerX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    pointerY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    // Direct pointer tracking for instantaneous, zero-lag parallel cursor response
    const handlePointerMove = (e) => {
      stateRef.current.pointerX = e.clientX
      stateRef.current.pointerY = e.clientY
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    // Generate 450 dynamic 3D particles with multi-state target coordinates
    const PARTICLE_COUNT = 420
    const particles = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 1. Scene 0: Ingestion Vortex (Torus / Spiral)
      const u = Math.random() * Math.PI * 2
      const v = Math.random() * Math.PI * 2
      const R = 220 + Math.random() * 80
      const r = 60 + Math.random() * 40
      const s0X = (R + r * Math.cos(v)) * Math.cos(u)
      const s0Y = r * Math.sin(v) + (Math.random() - 0.5) * 80
      const s0Z = (R + r * Math.cos(v)) * Math.sin(u)

      // 2. Scene 1: AST Tree (Hierarchical branches)
      const level = Math.floor(Math.random() * 5)
      const branchAngle = ((i % 8) / 8) * Math.PI * 2
      const branchSpread = level * 75 + Math.random() * 30
      const s1X = Math.cos(branchAngle) * branchSpread
      const s1Y = -220 + level * 95 + (Math.random() - 0.5) * 40
      const s1Z = Math.sin(branchAngle) * branchSpread

      // 3. Scene 2: Security Radar Sphere (Geodesic Sphere)
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = 2 * Math.PI * Math.random()
      const radius = 240 + (i % 5 === 0 ? 30 : 0) // Some outer anomalies
      const s2X = radius * Math.sin(phi) * Math.cos(theta)
      const s2Y = radius * Math.sin(phi) * Math.sin(theta)
      const s2Z = radius * Math.cos(phi)

      // 4. Scene 3: Taint Analysis Pipes (Horizontal parallel data lanes)
      const lane = i % 4
      const laneX = -260 + (i / PARTICLE_COUNT) * 520
      const laneY = (lane - 1.5) * 90 + Math.sin(i * 0.3) * 25
      const laneZ = Math.cos(i * 0.4) * 110
      const s3X = laneX
      const s3Y = laneY
      const s3Z = laneZ

      // 5. Scene 4: Patch Synthesizer (Two split code planes fusing)
      const isLeftPlane = i % 2 === 0
      const s4X = isLeftPlane ? -140 + (Math.random() - 0.5) * 60 : 140 + (Math.random() - 0.5) * 60
      const s4Y = (Math.random() - 0.5) * 360
      const s4Z = (Math.random() - 0.5) * 200

      // 6. Scene 5: Mission Control Orbital Matrix (Triple planetary rings)
      const ringIdx = i % 3
      const ringRadius = 160 + ringIdx * 110
      const ringAngle = (i / (PARTICLE_COUNT / 3)) * Math.PI * 2
      const s5X = Math.cos(ringAngle) * ringRadius
      const s5Y = Math.sin(ringAngle) * Math.cos(0.7) * ringRadius * 0.4 + (Math.random() - 0.5) * 40
      const s5Z = Math.sin(ringAngle) * ringRadius

      particles.push({
        // State targets
        s0: { x: s0X, y: s0Y, z: s0Z },
        s1: { x: s1X, y: s1Y, z: s1Z },
        s2: { x: s2X, y: s2Y, z: s2Z },
        s3: { x: s3X, y: s3Y, z: s3Z },
        s4: { x: s4X, y: s4Y, z: s4Z },
        s5: { x: s5X, y: s5Y, z: s5Z },
        // Current position
        x: s0X,
        y: s0Y,
        z: s0Z,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.2 + 1.2,
        colorType: i % 15 === 0 ? 'threat' : i % 5 === 0 ? 'accent' : 'cyan',
        pulseOffset: Math.random() * Math.PI * 2,
      })
    }

    stateRef.current.particles = particles

    // 3D Math Helper: Project 3D point (x, y, z) into 2D screen coordinate
    const project = (x, y, z, fov = 650) => {
      // Camera distance offset
      const camZ = 580
      const pZ = z + camZ
      if (pZ <= 10) return null // behind camera
      const scale = fov / pZ
      // Position the 3D art comfortably to the right on desktop to frame the pop-up card
      const centerX = width > 980 ? width * 0.63 : width / 2

      // Depth-based parallel glide:
      // Dots move smoothly parallel to the cursor's movement.
      // Foreground dots glide slightly more than background dots for realistic 3D depth!
      const depthFactor = 0.6 + scale * 0.55
      const screenX = centerX + x * scale + stateRef.current.shiftX * depthFactor
      const screenY = height / 2 + y * scale + stateRef.current.shiftY * depthFactor
      return { x: screenX, y: screenY, scale, z: pZ }
    }

    // Main 60fps Render Loop - Calibrated for tranquil, luxurious parallel cursor glide
    const render = () => {
      stateRef.current.time += 0.005
      const { time, particles } = stateRef.current

      // Smooth scroll interpolation from ref
      const targetScroll = scrollProgressRef.current
      stateRef.current.curScroll += (targetScroll - stateRef.current.curScroll) * 0.08
      const curScroll = stateRef.current.curScroll

      // Normalized pointer coordinates (-0.5 to +0.5)
      const normX = (stateRef.current.pointerX / width) - 0.5
      const normY = (stateRef.current.pointerY / height) - 0.5

      // Parallel cursor tracking:
      // Moving cursor right moves dots right; moving cursor down moves dots down
      // Moves along smoothly at a satisfying, controlled speed
      stateRef.current.targetShiftX = normX * 90
      stateRef.current.targetShiftY = normY * 65

      // Liquid inertia follow-through
      stateRef.current.shiftX += (stateRef.current.targetShiftX - stateRef.current.shiftX) * 0.08
      stateRef.current.shiftY += (stateRef.current.targetShiftY - stateRef.current.shiftY) * 0.08

      // Very subtle 3D perspective cue (small angles, never swings or spins wildly)
      stateRef.current.targetRotX = normY * 0.04
      stateRef.current.targetRotY = normX * 0.06
      stateRef.current.camRotX += (stateRef.current.targetRotX - stateRef.current.camRotX) * 0.04
      stateRef.current.camRotY += (stateRef.current.targetRotY - stateRef.current.camRotY) * 0.04

      const rotX = stateRef.current.camRotX
      const rotY = stateRef.current.camRotY + time * 0.015 // Peaceful world orbit

      // Clear with dark cinema vignette
      ctx.fillStyle = '#06080d'
      ctx.fillRect(0, 0, width, height)

      // Radial background nebula glow shifted parallel with the cursor
      const nebulaX = (width > 980 ? width * 0.63 : width / 2) + stateRef.current.shiftX * 0.45
      const nebulaY = height / 2 + stateRef.current.shiftY * 0.45

      const grad = ctx.createRadialGradient(
        nebulaX,
        nebulaY,
        50,
        nebulaX,
        nebulaY,
        Math.max(width, height) * 0.65
      )
      // Color shifts based on current chapter
      if (curScroll < 1.0) {
        grad.addColorStop(0, 'rgba(14, 165, 233, 0.14)') // Cyan Ingestion
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.03)')
        grad.addColorStop(1, 'rgba(6, 8, 13, 0)')
      } else if (curScroll < 2.0) {
        grad.addColorStop(0, 'rgba(139, 92, 246, 0.15)') // Violet AST
        grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.03)')
        grad.addColorStop(1, 'rgba(6, 8, 13, 0)')
      } else if (curScroll < 3.0) {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.16)') // Red Radar Alert
        grad.addColorStop(0.5, 'rgba(244, 63, 94, 0.03)')
        grad.addColorStop(1, 'rgba(6, 8, 13, 0)')
      } else if (curScroll < 4.0) {
        grad.addColorStop(0, 'rgba(245, 158, 11, 0.15)') // Amber Taint Flow
        grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.03)')
        grad.addColorStop(1, 'rgba(6, 8, 13, 0)')
      } else if (curScroll < 4.8) {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.16)') // Emerald Patch Fix
        grad.addColorStop(0.5, 'rgba(52, 211, 153, 0.03)')
        grad.addColorStop(1, 'rgba(6, 8, 13, 0)')
      } else {
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.18)') // Mission Control Orbit
        grad.addColorStop(0.5, 'rgba(129, 140, 248, 0.04)')
        grad.addColorStop(1, 'rgba(6, 8, 13, 0)')
      }
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)

      // Additive blend mode for luminous neon particles
      ctx.globalCompositeOperation = 'lighter'

      // Interpolate between the 6 chapter target shapes
      // stageIndex: 0, 1, 2, 3, 4, 5
      const stage = Math.max(0, Math.min(5, curScroll))
      const fromStage = Math.floor(stage)
      const toStage = Math.min(5, fromStage + 1)
      const stageProgress = stage - fromStage
      // Smooth ease
      const easeT = stageProgress * stageProgress * (3 - 2 * stageProgress)

      const stageKeys = ['s0', 's1', 's2', 's3', 's4', 's5']
      const kFrom = stageKeys[fromStage]
      const kTo = stageKeys[toStage]

      const projectedPoints = []

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Morph target interpolation
        const tx = p[kFrom].x + (p[kTo].x - p[kFrom].x) * easeT
        const ty = p[kFrom].y + (p[kTo].y - p[kFrom].y) * easeT
        const tz = p[kFrom].z + (p[kTo].z - p[kFrom].z) * easeT

        // Subtle, peaceful cosmic drift instead of frantic vibration
        const oscX = Math.sin(time * 0.7 + p.pulseOffset) * 1.6
        const oscY = Math.cos(time * 0.6 + p.pulseOffset) * 1.6
        const oscZ = Math.sin(time * 0.5 + p.pulseOffset) * 1.6

        // Smooth liquid position chase
        p.x += (tx + oscX - p.x) * 0.04
        p.y += (ty + oscY - p.y) * 0.04
        p.z += (tz + oscZ - p.z) * 0.04

        // 3D Matrix Rotation (Y-axis world rotation + mouse tilt)
        // Rotate around Y
        const cosY = Math.cos(rotY)
        const sinY = Math.sin(rotY)
        const rx1 = p.x * cosY + p.z * sinY
        const rz1 = -p.x * sinY + p.z * cosY

        // Rotate around X
        const cosX = Math.cos(rotX)
        const sinX = Math.sin(rotX)
        const ry2 = p.y * cosX - rz1 * sinX
        const rz2 = p.y * sinX + rz1 * cosX

        const proj = project(rx1, ry2, rz2)
        if (proj) {
          projectedPoints.push({
            proj,
            p,
            depth: proj.z,
          })
        }
      }

      // Sort back-to-front for proper depth rendering
      projectedPoints.sort((a, b) => b.depth - a.depth)

      // Draw connecting energy filaments between close neighbor particles
      ctx.lineWidth = 0.65
      const connectLimit = 55
      for (let i = 0; i < projectedPoints.length; i += 3) {
        const p1 = projectedPoints[i]
        for (let j = i + 1; j < Math.min(i + 8, projectedPoints.length); j++) {
          const p2 = projectedPoints[j]
          const dx = p1.proj.x - p2.proj.x
          const dy = p1.proj.y - p2.proj.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectLimit) {
            const alpha = (1 - dist / connectLimit) * 0.22 * (p1.proj.scale * 0.8)
            if (p1.p.colorType === 'threat' || p2.p.colorType === 'threat') {
              ctx.strokeStyle = `rgba(244, 63, 94, ${alpha * 1.5})`
            } else if (curScroll > 3.8 && curScroll < 4.8) {
              ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`
            } else {
              ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`
            }
            ctx.beginPath()
            ctx.moveTo(p1.proj.x, p1.proj.y)
            ctx.lineTo(p2.proj.x, p2.proj.y)
            ctx.stroke()
          }
        }
      }

      // Render 3D particle nodes
      for (let i = 0; i < projectedPoints.length; i++) {
        const { proj, p } = projectedPoints[i]
        const r = p.size * proj.scale

        if (r <= 0.2) continue

        // Pulse intensity
        const pulse = 0.8 + 0.2 * Math.sin(time * 3 + p.pulseOffset)
        let fill = 'rgba(148, 163, 184, 0.8)'

        if (p.colorType === 'threat') {
          fill = `rgba(239, 68, 68, ${0.9 * pulse})`
        } else if (p.colorType === 'accent') {
          fill = `rgba(168, 85, 247, ${0.85 * pulse})`
        } else {
          fill = `rgba(56, 189, 248, ${0.75 * pulse})`
        }

        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.arc(proj.x, proj.y, r, 0, Math.PI * 2)
        ctx.fill()

        // Glowing outer halo for key nodes
        if (p.colorType === 'threat' || i % 18 === 0) {
          ctx.beginPath()
          ctx.arc(proj.x, proj.y, r * 2.8, 0, Math.PI * 2)
          ctx.fillStyle =
            p.colorType === 'threat'
              ? 'rgba(239, 68, 68, 0.18)'
              : 'rgba(56, 189, 248, 0.12)'
          ctx.fill()
        }
      }

      // Stage 2: Central Holographic Radar Beam
      if (curScroll >= 1.7 && curScroll <= 3.3) {
        stateRef.current.radarAngle += 0.008
        const radarAngle = stateRef.current.radarAngle
        const cProj = project(0, 0, 0)
        if (cProj) {
          const rRadius = 180 * cProj.scale
          ctx.beginPath()
          ctx.arc(cProj.x, cProj.y, rRadius, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)'
          ctx.lineWidth = 1
          ctx.stroke()

          // Sweep beam
          ctx.beginPath()
          ctx.moveTo(cProj.x, cProj.y)
          ctx.arc(
            cProj.x,
            cProj.y,
            rRadius,
            radarAngle,
            radarAngle + 0.45,
            false
          )
          ctx.closePath()
          ctx.fillStyle = 'rgba(239, 68, 68, 0.12)'
          ctx.fill()
        }
      }

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over'

      // Cinematic Vignette Overlay
      const vig = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.4,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      )
      vig.addColorStop(0, 'rgba(6, 8, 13, 0)')
      vig.addColorStop(1, 'rgba(6, 8, 13, 0.82)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, width, height)

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="glimpse-canvas-viewport"
      aria-hidden="true"
    />
  )
}
