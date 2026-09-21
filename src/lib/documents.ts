import * as DocumentPicker from 'expo-document-picker';

import { supabase } from '@/lib/supabase';
import type { WorkerDocument } from '@/types/database';

const WORKER_DOCUMENTS_BUCKET = 'worker-documents';

export async function loadWorkerDocuments(workerId: string): Promise<WorkerDocument[]> {
  const { data, error } = await supabase
    .from('worker_documents')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('Failed to load worker documents:', error.message);
    return [];
  }
  return data ?? [];
}

/** Opens the document picker restricted to PDFs. Returns null if the user cancels. */
export async function pickPdfDocument(): Promise<DocumentPicker.DocumentPickerAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0];
}

/** Uploads a picked PDF to Storage and records it in worker_documents. */
export async function uploadWorkerDocument(workerId: string, asset: DocumentPicker.DocumentPickerAsset): Promise<WorkerDocument> {
  const path = `${workerId}/${Date.now()}-${asset.name}`;

  const formData = new FormData();
  formData.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf' } as unknown as Blob);

  const { error: uploadError } = await supabase.storage
    .from(WORKER_DOCUMENTS_BUCKET)
    .upload(path, formData, { contentType: asset.mimeType ?? 'application/pdf' });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(WORKER_DOCUMENTS_BUCKET).getPublicUrl(path);

  const { data, error: insertError } = await supabase
    .from('worker_documents')
    .insert({ worker_id: workerId, name: asset.name, file_url: publicUrlData.publicUrl, file_size: asset.size ?? null })
    .select()
    .single();
  if (insertError) throw insertError;

  return data;
}

export async function deleteWorkerDocument(doc: WorkerDocument): Promise<void> {
  const { error } = await supabase.from('worker_documents').delete().eq('id', doc.id);
  if (error) throw error;

  // Best-effort storage cleanup — the file URL always contains the bucket-relative path
  // after the bucket name, which is what `remove` needs.
  const marker = `/${WORKER_DOCUMENTS_BUCKET}/`;
  const idx = doc.file_url.indexOf(marker);
  if (idx !== -1) {
    const path = doc.file_url.slice(idx + marker.length);
    await supabase.storage.from(WORKER_DOCUMENTS_BUCKET).remove([path]);
  }
}
