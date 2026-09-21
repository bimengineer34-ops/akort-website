import type { APIRoute } from 'astro';
import { saveUploadedFile } from '~/lib/upload';

export const prerender = false;

// Protected by src/middleware.ts (any /admin/* route requires a session).
// Used by MarkdownEditor's "Görsel Ekle" toolbar button to upload an image
// and get back a URL to insert as Markdown, without submitting the whole form.
export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return new Response(JSON.stringify({ error: 'Dosya bulunamadı.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!file.type.startsWith('image/')) {
    return new Response(JSON.stringify({ error: 'Sadece görsel dosyaları yüklenebilir.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = await saveUploadedFile(file);
  return new Response(JSON.stringify({ url }), { headers: { 'Content-Type': 'application/json' } });
};
