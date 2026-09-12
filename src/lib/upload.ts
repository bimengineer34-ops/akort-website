import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

export const saveUploadedFile = async (file: File): Promise<string> => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name) || '';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
};

/** File upload wins over the URL field when both are given; falls back to the existing value. */
export const resolveImage = async (
  form: FormData,
  fileField: string,
  urlField: string,
  existing?: string | null
): Promise<string | null> => {
  const file = form.get(fileField);
  if (file instanceof File && file.size > 0) return saveUploadedFile(file);
  const url = form.get(urlField);
  if (typeof url === 'string' && url.trim()) return url.trim();
  return existing ?? null;
};
