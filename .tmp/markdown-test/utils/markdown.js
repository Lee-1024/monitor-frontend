export const stripThinkBlocks = (content) => {
    return String(content || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<\/?think>/gi, '')
        .trim();
};
export const escapeHtml = (content) => {
    return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
export const inlineMarkdown = (content) => {
    return escapeHtml(content)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');
};
export const formatMarkdown = (content) => {
    const sanitized = stripThinkBlocks(content);
    if (!sanitized)
        return '';
    const html = [];
    let listType = null;
    const closeList = () => {
        if (listType) {
            html.push(`</${listType}>`);
            listType = null;
        }
    };
    for (const rawLine of sanitized.split('\n')) {
        const line = rawLine.trim();
        if (!line) {
            closeList();
            continue;
        }
        const heading = line.match(/^(#{1,4})\s+(.+)$/);
        if (heading) {
            closeList();
            const marker = heading[1] || '';
            const text = heading[2] || '';
            const level = marker.length;
            html.push(`<h${level} class="markdown-h markdown-h${level}">${inlineMarkdown(text)}</h${level}>`);
            continue;
        }
        const ordered = line.match(/^\d+[.)]\s+(.+)$/);
        if (ordered) {
            if (listType !== 'ol') {
                closeList();
                listType = 'ol';
                html.push('<ol class="markdown-list">');
            }
            html.push(`<li>${inlineMarkdown(ordered[1] || '')}</li>`);
            continue;
        }
        const unordered = line.match(/^[-*]\s+(.+)$/);
        if (unordered) {
            if (listType !== 'ul') {
                closeList();
                listType = 'ul';
                html.push('<ul class="markdown-list">');
            }
            html.push(`<li>${inlineMarkdown(unordered[1] || '')}</li>`);
            continue;
        }
        closeList();
        html.push(`<p class="markdown-p">${inlineMarkdown(line)}</p>`);
    }
    closeList();
    return html.join('');
};
