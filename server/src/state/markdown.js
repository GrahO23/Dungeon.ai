import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export function readMarkdown(filePath, defaults = { data: {}, content: '' }) {
  if (!fs.existsSync(filePath)) return defaults
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  return { data, content: content.trim() }
}

export function writeMarkdown(filePath, data, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const raw = matter.stringify(`${content}\n`, data)
  fs.writeFileSync(filePath, raw, 'utf8')
}

export function appendToFile(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.appendFileSync(filePath, text, 'utf8')
}
