import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tanexoecudctdtlmuqhr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbmV4b2VjdWRjdGR0bG11cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzc2NTEsImV4cCI6MjA2NTkxMzY1MX0.t1GE9cjHsXwTDzDRWImLFY22CXctC9ikbQb39OyD75Y',
);
const BUCKET = 'videos';

async function listRecursive(prefix = '') {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw error;

  const keys = [];
  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    const isFolder = entry.metadata === null;
    if (isFolder) keys.push(...await listRecursive(path));
    else if (entry.name.toLowerCase().endsWith('.mp4.mp4')) keys.push(path);
  }
  return keys;
}

(async () => {
  const badKeys = await listRecursive();
  if (!badKeys.length) return console.log('No .mp4.mp4 objects found.');

  for (const oldKey of badKeys) {
    const newKey = oldKey.replace(/\.mp4\.mp4$/i, '.mp4');
    console.log(`🔄  ${oldKey} → ${newKey}`);

    // Supabase Storage has no pure “rename”; copy then delete.
    const { error: copyErr } = await supabase.storage.from(BUCKET).copy(oldKey, newKey);
    if (copyErr) throw copyErr;

    const { error: delErr } = await supabase.storage.from(BUCKET).remove([oldKey]);
    if (delErr) throw delErr;
  }

  // update DB
  const { error } = await supabase
    .from('menu_items')
    .update({ video_url: supabase.sql`REPLACE(video_url, '.mp4.mp4', '.mp4')` })
    .like('video_url', '%.mp4.mp4');
  if (error) throw error;

  console.log(`🎉  Fixed ${badKeys.length} objects and patched DB rows`);
})();
