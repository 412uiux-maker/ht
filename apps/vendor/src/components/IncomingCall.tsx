import { useEffect, useRef, useState } from 'react'

// Gateway that serves the video page and the WS signaling endpoint.
// Matches the hardcoded base used elsewhere in the vendor app.
const VIDEO_BASE = 'http://localhost:8080'
const WS_URL = VIDEO_BASE.replace(/^http/, 'ws') + '/ws/signal'

const SPECIES: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾',
}

type IncomingCall = {
  room: string
  client_name?: string
  pet_name?: string
  pet_species?: string
  problem?: string
}

/**
 * Global listener for incoming video calls. Mounted once while the vet is
 * logged in: keeps a WS connection to the signaling lobby (keyed by vet_id),
 * shows a ringing screen on `incoming-call`, and lets the vet accept or decline.
 */
export default function IncomingCall({ vetId }: { vetId: number }) {
  const [call, setCall] = useState<IncomingCall | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const ringRef = useRef<(() => void) | null>(null)

  // ── WS lobby connection (with auto-reconnect) ──────────────
  useEffect(() => {
    let closed = false
    let retry: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      if (closed) return
      let ws: WebSocket
      try { ws = new WebSocket(WS_URL) } catch { retry = setTimeout(connect, 3000); return }
      wsRef.current = ws

      ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe-vet', vet_id: vetId }))

      ws.onmessage = (evt) => {
        let msg: any
        try { msg = JSON.parse(evt.data) } catch { return }
        if (msg.type === 'incoming-call') {
          setCall({
            room: msg.room,
            client_name: msg.client_name,
            pet_name: msg.pet_name,
            pet_species: msg.pet_species,
            problem: msg.problem,
          })
        } else if (msg.type === 'call-cancelled') {
          setCall(prev => (prev && prev.room === msg.room ? null : prev))
        }
      }

      ws.onclose = () => { if (!closed) retry = setTimeout(connect, 3000) }
      ws.onerror = () => ws.close()
    }

    connect()
    return () => {
      closed = true
      if (retry) clearTimeout(retry)
      wsRef.current?.close()
    }
  }, [vetId])

  // ── Ringtone while a call is pending ───────────────────────
  useEffect(() => {
    if (!call) { ringRef.current?.(); ringRef.current = null; return }
    let stopped = false
    let ctx: AudioContext | null = null
    try {
      const AC = (window.AudioContext || (window as any).webkitAudioContext)
      ctx = new AC()
      const beep = () => {
        if (stopped || !ctx) return
        const o = ctx.createOscillator(), g = ctx.createGain()
        o.type = 'sine'; o.frequency.value = 660
        g.gain.setValueAtTime(0.001, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        o.connect(g); g.connect(ctx.destination)
        o.start(); o.stop(ctx.currentTime + 0.5)
      }
      beep()
      const iv = setInterval(beep, 1500)
      ringRef.current = () => { stopped = true; clearInterval(iv); ctx?.close().catch(() => {}) }
    } catch { ringRef.current = null }
    return () => { ringRef.current?.(); ringRef.current = null }
  }, [call])

  if (!call) return null

  const accept = () => {
    const room = call.room
    setCall(null)
    window.open(`${VIDEO_BASE}/video.html?id=${room}&role=vet`, '_blank', 'noopener')
  }

  const decline = () => {
    wsRef.current?.send(JSON.stringify({ type: 'call-decline', room: call.room }))
    setCall(null)
  }

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ fontSize: '13px', color: 'var(--text3)', letterSpacing: '.04em', textTransform: 'uppercase' }}>
          Входящий видеозвонок
        </div>
        <div style={avatar}>{SPECIES[call.pet_species ?? 'other'] ?? '🐾'}</div>
        <div style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center' }}>
          {call.client_name || 'Клиент'}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text2)', textAlign: 'center' }}>
          Питомец: {call.pet_name || '—'}
        </div>
        {call.problem && (
          <div style={problemBox}>{call.problem}</div>
        )}
        <div style={ringDots}><span style={dot(0)} /><span style={dot(0.2)} /><span style={dot(0.4)} /></div>
        <div style={{ display: 'flex', gap: '14px', marginTop: '8px', width: '100%' }}>
          <button onClick={decline} style={{ ...btn, background: '#E5534A', color: '#fff' }}>Отклонить</button>
          <button onClick={accept} style={{ ...btn, background: '#2BB673', color: '#fff' }}>Ответить</button>
        </div>
      </div>
      <style>{'@keyframes icPulse{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}'}</style>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(20,16,14,.55)', backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
}
const card: React.CSSProperties = {
  background: 'var(--surface, #fff)', borderRadius: '24px', padding: '28px 24px',
  width: '100%', maxWidth: '360px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  boxShadow: '0 24px 64px rgba(0,0,0,.3)',
}
const avatar: React.CSSProperties = {
  width: '88px', height: '88px', borderRadius: '28px', marginTop: '6px',
  background: 'linear-gradient(135deg,#FFEAD7,#FCDCC4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '46px',
}
const problemBox: React.CSSProperties = {
  fontSize: '13px', color: 'var(--text2)', background: 'var(--bg2, #F6F1EC)',
  borderRadius: '12px', padding: '10px 12px', width: '100%', textAlign: 'center',
}
const ringDots: React.CSSProperties = { display: 'flex', gap: '6px', margin: '4px 0' }
const dot = (delay: number): React.CSSProperties => ({
  width: '8px', height: '8px', borderRadius: '50%', background: 'var(--amber, #E8911A)',
  animation: `icPulse 1.2s ease-in-out ${delay}s infinite`,
})
const btn: React.CSSProperties = {
  flex: 1, padding: '14px 0', borderRadius: '99px', border: 'none',
  fontSize: '15px', fontWeight: 700, cursor: 'pointer',
}
