const STAT_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha']

function modifier(score) {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export function CharacterSheet({ character }) {
  if (!character) return null

  const skills = Object.entries(character.skills ?? {}).filter(([, bonus]) => bonus)
  const statusEffects = character.statusEffects ?? []
  const hpPct = character.maxHp ? Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100)) : 0

  return (
    <div className="character-sheet">
      <div className="character-sheet-header">
        <strong>{character.name}</strong>
        <span className="character-sheet-meta">
          {character.class} · Lv {character.level}
        </span>
      </div>

      <div className="hp-bar">
        <div className="hp-bar-fill" style={{ width: `${hpPct}%` }} />
        <span className="hp-bar-label">
          HP: {character.hp}/{character.maxHp}
        </span>
      </div>

      <div className="character-sheet-row">
        <span>AC: {character.ac ?? '?'}</span>
        <span>Luck: {character.luck ?? 0}</span>
        {character.equippedWeapon && <span>Weapon: {character.equippedWeapon}</span>}
      </div>

      {Object.keys(character.stats ?? {}).length > 0 && (
        <ul className="stats-list">
          {STAT_ORDER.filter((s) => character.stats[s] != null).map((s) => (
            <li key={s}>
              {s.toUpperCase()} {character.stats[s]} ({modifier(character.stats[s])})
            </li>
          ))}
        </ul>
      )}

      {skills.length > 0 && (
        <div className="skills-list">
          {skills.map(([name, bonus]) => (
            <span key={name} className="skill-badge">
              {name} +{bonus}
            </span>
          ))}
        </div>
      )}

      {statusEffects.length > 0 && (
        <div className="status-effects">
          {statusEffects.map((effect) => (
            <span key={effect.name} className="status-badge">
              {effect.name}
              {effect.turnsRemaining ? ` (${effect.turnsRemaining})` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
