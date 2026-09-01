function hpPercent(hp, maxHp) {
  return maxHp ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0
}

export function EnemiesPanel({ enemies, onLoot, disabled }) {
  if (!enemies?.length) {
    return <p className="enemies-empty">Nothing here.</p>
  }

  return (
    <ul className="enemies-panel">
      {enemies.map((e) => {
        const hasCombatStats = e.maxHp > 0
        const defeated = hasCombatStats && e.hp <= 0
        const hasLoot = defeated && e.loot?.length > 0
        return (
          <li key={e.name} className={`enemy-card${defeated ? ' enemy-defeated' : ''}`}>
            <div className="enemy-card-header">
              <strong>{e.name}</strong>
              <span className={`enemy-badge enemy-badge-${e.kind}`}>{e.kind}</span>
              {!e.hostile && <span className="enemy-badge enemy-badge-friendly">friendly</span>}
              {e.status && e.status !== 'active' && <span className="enemy-badge">{e.status}</span>}
            </div>
            {e.personality && <p className="enemy-personality">{e.personality}</p>}
            {(e.resistances?.length > 0 || e.vulnerabilities?.length > 0) && (
              <div className="enemy-damage-types">
                {e.resistances?.map((type) => (
                  <span key={`res-${type}`} className="enemy-badge enemy-badge-resist" title={`Resistant to ${type}`}>
                    {type} resist
                  </span>
                ))}
                {e.vulnerabilities?.map((type) => (
                  <span key={`vuln-${type}`} className="enemy-badge enemy-badge-vulnerable" title={`Vulnerable to ${type}`}>
                    {type} vulnerable
                  </span>
                ))}
              </div>
            )}
            {hasCombatStats && (
              <div className="hp-bar">
                <div className="hp-bar-fill" style={{ width: `${hpPercent(e.hp, e.maxHp)}%` }} />
                <span className="hp-bar-label">{defeated ? 'Defeated' : `HP: ${e.hp}/${e.maxHp}`}</span>
              </div>
            )}
            {hasLoot && (
              <button type="button" className="enemy-loot-button" disabled={disabled} onClick={() => onLoot(e.name)}>
                Loot ({e.loot.join(', ')})
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
