import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
import { connectWebSocket } from '../api/ws.js'
import { speak } from '../api/tts.js'
import { getModels, selectModel as selectModelRequest } from '../api/rest.js'

const GameContext = createContext(null)
const STORAGE_KEY = 'dungeonai:myCharacter'
const VOICE_STORAGE_KEY = 'dungeonai:voiceEnabled'

const initialState = {
  connected: false,
  characters: [],
  sessionStatus: 'setup',
  turnOrder: [],
  currentTurnIndex: 0,
  turnNumber: 0,
  currentScene: '',
  recentTurns: [],
  thinking: false,
  lastError: null,
  myCharacter: window.localStorage.getItem(STORAGE_KEY),
  voiceEnabled: window.localStorage.getItem(VOICE_STORAGE_KEY) !== 'false',
  model: '',
  availableModels: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'connected':
      return { ...state, connected: true }
    case 'disconnected':
      return { ...state, connected: false }
    case 'sync':
      return { ...state, ...action.payload, thinking: false }
    case 'roster:updated':
      return { ...state, characters: action.payload.characters }
    case 'session:started':
      return { ...state, ...action.payload }
    case 'turn:thinking':
      return { ...state, thinking: true }
    case 'turn:changed':
      return { ...state, currentTurnIndex: action.payload.currentTurnIndex, thinking: false }
    case 'narration:new':
      return {
        ...state,
        turnNumber: action.payload.turnNumber,
        recentTurns: [...state.recentTurns, action.payload].slice(-8),
        thinking: false,
      }
    case 'error':
    case 'error:not-your-turn':
      return { ...state, lastError: action.payload.reason, thinking: false }
    case 'claim':
      return { ...state, myCharacter: action.payload }
    case 'toggleVoice':
      return { ...state, voiceEnabled: !state.voiceEnabled }
    case 'model:changed':
      return { ...state, model: action.payload.model }
    case 'models:loaded':
      return { ...state, availableModels: action.payload.models, model: state.model || action.payload.current }
    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const wsRef = useRef(null)
  const voiceEnabledRef = useRef(state.voiceEnabled)

  useEffect(() => {
    voiceEnabledRef.current = state.voiceEnabled
    window.localStorage.setItem(VOICE_STORAGE_KEY, String(state.voiceEnabled))
  }, [state.voiceEnabled])

  useEffect(() => {
    getModels()
      .then(({ models, current }) => dispatch({ type: 'models:loaded', payload: { models, current } }))
      .catch((err) => console.warn('Failed to load Ollama models:', err))
  }, [])

  useEffect(() => {
    const ws = connectWebSocket((msg) => {
      dispatch(msg)
      if (msg.type === 'narration:new' && voiceEnabledRef.current) {
        speak(msg.payload.dmText)
      }
    })
    wsRef.current = ws
    ws.addEventListener('open', () => dispatch({ type: 'connected' }))
    ws.addEventListener('close', () => dispatch({ type: 'disconnected' }))
    return () => ws.close()
  }, [])

  const claimCharacter = useCallback((name) => {
    window.localStorage.setItem(STORAGE_KEY, name)
    dispatch({ type: 'claim', payload: name })
  }, [])

  const toggleVoice = useCallback(() => dispatch({ type: 'toggleVoice' }), [])

  const selectModel = useCallback((model) => selectModelRequest(model), [])

  const sendAction = useCallback(
    (text) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== ws.OPEN || !state.myCharacter) return
      ws.send(JSON.stringify({ type: 'player:action', payload: { character: state.myCharacter, text } }))
    },
    [state.myCharacter],
  )

  return (
    <GameContext.Provider value={{ ...state, claimCharacter, sendAction, toggleVoice, selectModel }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
