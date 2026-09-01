import { CASTER_CLASSES } from '../utils/characterOptions.js'
import { modifier } from '../utils/stats.js'

const STAT_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha']

function abilityLevelLabel(level) {
  return level === 0 ? 'Cantrip' : `Lv ${level}`
}

export function CharacterSheet({ character }) {
  if (!character) return null

  const skills = Object.entries(character.skills ?? {}).filter(([, bonus]) => bonus)
  const statusEffects = character.statusEffects ?? []
  const abilities = character.abilities ?? []
  const spellSlots = Object.entries(character.spellSlots ?? {}).sort(([a], [b]) => Number(a) - Number(b))
  const abilitiesLabel = CASTER_CLASSES.has(character.class) ? 'Spellbook' : 'Special Moves'
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
        {spellSlots.map(([level, slot]) => (
          <span key={level}>
            L{level} Slots: {slot.current}/{slot.max}
          </span>
        ))}
      </div>

      {Object.keys(character.stats ?? {}).length > 0 && (
        <ul className="stats-list character-sheet-stats">
          {STAT_ORDER.filter((s) => character.stats[s] != null).map((s) => (
            <li key={s}>
              <span>{s.toUpperCase()}</span>
              <span className="stat-value">{character.stats[s]}</span>
              <span className="stat-mod">{modifier(character.stats[s])}</span>
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

      {abilities.length > 0 && (
        <div className="abilities-section">
          <div className="abilities-heading">{abilitiesLabel}</div>
          <ul className="abilities-list">
            {abilities.map((a) => (
              <li key={a.name} className="ability-badge" title={a.description}>
                {a.name} <span className="ability-level">{abilityLevelLabel(a.level)}</span>
              </li>
            ))}
          </ul>
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
