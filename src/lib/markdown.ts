import { marked } from 'marked';

export const renderMarkdown = (md: string | null | undefined): string =>
  md ? (marked.parse(md, { async: false }) as string) : '';
