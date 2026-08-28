const headingRegex = (heading) => new RegExp(`(^|\\n)## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, 'm')

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
