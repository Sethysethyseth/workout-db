/**
 * The smallest renderer the coach's answers need: paragraphs, "- " bullets,
 * and **bold**. Everything is built from React nodes - no HTML strings, so
 * nothing the model writes can become markup. An unclosed ** mid-stream
 * renders literally until its pair arrives.
 */

const BULLET_RE = /^\s*(?:[-*•])\s+/;

function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-b${i}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderLines(lines, keyPrefix) {
  const nodes = [];
  lines.forEach((line, i) => {
    if (i > 0) nodes.push(<br key={`${keyPrefix}-br${i}`} />);
    nodes.push(...renderInline(line, `${keyPrefix}-l${i}`));
  });
  return nodes;
}

export function CoachMarkdown({ text }) {
  if (!text) return null;
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) return null;
    const allBullets = lines.every((l) => BULLET_RE.test(l));
    if (allBullets) {
      return (
        <ul key={`b${bi}`} className="coach-md__list">
          {lines.map((l, li) => (
            <li key={`b${bi}-i${li}`}>{renderInline(l.replace(BULLET_RE, ""), `b${bi}-i${li}`)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={`b${bi}`} className="coach-md__p">
        {renderLines(lines, `b${bi}`)}
      </p>
    );
  });
}
