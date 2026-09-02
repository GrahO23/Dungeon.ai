// JSON Schemas for every structured LLM call in the game, passed straight
// through to Ollama's schema-constrained `format` field (or converted into a
// forced tool call for Claude — see anthropic/client.js#generateStructured).
// This is what makes the model's output structurally guaranteed to match,
// instead of relying on it voluntarily following a "wrap it in a fenced
// json block" prompt instruction.

// Only the fields the DM itself is allowed to author per DM_SYSTEM_PROMPT —
// inventory_remove/skills/spellSlots are resolver-only (actionResolver.js
// calls applyCharacterUpdate directly for those) and never appear here.
const CHARACTER_UPDATE_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    character: { type: 'string' },
    hp: { type: 'integer' },
    inventory_add: { type: 'array', items: { type: 'string' } },
    statusEffects_add: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, turnsRemaining: { type: 'integer' } },
        required: ['name'],
      },
    },
    abilities_add: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, level: { type: 'integer' }, description: { type: 'string' } },
        required: ['name', 'level', 'description'],
      },
    },
    status: { type: 'string' },
    note: { type: 'string' },
  },
  required: ['character'],
}

export const TURN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    narration: { type: 'string' },
    characterUpdates: { type: 'array', items: CHARACTER_UPDATE_ITEM_SCHEMA },
    sceneUpdate: { type: 'string' },
    locationUpdate: { type: 'string' },
    storyNote: { type: 'string' },
  },
  required: ['narration'],
}

const LOCATION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    connectsTo: { type: 'array', items: { type: 'string' } },
    questHook: { type: 'string' },
  },
  required: ['id', 'name', 'description', 'connectsTo'],
}

const NPC_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    kind: { type: 'string', enum: ['npc', 'enemy', 'boss'] },
    locationId: { type: 'string' },
    hostile: { type: 'boolean' },
    personality: { type: 'string' },
    backstory: { type: 'string' },
    hp: { type: 'integer' },
    maxHp: { type: 'integer' },
    ac: { type: 'integer' },
    attackBonus: { type: 'integer' },
    damageDice: { type: 'string' },
    loot: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'kind', 'locationId', 'hostile', 'personality', 'backstory'],
}

export const INTRO_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    narration: { type: 'string' },
    title: { type: 'string' },
    setting: { type: 'string' },
    factions: { type: 'array', items: { type: 'string' } },
    premise: { type: 'string' },
    mainQuest: { type: 'string' },
    plan: { type: 'array', items: { type: 'string' } },
    locations: { type: 'array', items: LOCATION_SCHEMA },
    startLocationId: { type: 'string' },
    scene: { type: 'string' },
    npcs: { type: 'array', items: NPC_SCHEMA },
  },
  required: [
    'narration',
    'title',
    'setting',
    'factions',
    'premise',
    'mainQuest',
    'plan',
    'locations',
    'startLocationId',
    'scene',
    'npcs',
  ],
}

export const INTENT_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['attack', 'skill-check', 'item-use', 'move', 'rest', 'loot', 'dialogue', 'other'],
    },
    target: { type: 'string' },
    skill: {
      type: 'string',
      enum: [
        '', 'persuasion', 'deception', 'intimidation', 'performance', 'stealth', 'acrobatics',
        'sleightOfHand', 'perception', 'insight', 'survival', 'medicine', 'animalHandling',
        'investigation', 'arcana', 'history', 'nature', 'religion', 'athletics',
      ],
    },
    item: { type: 'string' },
    ability: { type: 'string' },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
  },
  required: ['type', 'target', 'skill', 'item', 'ability', 'difficulty'],
}
