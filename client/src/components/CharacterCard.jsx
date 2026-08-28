export function CharacterCard({ character }) {
  return (
    <li className="character-card">
      <strong>{character.name}</strong> — {character.class} (Lv {character.level})
      <div className="hp-bar">
        HP: {character.hp}/{character.maxHp}
      </div>
    </li>
  )
}
