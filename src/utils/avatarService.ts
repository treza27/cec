import { supabase } from './supabase';

const BUCKET = 'avatars';
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error('La taille du fichier ne doit pas dépasser 5 Mo.');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.');
  }

  const ext = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('employees')
    .update({ profile_picture_url: data.publicUrl, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Erreur lors de la mise à jour du profil: ${updateError.message}`);
  }

  return data.publicUrl;
}

export async function deleteAvatar(userId: string): Promise<void> {
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  for (const ext of extensions) {
    await supabase.storage.from(BUCKET).remove([`${userId}/avatar.${ext}`]);
  }

  const { error } = await supabase
    .from('employees')
    .update({ profile_picture_url: null, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
}
