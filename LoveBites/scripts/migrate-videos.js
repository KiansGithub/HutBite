// scripts/migrate-videos.js  (ES module)
// -------------------------------------
import { createClient }      from '@supabase/supabase-js';
import { tmpdir as osTmp }   from 'os';
import { join }              from 'path';
import { mkdtemp, unlink,
         writeFile, readFile } from 'fs/promises';
import { spawn }  from 'child_process';
import ffmpegPath from 'ffmpeg-static';    // ← NEW

/* ─── your project creds ─── */
const SUPABASE_URL = 'https://tanexoecudctdtlmuqhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbmV4b2VjdWRjdGR0bG11cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzc2NTEsImV4cCI6MjA2NTkxMzY1MX0.t1GE9cjHsXwTDzDRWImLFY22CXctC9ikbQb39OyD75Y';     // **NOT** the anon key
/* ─────────────────────────── */

const BUCKET = 'videos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { headers: { 'x-application-name': 'video-migrator' } }
});

async function findMovFiles(prefix = '') {
    const { data, error } = await supabase
      .storage.from(BUCKET)
      .list(prefix, { limit: 1000 });          // 1000 = API max
    if (error) throw error;
  
    let keys = [];
  
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      const isFolder = entry.metadata === null;   // ✅ the reliable check
  
      if (isFolder) {
        // recurse into sub-folders
        keys.push(...await findMovFiles(path));
      } else if (entry.name.toLowerCase().endsWith('.mov')) {
        keys.push(path);
      }
    }
  
    return keys;
  }

async function transcode(movPath, mp4Path) {
  await new Promise((res, rej) => {
    spawn(ffmpegPath, [
      '-i', movPath,
      '-vf',  'format=yuv420p',
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '22',
      '-c:a', 'aac',
      '-b:a', '160k',
      '-movflags', '+faststart',
      mp4Path
    ], { stdio: 'inherit' })
      .on('close', code => code === 0 ? res() : rej(new Error(`ffmpeg exited with code ${code}`)));
  });
}

async function main() {
  const movKeys = await findMovFiles();
  if (!movKeys.length) {
    console.log('Nothing left to migrate 🎉');
    return;
  }

  for (const key of movKeys) {
    const base = key.replace(/\.mov$/i, '');
    const tmpDir = await mkdtemp(join(osTmp(), 'vid-'));
    const movPath = join(tmpDir, 'in.mov');
    const mp4Path = join(tmpDir, 'out.mp4');

    console.log(`▶  Processing ${key}`);

    // Download
    const { data: urlData, error: urlErr } = await supabase.storage.from(BUCKET).createSignedUrl(key, 60);
    if (urlErr) throw urlErr;

    const buf = Buffer.from(await fetch(urlData.signedUrl).then(r => r.arrayBuffer()));
    await writeFile(movPath, buf);

    // Transcode
    await transcode(movPath, mp4Path);

    // Upload .mp4
    const mp4Buf = await readFile(mp4Path);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(`${base}.mp4`, mp4Buf, {
      upsert: true,
      contentType: 'video/mp4'
    });
    if (upErr) throw upErr;

    // Delete .mov
    const { error: delErr } = await supabase.storage.from(BUCKET).remove([key]);
    if (delErr) throw delErr;

    // Clean up local temp files
    await unlink(movPath);
    await unlink(mp4Path);

    console.log(`✅  ${key} → ${base}.mp4`);
  }

  // Patch DB .mov URLs
  const { error: patchErr, count } = await supabase
    .from('menu_items')
    .update({ video_url: supabase.sql`REPLACE(video_url, '.mov', '.mp4')` })
    .like('video_url', '%.mov')
    .select('id', { count: 'exact', head: true });
  if (patchErr) throw patchErr;

  console.log(`🔧  Patched ${count ?? 0} DB rows`);
  console.log('🎉  Migration complete');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});