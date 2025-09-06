// scripts/list-movs.js  (run with: node scripts/list-movs.js)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tanexoecudctdtlmuqhr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbmV4b2VjdWRjdGR0bG11cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzc2NTEsImV4cCI6MjA2NTkxMzY1MX0.t1GE9cjHsXwTDzDRWImLFY22CXctC9ikbQb39OyD75Y'   // ⚠ service key if bucket is private
);

const BUCKET = 'videos';

const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: 2000 });
if (error) throw error;

console.log('Root-level list() result ↓\n');
for (const entry of data) {
  console.log(JSON.stringify(entry, null, 2));
}
