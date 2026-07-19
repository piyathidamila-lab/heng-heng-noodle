import { getSupabaseAdmin } from './supabase-admin';

// ----------------------------------------------------------------------

const BUCKET = 'menu-images';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class ImageUploadError extends Error {}

/** Uploads a menu item photo and returns its public URL. */
export async function uploadMenuImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError('รองรับเฉพาะไฟล์รูปภาพ JPEG, PNG, WEBP หรือ GIF');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageUploadError('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
  }

  const supabase = getSupabaseAdmin();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

/** Best-effort cleanup of a previously uploaded menu item photo. */
export async function deleteMenuImage(imageUrl: string): Promise<void> {
  const path = imageUrl.split(`/${BUCKET}/`).pop();
  if (!path) return;

  const supabase = getSupabaseAdmin();
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Uploads the store logo to a dedicated folder in the existing public image bucket. */
export async function uploadShopLogo(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError('รองรับเฉพาะไฟล์รูปภาพ JPEG, PNG, WEBP หรือ GIF');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageUploadError('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
  }

  const supabase = getSupabaseAdmin();
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `shop-logos/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteShopLogo(logoUrl: string): Promise<void> {
  await deleteMenuImage(logoUrl);
}
