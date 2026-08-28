import { WebSocketServer } from 'ws'

export function createHub(server, { getSyncPayload, onMessage } = {}) {
  const wss = new WebSocketServer({ server, path: '/ws' })
  const clients = new Set()

  function send(ws, type, payload) {
    if (ws.readyState !== ws.OPEN) return
    ws.send(JSON.stringify({ type, payload }))
  }

  function broadcast(type, payload) {
    for (const ws of clients) send(ws, type, payload)
  }

  wss.on('connection', (ws) => {
    clients.add(ws)
    if (getSyncPayload) send(ws, 'sync', getSyncPayload())

    ws.on('message', (raw) => {
      if (!onMessage) return
      let msg
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        send(ws, 'error', { reason: 'Malformed message.' })
        return
      }
      onMessage(ws, msg)
    })

    ws.on('close', () => clients.delete(ws))
  })

  return { wss, clients, send, broadcast }
}
