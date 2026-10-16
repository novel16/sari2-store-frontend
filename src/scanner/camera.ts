export function cameraMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Camera permission was denied. Allow camera access in your browser settings, or enter the barcode below.'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError')
    return 'No camera was found. You can enter a barcode or use a keyboard scanner below.'
  if (name === 'NotReadableError' || name === 'TrackStartError')
    return 'The camera is busy or unavailable. Close other camera apps and retry, or enter the barcode below.'
  return 'The camera could not start. Retry or enter the barcode below.'
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}
