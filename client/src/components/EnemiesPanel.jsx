function hpPercent(hp, maxHp) {
  return maxHp ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0
}

export function EnemiesPanel({ enemies }) {
  if (!enemies?.length) {
    return <p className="enemies-empty">Nothing here.</p>
  }

  return (
    <ul className="enemies-panel">
      {enemies.map((e) => {
        const hasCombatStats = e.maxHp > 0
        const defeated = hasCombatStats && e.hp <= 0
        return (
          <li key={e.name} className={`enemy-card${defeated ? ' enemy-defeated' : ''}`}>
            <div className="enemy-card-header">
              <strong>{e.name}</strong>
              <span className={`enemy-badge enemy-badge-${e.kind}`}>{e.kind}</span>
              {!e.hostile && <span className="enemy-badge enemy-badge-friendly">friendly</span>}
              {e.status && e.status !== 'active' && <span className="enemy-badge">{e.status}</span>}
            </div>
            {e.personality && <p className="enemy-personality">{e.personality}</p>}
            {hasCombatStats && (
              <div className="hp-bar">
                <div className="hp-bar-fill" style={{ width: `${hpPercent(e.hp, e.maxHp)}%` }} />
                <span className="hp-bar-label">{defeated ? 'Defeated' : `HP: ${e.hp}/${e.maxHp}`}</span>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
