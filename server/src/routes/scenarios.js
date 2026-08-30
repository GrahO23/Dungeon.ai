import { Router } from 'express'
import { listScenarios } from '../state/scenarios.js'

export function createScenariosRouter({ scenariosDir }) {
  const router = Router()

  router.get('/scenarios', (req, res) => {
    res.json({ scenarios: listScenarios(scenariosDir) })
  })

  return router
}
