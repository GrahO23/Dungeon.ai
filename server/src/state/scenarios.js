import fs from 'node:fs'
import path from 'node:path'

export function listScenarios(scenariosDir) {
  if (!fs.existsSync(scenariosDir)) return []
  return fs
    .readdirSync(scenariosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifestPath = path.join(scenariosDir, entry.name, 'scenario.json')
      if (!fs.existsSync(manifestPath)) return null
      try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      } catch (err) {
        console.warn(`Skipping scenario "${entry.name}": invalid scenario.json (${err.message})`)
        return null
      }
    })
    .filter(Boolean)
}

export function scenarioExists(scenariosDir, slug) {
  return fs.existsSync(path.join(scenariosDir, slug, 'scenario.json'))
}

export function scenarioDir(scenariosDir, slug) {
  return path.join(scenariosDir, slug)
}
