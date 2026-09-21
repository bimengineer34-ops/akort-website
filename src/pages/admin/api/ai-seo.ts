import type { APIRoute } from 'astro';

export const prerender = false;

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `Sen bir mühendislik firmasının (AKORT Mühendislik) SEO metin yazarısın.
Sana bir sayfanın başlığı ve mevcut içeriği verilecek; bunlardan Türkçe, Google arama sonuçlarında görünecek
bir "meta açıklama" yazacaksın.

Kurallar:
- 140-160 karakter arası olsun.
- Verilen içerikte GEÇMEYEN hiçbir istatistik, rakam, müşteri adı veya iddia UYDURMA — sadece verilenden çıkar.
- Abartılı pazarlama dili kullanma; somut ve bilgilendirici yaz.
- Sadece açıklama metnini döndür — tırnak işareti, başlık, açıklama ekleme, başka hiçbir şey yazma.`;

// Protected by src/middleware.ts (any /admin/* route requires a session).
export const POST: APIRoute = async ({ request }) => {
  const jsonHeaders = { 'Content-Type': 'application/json' };
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY sunucuda tanımlı değil.' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  let payload: { title?: string; excerpt?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz istek.' }), { status: 400, headers: jsonHeaders });
  }

  const title = (payload.title ?? '').trim();
  if (!title) {
    return new Response(JSON.stringify({ error: 'Önce başlık girin.' }), { status: 400, headers: jsonHeaders });
  }
  const excerpt = (payload.excerpt ?? '').trim();
  const body = (payload.body ?? '').trim().slice(0, 2000);

  const userPrompt = [`Başlık: ${title}`, excerpt && `Özet: ${excerpt}`, body && `İçerik: ${body}`]
    .filter(Boolean)
    .join('\n\n');

  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
  } catch (err) {
    console.error('Anthropic API isteği başarısız:', err);
    return new Response(JSON.stringify({ error: 'AI servisine ulaşılamadı.' }), { status: 502, headers: jsonHeaders });
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error('Anthropic API hata yanıtı:', res.status, errText);
    return new Response(JSON.stringify({ error: `AI isteği başarısız oldu (${res.status}).` }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';

  if (!text) {
    return new Response(JSON.stringify({ error: 'AI boş yanıt döndürdü.' }), { status: 502, headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ text }), { headers: jsonHeaders });
};
