/**
 * Web Audio API Sound Engine for NodeMind Glimpse Experience
 * Inspired by edolus.com ambient soundscape design:
 * Sub-bass harmonic drone, resonant frequency modulation per chapter,
 * and high-tech mechanical UI clicks.
 */

class GlimpseAudioEngine {
  constructor() {
    this.ctx = null
    this.isMuted = true
    this.masterGain = null
    this.droneGain = null
    this.oscillators = []
    this.filter = null
    this.isInitialized = false
  }

  init() {
    if (this.isInitialized) return
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    try {
      this.ctx = new AudioContextClass()

      // Master output gain
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)

      // Low-pass resonant filter
      this.filter = this.ctx.createBiquadFilter()
      this.filter.type = 'lowpass'
      this.filter.frequency.setValueAtTime(280, this.ctx.currentTime)
      this.filter.Q.setValueAtTime(4, this.ctx.currentTime)
      this.filter.connect(this.masterGain)

      // Drone gain
      this.droneGain = this.ctx.createGain()
      this.droneGain.gain.setValueAtTime(0.14, this.ctx.currentTime)
      this.droneGain.connect(this.filter)

      // Harmonics for a rich, warm cinematic atmosphere: 55Hz, 110Hz, 165Hz, 220Hz
      const freqs = [55, 110, 165, 220]
      this.oscillators = freqs.map((freq, idx) => {
        const osc = this.ctx.createOscillator()
        osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sine'
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime)

        const subGain = this.ctx.createGain()
        subGain.gain.setValueAtTime(0.25 / (idx + 1), this.ctx.currentTime)
        osc.connect(subGain)
        subGain.connect(this.droneGain)
        osc.start()
        return { osc, subGain }
      })

      this.isInitialized = true
    } catch {
      // AudioContext restricted before gesture
    }
  }

  setMuted(muted) {
    this.isMuted = muted
    if (!this.isInitialized && !muted) {
      this.init()
    }

    if (this.ctx && this.masterGain) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume()
      }
      const now = this.ctx.currentTime
      this.masterGain.gain.cancelScheduledValues(now)
      if (muted) {
        this.masterGain.gain.linearRampToValueAtTime(0, now + 0.3)
      } else {
        this.masterGain.gain.linearRampToValueAtTime(0.4, now + 0.5)
      }
    }
  }

  // Modulate atmospheric sound based on active chapter (0 to 5)
  setChapter(chapterIndex, scrollProgress = 0) {
    if (!this.isInitialized || !this.filter || this.isMuted) return
    const now = this.ctx.currentTime

    // Filter frequency shifts between 200Hz and 700Hz based on depth
    const targetFreq = 220 + chapterIndex * 75 + scrollProgress * 150
    this.filter.frequency.cancelScheduledValues(now)
    this.filter.frequency.linearRampToValueAtTime(targetFreq, now + 0.4)

    // Slight micro-pitch drift
    if (this.oscillators.length > 0) {
      const baseFreq = 55 + chapterIndex * 4
      this.oscillators[0].osc.frequency.linearRampToValueAtTime(baseFreq, now + 0.5)
    }
  }

  // UI Interactive trigger sounds
  playClick() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.07)
    } catch {
      // Ignore audio glitch
    }
  }

  playChapterTransition() {
    if (!this.isInitialized || this.isMuted || !this.ctx) return
    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.25)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now)
      osc.stop(now + 0.36)
    } catch {
      // Ignore
    }
  }

  destroy() {
    if (this.ctx) {
      try {
        this.oscillators.forEach(({ osc }) => osc.stop())
        this.ctx.close()
      } catch {
        // Ignore
      }
      this.ctx = null
      this.isInitialized = false
    }
  }
}

export const glimpseAudio = new GlimpseAudioEngine()
