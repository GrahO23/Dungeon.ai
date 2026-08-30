// No 'm' flag: $ must mean the true end of content, not the end of every
// line — otherwise a section is silently truncated at its first line break
// (both multi-line paragraphs, and any bullet list past its first item).
const headingRegex = (heading) => new RegExp(`(^|\\n)## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`)

export function getSection(content, heading) {
  const match = content.match(headingRegex(heading))
  return match ? match[2].trim() : ''
}

export function setSection(content, heading, sectionBody) {
  const block = `## ${heading}\n${sectionBody}\n`
  if (headingRegex(heading).test(content)) {
    return content.replace(headingRegex(heading), `$1${block}`).trim()
  }
  const separator = content.trim().length ? '\n\n' : ''
  return `${content.trim()}${separator}${block}`.trim()
}

export function removeSection(content, heading) {
  return content.replace(headingRegex(heading), '').trim()
}

export function getBullets(content, heading) {
  const section = getSection(content, heading)
  return section
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)
}

export function setBullets(content, heading, bullets) {
  return setSection(content, heading, bullets.map((b) => `- ${b}`).join('\n'))
}
