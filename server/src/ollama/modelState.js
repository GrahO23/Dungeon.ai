import { config } from '../config.js'

let currentModel = config.ollamaModel

export function getCurrentModel() {
  return currentModel
}

export function setCurrentModel(model) {
  currentModel = model
}
