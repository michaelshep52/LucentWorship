import { supabase } from './supabaseClient';

function parseSort(sort) {
  if (!sort) return { column: 'created_date', ascending: false };
  const ascending = !sort.startsWith('-');
  const column = sort.replace(/^-/, '');
  return { column, ascending };
}

function createEntity(tableName) {
  return {
    async list(sort, limit) {
      const { column, ascending } = parseSort(sort);
      let query = supabase.from(tableName).select('*').order(column, { ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(filters) {
      let query = supabase.from(tableName).select('*');
      for (const [key, val] of Object.entries(filters)) {
        query = query.eq(key, val);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async create(data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert({ ...data, updated_date: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async update(id, data) {
      const { updated_date: _drop, ...rest } = data;
      const { data: result, error } = await supabase
        .from(tableName)
        .update({ ...rest, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

export const Song = createEntity('songs');
export const Presentation = createEntity('presentations');
export const ScriptureBookmark = createEntity('scripture_bookmarks');
export const MediaAsset = createEntity('media_assets');

export async function uploadFile({ file }) {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
  return { file_url: publicUrl };
}
