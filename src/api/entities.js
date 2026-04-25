import { supabase } from './supabaseClient';

function getMessage(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return error.message || error.details || String(error);
}

function isMissingColumnError(error, column) {
  const message = getMessage(error).toLowerCase();
  return Boolean(
    column &&
    message.includes(column.toLowerCase()) &&
    (message.includes('column') ||
      message.includes('schema cache') ||
      message.includes('does not exist') ||
      message.includes('could not find'))
  );
}

export function getErrorMessage(error, fallback = 'Something went wrong.') {
  const message = getMessage(error);
  if (!message) return fallback;

  if (message.toLowerCase().includes('row-level security')) {
    return 'Supabase blocked this with row-level security. Run the Supabase setup SQL or add an authenticated policy for this table/bucket.';
  }

  return message;
}

function parseSort(sort) {
  if (!sort) return { column: 'created_date', ascending: false };
  const ascending = !sort.startsWith('-');
  const column = sort.replace(/^-/, '');
  return { column, ascending };
}

function getStoragePath(file, userId) {
  const rawExt =
    file.name.match(/\.([^.]+)$/)?.[1] ||
    file.type.split('/')[1] ||
    'bin';
  const ext = rawExt.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  const baseName =
    file.name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'upload';

  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${baseName}.${ext}`;
}

function createEntity(tableName) {
  return {
    async list(sort, limit) {
      const { column, ascending } = parseSort(sort);

      const runQuery = async (withSort) => {
        let query = supabase.from(tableName).select('*');
        if (withSort && column) query = query.order(column, { ascending });
        if (limit) query = query.limit(limit);
        return query;
      };

      let { data, error } = await runQuery(true);
      if (error && isMissingColumnError(error, column)) {
        ({ data, error } = await runQuery(false));
      }

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
      const payload = { ...data, updated_date: new Date().toISOString() };
      let { data: result, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();

      if (error && isMissingColumnError(error, 'updated_date')) {
        const { updated_date: _drop, ...retryPayload } = payload;
        ({ data: result, error } = await supabase
          .from(tableName)
          .insert(retryPayload)
          .select()
          .single());
      }

      if (error) throw error;
      return result;
    },

    async update(id, data) {
      const { updated_date: _drop, ...rest } = data;
      const payload = { ...rest, updated_date: new Date().toISOString() };
      let { data: result, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error && isMissingColumnError(error, 'updated_date')) {
        const { updated_date: _omit, ...retryPayload } = payload;
        ({ data: result, error } = await supabase
          .from(tableName)
          .update(retryPayload)
          .eq('id', id)
          .select()
          .single());
      }

      if (error) throw error;
      return result;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function normalizeMediaAsset(asset) {
  if (!asset) return asset;
  return {
    ...asset,
    file_url: asset.url || asset.file_url || '',
  };
}

function createMediaEntity() {
  const entity = createEntity('media');

  return {
    ...entity,

    async list(sort, limit) {
      const data = await entity.list(sort, limit);
      return data.map(normalizeMediaAsset);
    },

    async filter(filters) {
      const data = await entity.filter(filters);
      return data.map(normalizeMediaAsset);
    },

    async create(data) {
      const { file_url, thumbnail_url: _thumbnailUrl, tags: _tags, updated_date: _updatedDate, ...rest } = data;
      const result = await entity.create({
        ...rest,
        url: rest.url || file_url,
      });
      return normalizeMediaAsset(result);
    },

    async update(id, data) {
      const { file_url, thumbnail_url: _thumbnailUrl, tags: _tags, updated_date: _updatedDate, ...rest } = data;
      const result = await entity.update(id, {
        ...rest,
        url: rest.url || file_url,
      });
      return normalizeMediaAsset(result);
    },
  };
}

export const Song = createEntity('songs');
export const Presentation = createEntity('presentations');
export const ScriptureBookmark = createEntity('scripture');
export const MediaAsset = createMediaEntity();

export async function uploadFile({ file }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error('Your Supabase session expired. Sign out, sign back in, and try uploading again.');
  }

  const path = getStoragePath(file, userData.user.id);
  const { error } = await supabase.storage.from('media').upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'The file could not be uploaded.'), { cause: error });
  }

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
  return { url: publicUrl, file_url: publicUrl, size: file.size };
}
