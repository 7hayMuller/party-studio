import { supabase } from '../lib/supabase';

const BUCKET = 'event-media';

export async function uploadMediaFile(
  localUri: string,
  folder: 'music' | 'video' | 'image',
): Promise<string> {
  if (!localUri || localUri.startsWith('http')) return localUri;

  const ext = localUri.split('.').pop()?.split('?')[0]
    ?? (folder === 'music' ? 'mp3' : folder === 'video' ? 'mp4' : 'jpg');
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true });

  if (error) throw new Error(`Falha ao enviar ${folder}: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}
