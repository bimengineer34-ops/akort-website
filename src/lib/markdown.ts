import { marked } from 'marked';

export const renderMarkdown = (md: string | null | undefined): string =>
  md ? (marked.parse(md, { async: false }) as string) : '';

export interface BodySubItem {
  title: string;
  description: string;
}

export interface BodySection {
  title: string;
  html: string;
  items: BodySubItem[];
}

export interface ParsedBody {
  introTitle: string;
  introHtml: string;
  sections: BodySection[];
}

// Splits a section's remaining HTML on "#### Sub-item" boundaries (marked's
// output for a markdown "####"). The part before the first h4 is the
// section's own lead-in text; each h4 onward becomes a titled sub-item,
// rendered as its own row in a bordered breakdown card. Optional — a section
// with no h4s just gets an empty items array and renders as before.
const splitSubItems = (sectionHtml: string): { html: string; items: BodySubItem[] } => {
  const h4Chunks = sectionHtml.split(/(?=<h4[^>]*>)/);
  const html = h4Chunks[0] ?? '';
  const items: BodySubItem[] = h4Chunks.slice(1).map((chunk) => {
    const m = chunk.match(/^<h4[^>]*>([\s\S]*?)<\/h4>([\s\S]*)$/);
    return { title: m?.[1] ?? '', description: m?.[2] ?? '' };
  });
  return { html, items };
};

// Page "body" fields are written as "## Intro heading" + paragraphs, followed
// by one or more "### Subheading" sections (see scripts/seed.ts), each
// optionally broken down further into "#### Sub-item" items. Splitting on
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
    const { html: sectionHtml, items } = splitSubItems(m?.[2] ?? '');
    return { title: m?.[1] ?? '', html: sectionHtml, items };
  });

  return { introTitle, introHtml, sections };
};
