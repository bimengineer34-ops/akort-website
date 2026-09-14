import { marked } from 'marked';

export const renderMarkdown = (md: string | null | undefined): string =>
  md ? (marked.parse(md, { async: false }) as string) : '';

export interface BodySection {
  title: string;
  html: string;
}

export interface ParsedBody {
  introTitle: string;
  introHtml: string;
  sections: BodySection[];
}

// Page "body" fields are written as "## Intro heading" + paragraphs, followed
// by one or more "### Subheading" sections (see scripts/seed.ts). Splitting on
// that structure lets the page render a numbered deep-dive instead of dumping
// the whole thing as one long, undifferentiated block of prose. Content that
// doesn't follow the pattern (no headings at all) still renders correctly —
// it just falls back to a single intro block with no numbered sections.
export const parseBodySections = (md: string | null | undefined): ParsedBody => {
  const html = renderMarkdown(md);
  if (!html) return { introTitle: '', introHtml: '', sections: [] };

  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const introTitle = h2Match ? h2Match[1] : '';
  const afterH2 = h2Match ? html.slice((h2Match.index ?? 0) + h2Match[0].length) : html;

  const h3Chunks = afterH2.split(/(?=<h3[^>]*>)/);
  const introHtml = h3Chunks[0] ?? '';
  const sections: BodySection[] = h3Chunks.slice(1).map((chunk) => {
    const m = chunk.match(/^<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*)$/);
    return { title: m?.[1] ?? '', html: m?.[2] ?? '' };
  });

  return { introTitle, introHtml, sections };
};
