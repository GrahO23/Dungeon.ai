export function connectWebSocket(onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const ws = new WebSocket(`${protocol}://${window.location.host}/ws`)

  ws.addEventListener('message', (event) => {
    try {
      onMessage(JSON.parse(event.data))
    } catch (err) {
      console.error('Failed to parse WS message', err)
    }
  })

  return ws
}
