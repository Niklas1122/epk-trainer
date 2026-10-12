import { useSyncExternalStore } from 'react'

// Hash routing keeps the app a set of static files: no server rewrites needed.

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

const getHash = () => window.location.hash

/** Path segments of the current route, e.g. '#/ueben/E' gives ['ueben', 'E']. */
export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, getHash)
  return hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent)
}

export const link = (...segments: string[]) => '#/' + segments.map(encodeURIComponent).join('/')

export function navigate(...segments: string[]) {
  window.location.hash = link(...segments)
}
