import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '~/db/client';
import { messages } from '~/db/schema';

export const prerender = false;

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');
const KNOWN_FIELDS = new Set(['type', 'name', 'email', 'phone', 'company', 'message', 'access_key', 'subject']);

const saveUpload = (file: File): string => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || '';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  return filename;
};

export const POST: APIRoute = async ({ request, redirect }) => {
  const referer = request.headers.get('referer') ?? '/iletisim';
  const redirectUrl = new URL(referer);

  try {
    const form = await request.formData();
    const type = String(form.get('type') ?? 'contact');
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();

    if (!name || !email) {
      redirectUrl.searchParams.set('error', '1');
      return redirect(redirectUrl.pathname + redirectUrl.search + redirectUrl.hash);
    }

    const meta: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (KNOWN_FIELDS.has(key)) continue;
      if (value instanceof File) {
        if (value.size > 0) {
          const filename = saveUpload(value);
          const buffer = Buffer.from(await value.arrayBuffer());
          fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
          meta[key] = `/uploads/${filename}`;
        }
      } else if (typeof value === 'string' && value.trim()) {
        meta[key] = value;
      }
    }

    db.insert(messages)
      .values({
        type,
        name,
        email,
        phone: (form.get('phone') as string) || null,
        company: (form.get('company') as string) || null,
        meta,
        message: (form.get('message') as string) || null,
        status: 'yeni',
        priority: 'orta',
        createdAt: new Date(),
      })
      .run();

    redirectUrl.searchParams.set('sent', '1');
    return redirect(redirectUrl.pathname + redirectUrl.search + redirectUrl.hash);
  } catch (err) {
    console.error('mesaj gönderimi başarısız:', err);
    redirectUrl.searchParams.set('error', '1');
    return redirect(redirectUrl.pathname + redirectUrl.search + redirectUrl.hash);
  }
};
