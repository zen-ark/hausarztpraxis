// Simple Markdown post-processor

export function processMarkdown(content: string): string {
  let processed = content

  // Fix headings - ensure space after # and blank lines before/after
  processed = processed.replace(/^(#{1,6})([^#\s])/gm, '$1 $2')
  processed = processed.replace(/^(#{1,6}\s+[^\n]+)(\n[^#\n])/gm, '$1\n\n$2')
  processed = processed.replace(/([^\n])\n(#{1,6}\s+)/gm, '$1\n\n$2')

  // Fix inline headings (## in the middle of text)
  processed = processed.replace(/([^#\n])\s*#{2,}\s*([^#\n]+)/g, '$1\n\n## $2')
  
  // Fix headings that are concatenated without spaces
  processed = processed.replace(/^#{1,6}([^#\s\n])/gm, (match, p1) => {
    const level = match.length - 1
    return '#'.repeat(level) + ' ' + p1
  })

  // Fix inline numbered sequences - convert to proper ordered lists
  processed = processed.replace(/(\d+)\.\s+([^\n]+)(?:\n(\d+)\.\s+([^\n]+))+/g, (match) => {
    const lines = match.split('\n').filter(line => line.trim())
    const listItems = lines.map(line => {
      const match = line.match(/^(\d+)\.\s+(.+)$/)
      if (match) {
        return `1. ${match[2]}`
      }
      return line
    })
    return listItems.join('\n')
  })

  // Fix broken lists - convert hyphens to proper markdown lists
  processed = processed.replace(/^-\s+([^\n]+)(?:\n-\s+([^\n]+))+/gm, (match) => {
    const lines = match.split('\n').filter(line => line.trim())
    const listItems = lines.map(line => {
      const match = line.match(/^-\s+(.+)$/)
      if (match) {
        return `- ${match[1]}`
      }
      return line
    })
    return listItems.join('\n')
  })

  // Normalize bullets
  processed = processed.replace(/^\s*\*\s+/gm, '- ')

  // Fix duplicated ##
  processed = processed.replace(/^#{2,}\s*#{2,}/gm, '## ')

  // Join hard-wrapped mid-sentence lines
  processed = processed.replace(/([a-zäöüß])\n([a-zäöüß])/g, '$1 $2')

  // Clean up multiple blank lines
  processed = processed.replace(/\n{3,}/g, '\n\n')

  return processed
}