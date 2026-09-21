import { supabase } from '@/lib/supabase';

/** Uploads a locally-picked image (from expo-image-picker) to a Supabase Storage bucket and returns its public URL. */
export async function uploadImageAsync(bucket: string, uri: string, pathPrefix: string): Promise<string> {
  const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
  const path = `${pathPrefix}/${Date.now()}.${extension}`;

  const formData = new FormData();
  formData.append('file', { uri, name: path, type: contentType } as unknown as Blob);

  const { error } = await supabase.storage.from(bucket).upload(path, formData, { contentType });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
