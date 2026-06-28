import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { t } from '../i18n'
import type { Vet } from '../api'

interface Props {
  consultationId: string
  vet: Vet
  onBack: () => void
}

type CallState = 'waiting' | 'connected' | 'ended' | 'failed'

interface FailMsg { title: string; sub: string }

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

function fmtSec(s: number) {
  const v = Math.max(0, Math.floor(s))
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`
}

export default function VideoCall({ consultationId, vet, onBack }: Props) {
  const localVidRef  = useRef<HTMLVideoElement>(null)
  const remoteVidRef = useRef<HTMLVideoElement>(null)

  // Mutable WebRTC state — refs so toggle handlers always see current values
  const localStream    = useRef<MediaStream | null>(null)
  const pcRef          = useRef<RTCPeerConnection | null>(null)
  const wsRef          = useRef<WebSocket | null>(null)
  const iceBuf         = useRef<RTCIceCandidateInit[]>([])
  const remoteDescSet  = useRef(false)
  const callStart      = useRef<number | null>(null)
  const durationMs     = useRef(30 * 60000)
  const serverOffset   = useRef(0)
  const timerIv        = useRef<ReturnType<typeof setInterval> | null>(null)
  const ringTimeout    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted      = useRef(true)

  const [callState, setCallState]   = useState<CallState>('waiting')
  const [micOn, setMicOn]           = useState(true)
  const [camOn, setCamOn]           = useState(true)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [timerText, setTimerText]   = useState('')
  const [timerWarn, setTimerWarn]   = useState<'' | 'warn' | 'crit'>('')
  const [endedDur, setEndedDur]     = useState('')
  const [failMsg, setFailMsg]       = useState<FailMsg | null>(null)
  const [noCam, setNoCam]           = useState(false)

  // ── Cleanup helper ─────────────────────────────────────────────────────────
  function cleanup() {
    if (timerIv.current)   { clearInterval(timerIv.current);  timerIv.current   = null }
    if (ringTimeout.current) { clearTimeout(ringTimeout.current); ringTimeout.current = null }
    if (pcRef.current)     { pcRef.current.close();  pcRef.current  = null }
    if (wsRef.current)     { wsRef.current.close();  wsRef.current  = null }
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop())
      localStream.current = null
    }
  }

  // ── End call (keeps UI on "ended" overlay) ─────────────────────────────────
  function endCall() {
    let dur = ''
    if (callStart.current) {
      const elapsed = (Date.now() + serverOffset.current - callStart.current) / 1000
      dur = `${t('video.duration')}: ${fmtSec(elapsed)}`
    }
    if (isMounted.current) {
      setEndedDur(dur)
      setCallState('ended')
    }
    cleanup()
  }

  // ── ICE buffer flush ───────────────────────────────────────────────────────
  async function flushIce() {
    const pc = pcRef.current
    if (!pc) return
    for (const c of iceBuf.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
    }
    iceBuf.current = []
  }

  // ── Create RTCPeerConnection ───────────────────────────────────────────────
  function createPC() {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    pcRef.current = pc

    if (localStream.current) {
      localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current!))
    }

    const remoteStream = new MediaStream()
    if (remoteVidRef.current) remoteVidRef.current.srcObject = remoteStream
    pc.ontrack = (e) => { remoteStream.addTrack(e.track) }

    pc.onicecandidate = (e) => {
      if (e.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ice', candidate: e.candidate }))
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected' && isMounted.current) {
        setCallState('connected')
        if (ringTimeout.current) { clearTimeout(ringTimeout.current); ringTimeout.current = null }
        startTimer()
      }
      if ((pc.connectionState === 'disconnected' || pc.connectionState === 'failed') && isMounted.current) {
        endCall()
      }
    }

    return pc
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  function startTimer() {
    fetch('/api/consultations/' + consultationId + '/call/start', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        callStart.current   = Date.parse(d.call_started_at)
        durationMs.current  = (d.duration_min || 30) * 60000
        if (d.now) serverOffset.current = Date.parse(d.now) - Date.now()
      })
      .catch(() => { callStart.current = Date.now() })
      .finally(() => {
        timerIv.current = setInterval(() => {
          if (!callStart.current || !isMounted.current) return
          const rem = durationMs.current - (Date.now() + serverOffset.current - callStart.current)
          setTimerText(rem > 0 ? fmtSec(rem / 1000) : '0:00')
          if (rem <= 30000)       setTimerWarn('crit')
          else if (rem <= 120000) setTimerWarn('warn')
        }, 1000)
      })
  }

  // ── Main init effect ───────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true

    async function init() {
      // Camera + mic
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        })
        localStream.current = stream
        if (localVidRef.current) localVidRef.current.srcObject = stream
      } catch {
        if (isMounted.current) setNoCam(true)
        try {
          localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch {}
      }

      // WebSocket signaling
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${proto}//${location.host}/ws/signal`)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', room: consultationId, role: 'client' }))
        // Fetch consult info then send call-invite so vet cabinet rings
        fetch('/api/consultations/' + consultationId)
          .then(r => r.json())
          .then(({ consultation: c }) => {
            if (!c || ws.readyState !== WebSocket.OPEN) return
            ws.send(JSON.stringify({
              type: 'call-invite', room: consultationId,
              vet_id: c.vet_id, client_name: c.client_name,
              pet_name: c.pet_name, pet_species: c.pet_species, problem: c.problem,
            }))
          })
          .catch(() => {})

        // 45-second no-answer timeout
        ringTimeout.current = setTimeout(() => {
          if (!isMounted.current) return
          setFailMsg({ title: t('video.no_answer'), sub: t('video.no_answer_sub') })
          setCallState('failed')
          cleanup()
        }, 45000)
      }

      ws.onmessage = async (evt) => {
        if (!isMounted.current) return
        let msg: any
        try { msg = JSON.parse(evt.data) } catch { return }

        switch (msg.type) {
          case 'peer-joined': {
            if (ringTimeout.current) { clearTimeout(ringTimeout.current); ringTimeout.current = null }
            const pc = createPC()
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'offer', sdp: offer }))
            }
            break
          }
          case 'call-declined':
            setFailMsg({ title: t('video.declined'), sub: t('video.declined_sub') })
            setCallState('failed')
            cleanup()
            break
          case 'offer': {
            const pc = createPC()
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
            remoteDescSet.current = true
            await flushIce()
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'answer', sdp: answer }))
            }
            break
          }
          case 'answer':
            if (pcRef.current && !remoteDescSet.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.sdp))
              remoteDescSet.current = true
              await flushIce()
            }
            break
          case 'ice':
            if (pcRef.current && remoteDescSet.current) {
              try { await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate)) } catch {}
            } else {
              iceBuf.current.push(msg.candidate)
            }
            break
          case 'peer-left':
            endCall()
            break
        }
      }

      ws.onerror  = () => {}
      ws.onclose  = () => {}
    }

    init()

    return () => {
      isMounted.current = false
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId])

  // ── Toggle controls ────────────────────────────────────────────────────────
  function toggleMic() {
    const next = !micOn
    setMicOn(next)
    localStream.current?.getAudioTracks().forEach(t => { t.enabled = next })
  }

  function toggleCam() {
    const next = !camOn
    setCamOn(next)
    localStream.current?.getVideoTracks().forEach(t => { t.enabled = next })
  }

  async function flipCamera() {
    const next: 'user' | 'environment' = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      const newTrack = newStream.getVideoTracks()[0]
      if (localVidRef.current) localVidRef.current.srcObject = newStream
      if (pcRef.current && localStream.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) await sender.replaceTrack(newTrack)
        localStream.current.getVideoTracks().forEach(t => { t.stop(); localStream.current!.removeTrack(t) })
        localStream.current.addTrack(newTrack)
      }
    } catch {}
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      zIndex: 100, fontFamily: 'var(--font)', overflow: 'hidden',
    }}>
      {/* Remote video (fullscreen) */}
      <video
        ref={remoteVidRef} autoPlay playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* No-camera placeholder */}
      {noCam && callState !== 'connected' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, background: '#1a1a1a',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, color: 'rgba(255,255,255,.6)', fontSize: 14,
        }}>
          <div style={{ fontSize: 48 }}>📷</div>
          <div>{t('video.no_cam')}</div>
        </div>
      )}

      {/* Gradient top + bottom */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 3, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(0,0,0,.6), transparent)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 280, zIndex: 3, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(0,0,0,.7) 40%, transparent)',
      }} />

      {/* Local PiP video */}
      <div style={{
        position: 'absolute', top: 20, right: 16, zIndex: 10,
        width: 112, height: 156, borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 8px 28px rgba(0,0,0,.45)', background: '#1a1a1a',
      }}>
        <video ref={localVidRef} autoPlay playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
        <div style={{
          position: 'absolute', bottom: 7, left: 8,
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
        }}>
          {micOn ? '🎤' : '🔇'}
        </div>
        <button onClick={flipCamera} style={{
          position: 'absolute', bottom: 7, right: 7,
          width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)',
          fontSize: 14, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>↺</button>
      </div>

      {/* Waiting overlay */}
      {callState === 'waiting' && !failMsg && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
          gap: 16, color: '#fff', textAlign: 'center', padding: '0 32px',
        }}>
          <div style={{ fontSize: 60 }}>🩺</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{t('video.calling')}</div>
          <div style={{ fontSize: 13, opacity: .7 }}>{vet.name} {t('video.calling_sub')}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: '#fff',
                animation: `vcDot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Failed overlay */}
      {callState === 'failed' && failMsg && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
          gap: 12, color: '#fff', textAlign: 'center', padding: '0 32px',
        }}>
          <div style={{ fontSize: 52 }}>📵</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{failMsg.title}</div>
          <div style={{ fontSize: 13, opacity: .7, lineHeight: 1.5 }}>{failMsg.sub}</div>
          <button onClick={onBack} style={overlayBtn}>
            {t('video.back_chat')}
          </button>
        </div>
      )}

      {/* Call ended overlay */}
      {callState === 'ended' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, color: '#fff',
        }}>
          <div style={{ fontSize: 52 }}>📵</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{t('video.ended')}</div>
          {endedDur && <div style={{ fontSize: 14, opacity: .7 }}>{endedDur}</div>}
          <button onClick={onBack} style={overlayBtn}>
            {t('video.back_chat')}
          </button>
        </div>
      )}

      {/* Info strip (connected) */}
      {callState === 'connected' && (
        <div style={{
          position: 'absolute', bottom: 104, left: 16, right: 16, zIndex: 10,
          background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(16px)',
          borderRadius: 20, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#FFEAD7,#FCDCC4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {vet.avatar_emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vet.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{vet.specialty}</div>
          </div>
          {timerText && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: timerWarn === 'crit' ? '#E5534A' : timerWarn === 'warn' ? '#C77700' : '#111',
            }}>
              {timerText}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: timerWarn === 'crit' ? '#E5534A' : '#4CAF7D',
                animation: 'timerPulse 1s ease-in-out infinite',
              }} />
            </div>
          )}
        </div>
      )}

      {/* Controls bar */}
      {(callState === 'waiting' || callState === 'connected') && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          padding: '0 28px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={toggleMic} aria-label={micOn ? 'Mute' : 'Unmute'} style={ctrlStyle(!micOn)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
              {!micOn && <line x1="1" y1="1" x2="23" y2="23"/>}
            </svg>
          </button>

          <button onClick={toggleCam} aria-label={camOn ? 'Stop camera' : 'Start camera'} style={ctrlStyle(!camOn)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              {!camOn && <line x1="1" y1="1" x2="23" y2="23"/>}
            </svg>
          </button>

          <button onClick={endCall} aria-label="End call" style={{
            ...ctrlStyle(false),
            width: 64, height: 64,
            background: '#E5534A',
            boxShadow: '0 6px 20px rgba(229,83,74,.5)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.37 2.05.57 3.16.57a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1C9.86 19.77 4.23 14.14 4 5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1c0 1.11.2 2.18.57 3.16a2 2 0 0 1-.45 2.11z"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          </button>

          <button onClick={() => { cleanup(); onBack() }} aria-label="Back to chat" style={{
            ...ctrlStyle(false),
            background: 'rgba(124,92,191,.75)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes vcDot {
          0%,100%{opacity:.25;transform:scale(.8)}
          50%{opacity:1;transform:scale(1)}
        }
        @keyframes timerPulse {
          0%,100%{opacity:1} 50%{opacity:.4}
        }
      `}</style>
    </div>
  )
}

const overlayBtn: CSSProperties = {
  marginTop: 12, padding: '12px 28px', borderRadius: 99,
  background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)',
  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
}

function ctrlStyle(isOff: boolean): CSSProperties {
  return {
    width: 60, height: 60, borderRadius: 99, border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: isOff ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.18)',
    backdropFilter: 'blur(10px)', color: isOff ? 'rgba(255,255,255,.5)' : '#fff',
    boxShadow: '0 4px 16px rgba(0,0,0,.25)',
  }
}
