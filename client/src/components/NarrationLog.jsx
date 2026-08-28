export function NarrationLog({ turns }) {
  return (
    <div className="narration-log">
      {turns.map((turn) => (
        <div key={turn.turnNumber} className="turn-entry">
          <p className="player-line">
            <strong>{turn.character}:</strong> {turn.playerText}
          </p>
          <p className="dm-line">{turn.dmText}</p>
        </div>
      ))}
    </div>
  )
}
