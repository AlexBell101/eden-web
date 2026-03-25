'use client'

import { useCallback, useRef, useState } from 'react'
import Map, { type MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Bounds {
  sw_lat: number
  sw_lng: number
  ne_lat: number
  ne_lng: number
  label: string
}

interface MapRegionSelectorProps {
  value: Bounds | null
  onChange: (bounds: Bounds) => void
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export function MapRegionSelector({ value, onChange }: MapRegionSelectorProps) {
  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Map unavailable — <code className="font-mono text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> is not configured.
      </div>
    )
  }

  const mapRef = useRef<MapRef>(null)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ id: string; place_name: string; center: [number, number] }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [captured, setCaptured] = useState(false)
  // Full Mapbox place_name of the last selected suggestion (e.g. "South Bay, Los Angeles, California, United States")
  // Saved as the bounds label so the scraper can clean it down to "South Bay, CA"
  const fullPlaceName = useRef<string>('')

  const initialViewState = {
    longitude: value?.sw_lng ? (value.sw_lng + value.ne_lng) / 2 : -122.4194,
    latitude: value?.sw_lat ? (value.sw_lat + value.ne_lat) / 2 : 37.7749,
    zoom: 11,
  }

  async function searchLocation(q: string) {
    if (!q.trim()) { setSuggestions([]); return }
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&types=place,neighborhood,postcode,locality&limit=5`
      )
      const data = await res.json()
      setSuggestions(data.features ?? [])
    } catch {
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  function selectSuggestion(suggestion: { id: string; place_name: string; center: [number, number] }) {
    setQuery(suggestion.place_name.split(',')[0])
    fullPlaceName.current = suggestion.place_name  // keep full name for the bounds label
    setSuggestions([])
    mapRef.current?.flyTo({
      center: suggestion.center,
      zoom: 12,
      duration: 800,
    })
  }

  const captureArea = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const bounds = map.getBounds()
    if (!bounds) return
    // Prefer the full Mapbox place_name (includes state/country) so the scraper
    // can normalise it. Fall back to short query then existing label.
    const label = fullPlaceName.current || query || value?.label || 'Custom area'
    onChange({
      sw_lat: bounds.getSouth(),
      sw_lng: bounds.getWest(),
      ne_lat: bounds.getNorth(),
      ne_lng: bounds.getEast(),
      label,
    })
    setCaptured(true)
    setTimeout(() => setCaptured(false), 2000)
  }, [onChange, query, value?.label])

  return (
    <div className="space-y-3">
      {/* Search box */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            searchLocation(e.target.value)
          }}
          placeholder="Search neighborhood, city, or ZIP..."
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {isSearching && (
          <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
            Searching…
          </span>
        )}
        {suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors"
                >
                  {s.place_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height: 320 }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={initialViewState}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Overlay hint */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl bg-background/60 backdrop-blur-sm px-4 py-2 text-xs text-foreground/70 border border-border/50">
            Pan & zoom to your search area
          </div>
        </div>
      </div>

      {/* Capture button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={captureArea}
          className="rounded-xl border border-border bg-background px-5 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          {captured ? '✓ Area saved' : 'Use this area'}
        </button>

        {value?.label && (
          <span className="text-sm text-muted-foreground">
            Currently: <span className="text-foreground font-medium">{value.label}</span>
          </span>
        )}
      </div>
    </div>
  )
}
