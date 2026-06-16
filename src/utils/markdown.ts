type ListType = 'ul' | 'ol'

const isTableSeparator = (line: string): boolean => {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)
}

const isTableRow = (line: string): boolean => {
  return line.includes('|') && /^\|?.+\|.+\|?$/.test(line)
}

const splitTableRow = (line: string): string[] => {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

const renderTable = (headerLine: string, bodyLines: string[]): string => {
  const headers = splitTableRow(headerLine)
  const body = bodyLines
    .map((line) => {
      const cells = splitTableRow(line)
      return `<tr>${headers.map((_, index) => `<td>${inlineMarkdown(cells[index] || '')}</td>`).join('')}</tr>`
    })
    .join('')

  return [
    '<div class="markdown-table-wrap"><table class="markdown-table">',
    `<thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead>`,
    `<tbody>${body}</tbody>`,
    '</table></div>'
  ].join('')
}

const isTabTableRow = (line: string): boolean => {
  return line.includes('\t') && line.split('\t').filter((cell) => cell.trim()).length > 1
}

const splitTabTableRow = (line: string): string[] => {
  return line.split('\t').map((cell) => cell.trim())
}

const renderRowsTable = (headers: string[], rows: string[][]): string => {
  const body = rows
    .map((cells) => `<tr>${headers.map((_, index) => `<td>${inlineMarkdown(cells[index] || '')}</td>`).join('')}</tr>`)
    .join('')

  return [
    '<div class="markdown-table-wrap"><table class="markdown-table">',
    `<thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead>`,
    `<tbody>${body}</tbody>`,
    '</table></div>'
  ].join('')
}

export const stripThinkBlocks = (content: string | null | undefined): string => {
  return String(content || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim()
}

export const escapeHtml = (content: string): string => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const inlineMarkdown = (content: string): string => {
  return escapeHtml(content)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

export const formatMarkdown = (content: string | null | undefined): string => {
  const sanitized = stripThinkBlocks(content)
  if (!sanitized) return ''

  const html: string[] = []
  let listType: ListType | null = null

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  const lines = sanitized.split('\n')

  for (let index = 0; index < lines.length; index++) {
    const rawLine = lines[index] || ''
    const line = rawLine.trim()
    if (!line) {
      closeList()
      continue
    }

    if (isTabTableRow(line)) {
      const rows: string[][] = []
      let scanIndex = index
      while (scanIndex < lines.length) {
        const rowLine = (lines[scanIndex] || '').trim()
        if (!isTabTableRow(rowLine)) break
        rows.push(splitTabTableRow(rowLine))
        scanIndex += 1
      }

      if (rows.length > 1) {
        const headers = rows[0]
        const columnCount = headers?.length || 0
        const bodyRows = rows.slice(1).filter((row) => row.length === columnCount)
        if (headers && columnCount > 1 && bodyRows.length > 0) {
          closeList()
          html.push(renderRowsTable(headers, bodyRows))
          index = scanIndex - 1
          continue
        }
      }
    }

    const nextLine = (lines[index + 1] || '').trim()
    if (isTableRow(line) && isTableSeparator(nextLine)) {
      const bodyLines: string[] = []
      index += 2
      while (index < lines.length) {
        const row = (lines[index] || '').trim()
        if (!isTableRow(row) || isTableSeparator(row)) {
          index -= 1
          break
        }
        bodyLines.push(row)
        index += 1
      }

      closeList()
      html.push(renderTable(line, bodyLines))
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      closeList()
      const marker = heading[1] || ''
      const text = heading[2] || ''
      const level = marker.length
      html.push(`<h${level} class="markdown-h markdown-h${level}">${inlineMarkdown(text)}</h${level}>`)
      continue
    }

    const ordered = line.match(/^\d+[.)]\s+(.+)$/)
    if (ordered) {
      if (listType !== 'ol') {
        closeList()
        listType = 'ol'
        html.push('<ol class="markdown-list">')
      }
      html.push(`<li>${inlineMarkdown(ordered[1] || '')}</li>`)
      continue
    }

    const unordered = line.match(/^[-*]\s+(.+)$/)
    if (unordered) {
      if (listType !== 'ul') {
        closeList()
        listType = 'ul'
        html.push('<ul class="markdown-list">')
      }
      html.push(`<li>${inlineMarkdown(unordered[1] || '')}</li>`)
      continue
    }

    closeList()
    html.push(`<p class="markdown-p">${inlineMarkdown(line)}</p>`)
  }

  closeList()
  return html.join('')
}
