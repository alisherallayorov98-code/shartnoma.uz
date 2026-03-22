// AI Documents — Supabase CRUD helpers
import { supabase } from '@/lib/supabase'
import type { AiDocument } from '@/lib/types'

export async function saveAiDocument(
  params: Omit<AiDocument, 'id' | 'created_at'>
): Promise<AiDocument | null> {
  const { data, error } = await supabase
    .from('ai_documents')
    .insert([params])
    .select()
    .single()
  if (error) { console.error('saveAiDocument:', error.message); return null }
  return data as AiDocument
}

export async function loadAiDocuments(
  orgId: string,
  section: string
): Promise<AiDocument[]> {
  const { data, error } = await supabase
    .from('ai_documents')
    .select('*')
    .eq('organization_id', orgId)
    .eq('section', section)
    .order('created_at', { ascending: false })
  if (error) { console.error('loadAiDocuments:', error.message); return [] }
  return (data || []) as AiDocument[]
}

export async function updateAiDocument(
  id: string,
  content: string
): Promise<AiDocument | null> {
  const { data, error } = await supabase
    .from('ai_documents')
    .update({ content })
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('updateAiDocument:', error.message); return null }
  return data as AiDocument
}

export async function deleteAiDocument(id: string): Promise<boolean> {
  const { error } = await supabase.from('ai_documents').delete().eq('id', id)
  if (error) { console.error('deleteAiDocument:', error.message); return false }
  return true
}
