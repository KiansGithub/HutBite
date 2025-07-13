// scripts/generate-thumbnails.js  (ES module)
import { createClient } from '@supabase/supabase-js';
import { tmpdir as osTmp } from 'os';
import { join } from 'path';
import { mkdtemp, unlink, writeFile, readFile } from 'fs/promises';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const SUPABASE_URL  = 'https://tanexoecudctdtlmuqhr.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbmV4b2VjdWRjdGR0bG11cWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzc2NTEsImV4cCI6MjA2NTkxMzY1MX0.t1GE9cjHsXwTDzDRWImLFY22CXctC9ikbQb39OyD75Y';          // never commit keys
const BUCKET        = 'videos';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { headers: { 'x-application': 'thumb-generator' } },
});

/* ─────────── list all .mp4 that still need thumbnails ────────── */
async function findTargetVideos(prefix = '') {
  const { data, error } = await supabase
    .storage.from(BUCKET)
    .list(prefix, { limit: 1000 });
  if (error) throw error;

  const targets = [];

  for (const entry of data) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    const isFolder = entry.metadata === null;
    if (isFolder) {
      targets.push(...await findTargetVideos(path));
    } else if (entry.name.toLowerCase().endsWith('.mp4')) {
      const jpgPath = path.replace(/\.mp4$/i, '.jpg');
      // probe bucket – skip if thumbnail already exists
      const { data: exists } = await supabase.storage.from(BUCKET).createSignedUrl(jpgPath, 1);
      if (!exists) targets.push(path);
    }
  }
  return targets;
}

/* ─────────── ffmpeg snapshot helper ────────── */
async function snapshot(inputFile, outputFile) {
  await new Promise((resolve, reject) => {
    spawn(ffmpegPath, [
      '-hide_banner',
      '-loglevel', 'error',
      '-ss', '00:00:01',        // seek 1 s in to avoid blank frames
      '-i', inputFile,
      '-vframes', '1',
      '-q:v', '3',              // quality ≈ 25 kB
      '-vf', 'scale=640:-2',    // max width 640 px, keep aspect
      outputFile,
    ], { stdio: 'inherit' })
      .on('close', code =>
        code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`)),
      );
  });
}

/* ─────────── main ────────── */
async function main() {
  const todo = await findTargetVideos();
  if (!todo.length) return console.log('All thumbnails already exist 🎉');

  console.log(`Need to create ${todo.length} thumbnails…`);

  for (const mp4Key of todo) {
    const jpgKey = mp4Key.replace(/\.mp4$/i, '.jpg');
    const tmpDir = await mkdtemp(join(osTmp(), 'thumb-'));

    const mp4Local = join(tmpDir, 'in.mp4');
    const jpgLocal = join(tmpDir, 'out.jpg');

    /* download video */
    const { data: { signedUrl } } =
      await supabase.storage.from(BUCKET).createSignedUrl(mp4Key, 300);
    const buf = Buffer.from(await fetch(signedUrl).then(r => r.arrayBuffer()));
    await writeFile(mp4Local, buf);

    /* make snapshot */
    await snapshot(mp4Local, jpgLocal);

    /* upload */
    const jpgBuf = await readFile(jpgLocal);
    await supabase.storage.from(BUCKET).upload(jpgKey, jpgBuf, {
      upsert: true,
      contentType: 'image/jpeg',
    });

    /* tidy */
    await unlink(mp4Local).catch(() => {});
    await unlink(jpgLocal).catch(() => {});

    console.log(`✅  ${jpgKey}`);
  }

  /* patch DB (requires you added thumb_url TEXT NULL) */
  const { error, count } = await supabase
    .from('menu_items')
    .update({ thumb_url: supabase.sql`REPLACE(video_url,'.mp4','.jpg')` })
    .is('thumb_url', null)                     // only rows missing it
    .select('id', { head: true, count: 'exact' });
  if (error) throw error;

  console.log(`🔧  Updated ${count ?? 0} DB rows`);
  console.log('🎉  Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
