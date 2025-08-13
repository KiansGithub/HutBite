// scripts/migrate-videos.js  (ES module)
import { createClient } from '@supabase/supabase-js';
import { tmpdir as osTmp } from 'os';
import { join } from 'path';
import { mkdtemp, unlink, writeFile, readFile } from 'fs/promises';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const SUPABASE_URL = 'https://tanexoecudctdtlmuqhr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbmV4b2VjdWRjdGR0bG11cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzc2NTEsImV4cCI6MjA2NTkxMzY1MX0.t1GE9cjHsXwTDzDRWImLFY22CXctC9ikbQb39OyD75Y';          //   ← don't inline keys
const BUCKET       = 'videos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { headers: { 'x-application-name': 'video-migrator' } }
});

/* ──────────────────────────── helpers ─────────────────────────── */

async function findMovFiles(prefix = '') {
  const { data, error } = await supabase
    .storage.from(BUCKET)
    .list(prefix, { limit: 1000 });
  if (error) throw error;

  const keys = [];

  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    const isFolder = entry.metadata === null;  // folders have null metadata

    if (isFolder) {
      keys.push(...await findMovFiles(path));
    } else if (entry.name.toLowerCase().endsWith('.mov')) {      // 🟢  correct filter
      keys.push(path);
    }
  }
  return keys;
}

async function transcode(input, output) {
  await new Promise((resolve, reject) => {
    spawn(ffmpegPath, [
      '-i', input,
      '-profile:v', 'main', '-level:v', '4.0',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
      '-movflags', '+faststart',
      '-x264-params', 'keyint=48:min-keyint=48:scenecut=0',
      '-crf', '23', '-preset', 'medium',
      '-c:a', 'aac', '-b:a', '160k',
      output,
    ], { stdio: 'inherit' })
    .on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)));
  });
}

/* ──────────────────────────── main ─────────────────────────── */

async function main() {
  const movKeys = await findMovFiles();
  if (!movKeys.length) return console.log('Nothing left to migrate 🎉');

  for (const key of movKeys) {
    const stem   = key.replace(/\.mov$/i, '');   // e.g. path/foo
    const tmpDir = await mkdtemp(join(osTmp(), 'vid-'));
    const mov    = join(tmpDir, 'in.mov');
    const mp4    = join(tmpDir, 'out.mp4');

    console.log(`▶  ${key}`);

    // download
    const { data: { signedUrl } } =
      await supabase.storage.from(BUCKET).createSignedUrl(key, 300);
    const buf = Buffer.from(await fetch(signedUrl).then(r => r.arrayBuffer()));
    await writeFile(mov, buf);

    // transcode
    await transcode(mov, mp4);

    // upload
    const mp4Buf = await readFile(mp4);
    await supabase.storage.from(BUCKET).upload(`${stem}.mp4`, mp4Buf, {
      upsert: true,
      contentType: 'video/mp4',
    });

    // delete .mov
    await supabase.storage.from(BUCKET).remove([key]);

    await unlink(mov); await unlink(mp4);
    console.log(`✅  ${key} → ${stem}.mp4`);
  }

  // patch DB
  await supabase.rpc('replace_menu_item_ext', { from: '.mov', to: '.mp4' });
  console.log('🔧  DB paths patched');
}

main().catch(err => { console.error(err); process.exit(1); });
