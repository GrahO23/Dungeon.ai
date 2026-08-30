function formatMs(ms) {
  return `${(ms / 1000).toFixed(1)}s`
}

function TimingLine({ turn }) {
  if (turn.llmMs == null && turn.serverMs == null) return null
  return (
    <p className="timing-line">
      {turn.llmMs != null && <span>LLM {formatMs(turn.llmMs)}</span>}
      {turn.serverMs != null && <span>Server {formatMs(turn.serverMs)}</span>}
      {turn.speechMs != null && <span>Speech {formatMs(turn.speechMs)}</span>}
    </p>
  )
}

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
          <TimingLine turn={turn} />
        </div>
      ))}
    </div>
  )
}
