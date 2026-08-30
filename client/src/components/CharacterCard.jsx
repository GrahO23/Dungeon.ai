function hpPercent(hp, maxHp) {
  return maxHp ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0
}

export function CharacterCard({ character }) {
  return (
    <li className="character-card">
      <div className="character-card-header">
        <strong>{character.name}</strong>
        <span className="character-card-meta">
          {character.class} · Lv {character.level}
        </span>
      </div>
      <div className="hp-bar">
        <div className="hp-bar-fill" style={{ width: `${hpPercent(character.hp, character.maxHp)}%` }} />
        <span className="hp-bar-label">
          HP {character.hp}/{character.maxHp}
        </span>
      </div>
    </li>
  )
}
