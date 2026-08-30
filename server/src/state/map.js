import path from 'node:path'
import { readMarkdown, writeMarkdown } from './markdown.js'

const FILE = 'map.md'

function renderBody(locations, currentLocationId) {
  if (!locations?.length) return '## Locations\n(not yet established)'

  const lines = locations.map((loc) => {
    const here = loc.id === currentLocationId ? ' (you are here)' : ''
    const connections = loc.connectsTo?.length ? loc.connectsTo.join(', ') : 'none'
    const hook = loc.questHook ? ` Quest hook: ${loc.questHook}` : ''
    return `- **${loc.name}** (${loc.id})${here}: ${loc.description} Connects to: ${connections}.${hook}`
  })

  return `## Locations\n${lines.join('\n')}`
}

export function readMap(gameStateDir) {
  return readMarkdown(path.join(gameStateDir, FILE), {
    data: { currentLocationId: null, locations: [], visitedLocationIds: [] },
    content: '',
  })
}

export function writeMap(
  gameStateDir,
  { currentLocationId, locations, visitedLocationIds, generatedAt = new Date().toISOString() },
) {
  writeMarkdown(
    path.join(gameStateDir, FILE),
    {
      currentLocationId,
      locations,
      visitedLocationIds: visitedLocationIds ?? (currentLocationId ? [currentLocationId] : []),
      generatedAt,
    },
    renderBody(locations, currentLocationId),
  )
}

export function getLocation(mapData, id) {
  return mapData.locations?.find((loc) => loc.id === id) ?? null
}

export function getCurrentLocation(mapData) {
  return getLocation(mapData, mapData.currentLocationId)
}

// Returns the current location plus the locations it connects to — the
// bounded "nearby" context fed into the per-turn DM prompt, not the whole map.
export function getNearbyLocations(mapData) {
  const current = getCurrentLocation(mapData)
  if (!current) return { current: null, connected: [] }
  const connected = (current.connectsTo ?? []).map((id) => getLocation(mapData, id)).filter(Boolean)
  return { current, connected }
}

// Applies a DM-suggested move to a new location. Fails soft (no-op) if the
// id isn't a real, connected location — never lets a hallucinated place
// corrupt the persistent map.
export function applyLocationUpdate(gameStateDir, locationId) {
  const data = readMap(gameStateDir).data
  const current = getCurrentLocation(data)
  const target = getLocation(data, locationId)

  if (!target || target.id === data.currentLocationId) return false
  if (current && !current.connectsTo?.includes(locationId)) return false

  const visitedLocationIds = [...new Set([...(data.visitedLocationIds ?? []), locationId])]
  writeMap(gameStateDir, { ...data, currentLocationId: locationId, visitedLocationIds })
  return true
}

// The fog-of-war view sent to clients: full detail for every location the
// party has actually been to, plus bare names for the unvisited locations
// directly reachable from one of those (the "frontier") — never the whole
// map, so an unexplored branch stays a mystery.
export function getExploredMap(mapData) {
  const visitedIds = mapData.visitedLocationIds?.length
    ? mapData.visitedLocationIds
    : mapData.currentLocationId
      ? [mapData.currentLocationId]
      : []

  const visited = visitedIds.map((id) => getLocation(mapData, id)).filter(Boolean)

  const frontierIds = new Set()
  for (const loc of visited) {
    for (const id of loc.connectsTo ?? []) {
      if (!visitedIds.includes(id)) frontierIds.add(id)
    }
  }
  const frontier = [...frontierIds]
    .map((id) => getLocation(mapData, id))
    .filter(Boolean)
    .map((loc) => ({ id: loc.id, name: loc.name }))

  return { currentLocationId: mapData.currentLocationId, visited, frontier }
}
