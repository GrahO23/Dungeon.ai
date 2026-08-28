import { Router } from 'express'

export const pingRouter = Router()

pingRouter.get('/ping', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() })
})
