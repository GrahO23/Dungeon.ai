export function TurnBanner({ currentCharacter, myCharacter, thinking }) {
  if (thinking) {
    return <div className="turn-banner thinking">The DM is thinking…</div>
  }
  const isMine = currentCharacter === myCharacter
  return (
    <div className={`turn-banner${isMine ? ' mine' : ''}`}>
      {isMine ? `It's your turn, ${myCharacter}` : `Waiting for ${currentCharacter}…`}
    </div>
  )
}
