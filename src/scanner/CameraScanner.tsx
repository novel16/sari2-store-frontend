import { useEffect, useRef, useState } from 'react'
import { cameraMessage, stopCamera } from './camera'

export default function CameraScanner({
  onCode,
  onStop,
}: {
  onCode: (code: string) => void
  onStop: () => void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const onCodeRef = useRef(onCode)
  const [device, setDevice] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [state, setState] = useState('Starting camera…')
  const [error, setError] = useState('')
  useEffect(() => {
    onCodeRef.current = onCode
  }, [onCode])
  useEffect(() => {
    let active = true,
      detected = false
    let stream: MediaStream | null = null
    let controls: { stop: () => void } | null = null
    const element = video.current!
    async function start() {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('unsupported')
        }
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (!active) return
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: device
            ? { deviceId: { exact: device } }
            : { facingMode: { ideal: 'environment' } },
        })
        if (!active) {
          stopCamera(stream)
          return
        }
        const choices = await navigator.mediaDevices.enumerateDevices()
        if (!active) {
          stopCamera(stream)
          return
        }
        setDevices(choices.filter((item) => item.kind === 'videoinput'))
        const reader = new BrowserMultiFormatReader()
        controls = await reader.decodeFromStream(
          stream,
          element,
          (result, _failure, currentControls) => {
            if (!active || detected || !result) return
            const code = result.getText().trim()
            if (!code || code.length > 64) return
            detected = true
            currentControls.stop()
            stopCamera(stream)
            onCodeRef.current(code)
          },
        )
        if (!active || detected) {
          controls.stop()
          stopCamera(stream)
          return
        }
        setState('Point the camera at a product barcode.')
      } catch (failure) {
        stopCamera(stream)
        if (active)
          setError(
            failure instanceof Error && failure.message === 'unsupported'
              ? 'Camera scanning needs HTTPS (localhost also works) and a browser with camera support. You can enter the barcode below.'
              : cameraMessage(failure),
          )
      }
    }
    void start()
    return () => {
      active = false
      controls?.stop()
      stopCamera(stream)
      element.srcObject = null
    }
  }, [device])
  return (
    <section className="mb-5 rounded-xl border border-stone-200 p-3">
      <video
        ref={video}
        autoPlay
        muted
        playsInline
        aria-label="Barcode camera preview"
        className="aspect-video w-full rounded-lg bg-ink object-contain"
      />
      {error ? (
        <p role="alert" className="mt-3 text-xs leading-relaxed text-amber-900">
          {error}
        </p>
      ) : (
        <p role="status" className="mt-3 text-xs text-stone-500">
          {state}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {devices.length > 1 && (
          <select
            aria-label="Choose barcode camera"
            className="min-w-0 max-w-full rounded-lg border border-stone-200 p-2 text-xs"
            value={device}
            onChange={(event) => {
              setError('')
              setState('Starting camera…')
              setDevice(event.target.value)
            }}
          >
            <option value="">Preferred back camera</option>
            {devices.map((item, i) => (
              <option key={item.deviceId} value={item.deviceId}>
                {item.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="btn btn-secondary" onClick={onStop}>
          Stop camera / enter barcode
        </button>
      </div>
    </section>
  )
}
