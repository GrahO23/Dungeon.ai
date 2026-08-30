export function NarrationLog({ turns }) {
  return (
    <div className="narration-log">
      {turns.map((turn) => (
        <div key={turn.turnNumber} className="turn-entry">
          {turn.playerText && (
            <p className="player-line">
              <strong>{turn.character}:</strong> {turn.playerText}
            </p>
          )}
          {turn.rollText && <p className="roll-line">🎲 {turn.rollText}</p>}
          <p className="dm-line">{turn.dmText}</p>
        </div>
      ))}
    </div>
  )
}
