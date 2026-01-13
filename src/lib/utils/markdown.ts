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

const renderInline = (value: string) => {
  let next = value;
  next = next.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  next = next.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  next = next.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  next = next.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return next;
};

export const renderMarkdown = (content: string) => {
  const escaped = escapeHtml(content);
  const codeBlocks: string[] = [];
  let interim = escaped.replace(/```([\s\S]*?)```/g, (_match, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `%%CODEBLOCK${index}%%`;
  });

  const blocks = interim.split(/\n{2,}/);
  let html = blocks
    .map((block) => {
      if (!block.trim()) {
        return '';
      }

      const lines = block.split('\n');
      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        const items = lines
          .map((line) => renderInline(line.replace(/^\s*[-*]\s+/, '')))
          .map((item) => `<li>${item}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
        const items = lines
          .map((line) => renderInline(line.replace(/^\s*\d+\.\s+/, '')))
          .map((item) => `<li>${item}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      }

      return `<p>${renderInline(lines.join('<br>'))}</p>`;
    })
    .join('');

  codeBlocks.forEach((block, index) => {
    html = html.replace(`%%CODEBLOCK${index}%%`, block);
  });

  return html;
};
