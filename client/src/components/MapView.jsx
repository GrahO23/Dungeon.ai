export function MapView({ map }) {
  const visited = map?.visited ?? []
  const frontier = map?.frontier ?? []

  if (!visited.length) {
    return (
      <div className="map-view">
        <p className="inventory-empty">The map is still unknown.</p>
      </div>
    )
  }

  return (
    <div className="map-view">
      {visited.map((loc) => (
        <div key={loc.id} className={`map-node${loc.id === map.currentLocationId ? ' current' : ''}`}>
          <strong>{loc.name}</strong>
          {loc.id === map.currentLocationId && <span className="map-here"> (here)</span>}
          <p>{loc.description}</p>
        </div>
      ))}
      {frontier.map((loc) => (
        <div key={loc.id} className="map-node frontier">
          <strong>{loc.name}</strong>
          <p>Unexplored.</p>
        </div>
      ))}
    </div>
  )
}
