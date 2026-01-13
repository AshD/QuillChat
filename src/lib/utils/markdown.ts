// Escape critical HTML characters so user content is safe to render.
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });

// Convert inline markdown tokens (code, bold, italics, links) into HTML.
const renderInline = (value: string) => {
  let next = value;
  // Inline code spans.
  next = next.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // Bold text.
  next = next.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic text.
  next = next.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  // Links with explicit URL.
  next = next.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return next;
};

export const renderMarkdown = (content: string) => {
  // Start by escaping HTML so markdown processing is safe.
  const escaped = escapeHtml(content);
  // Temporarily stash fenced code blocks so they aren't modified by inline parsing.
  const codeBlocks: string[] = [];
  let interim = escaped.replace(/```([\s\S]*?)```/g, (_match, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `%%CODEBLOCK${index}%%`;
  });

  // Split into blocks separated by blank lines and render block-level structures.
  const blocks = interim.split(/\n{2,}/);
  let html = blocks
    .map((block) => {
      if (!block.trim()) {
        return '';
      }

      const lines = block.split('\n');
      // Unordered list handling.
      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        const items = lines
          .map((line) => renderInline(line.replace(/^\s*[-*]\s+/, '')))
          .map((item) => `<li>${item}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      // Ordered list handling.
      if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
        const items = lines
          .map((line) => renderInline(line.replace(/^\s*\d+\.\s+/, '')))
          .map((item) => `<li>${item}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      }

      // Fallback to paragraph with line breaks.
      return `<p>${renderInline(lines.join('<br>'))}</p>`;
    })
    .join('');

  // Restore the code blocks after other formatting is complete.
  codeBlocks.forEach((block, index) => {
    html = html.replace(`%%CODEBLOCK${index}%%`, block);
  });

  return html;
};
