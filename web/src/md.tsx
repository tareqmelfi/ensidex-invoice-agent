import type { ReactNode } from "react";
// Minimal, safe Markdown renderer for chat replies: **bold**, *italic*, `code`, [links](url), bare URLs, bullet/numbered lists, headings.
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)]+)|\*([^*\s][^*]*)\*)/g;
  let last = 0, m: RegExpExecArray | null, n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[2]) out.push(<strong key={k}>{m[2]}</strong>);
    else if (m[3]) out.push(<code key={k}>{m[3]}</code>);
    else if (m[4]) out.push(<a key={k} href={m[5]} target="_blank" rel="noreferrer">{m[4]}</a>);
    else if (m[6]) out.push(<a key={k} href={m[6]} target="_blank" rel="noreferrer">{m[6].length > 48 ? m[6].slice(0, 45) + "…" : m[6]}</a>);
    else if (m[7]) out.push(<em key={k}>{m[7]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: ReactNode[] } | null = null;
  const flush = () => { if (list) { blocks.push(list.ordered ? <ol key={blocks.length}>{list.items}</ol> : <ul key={blocks.length}>{list.items}</ul>); list = null; } };
  text.split("\n").forEach((raw, i) => {
    const line = raw.trimEnd();
    const li = line.match(/^\s*(?:([-*•])|(\d+)[.)])\s+(.*)$/);
    if (li) {
      const ordered = !!li[2];
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push(<li key={i}>{inline(li[3], `l${i}`)}</li>);
      return;
    }
    flush();
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) blocks.push(<p key={i} className="h">{inline(h[1], `h${i}`)}</p>);
    else if (line.trim()) blocks.push(<p key={i}>{inline(line, `p${i}`)}</p>);
  });
  flush();
  return <>{blocks}</>;
}
