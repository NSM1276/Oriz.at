import sharp from 'sharp';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://btydsogglgrtldfiezfu.supabase.co';
const SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0eWRzb2dnbGdydGxkZmllemZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY5ODUxOSwiZXhwIjoyMDk0Mjc0NTE5fQ.6oKAU6Bpv8zl06dWylEz-oIEB1nTjD5DqvTdN23v13U';
const BUCKET = 'item-images';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

/** Convert accented/special chars to ASCII slug for storage keys */
function toStorageSlug(name) {
  return name
    .normalize('NFD')                        // decompose accents
    .replace(/[̀-ͯ]/g, '')         // strip combining marks
    .replace(/['']/g, '')                    // strip apostrophes
    .replace(/[^a-zA-Z0-9 \-_]/g, '')       // strip remaining non-ASCII
    .trim()
    .replace(/\s+/g, '-')                    // spaces → hyphens
    .toLowerCase();
}

// Only re-run brasserie (tosca already done ✅)
const VENUES = [
  {
    slug: 'brasserie-lumiere',
    folder: 'C:/Users/User/Documents/mein website/NEW/ORIZ/public/BRASSERIE LUMIÈRE',
    storagePrefix: 'brasserie-lumiere',
  },
];

async function getVenueId(slug) {
  const { data, error } = await supabase.from('venues').select('id').eq('slug', slug).single();
  if (error) throw new Error(`Venue not found: ${slug} — ${error.message}`);
  return data.id;
}

async function processVenue({ slug, folder, storagePrefix }) {
  console.log(`\n=== ${slug} ===`);
  const venueId = await getVenueId(slug);
  const files = await readdir(folder);

  let ok = 0,
    fail = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.jfif', '.webp'].includes(ext)) continue;

    const itemName = path.basename(file, ext);
    const storageSlug = toStorageSlug(itemName);
    const storagePath = `${storagePrefix}/${storageSlug}.webp`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;

    try {
      // Compress with sharp
      const srcPath = path.join(folder, file);
      const raw = await readFile(srcPath);
      const compressed = await sharp(raw)
        .resize(600, 440, { fit: 'cover', position: 'centre' })
        .webp({ quality: 82 })
        .toBuffer();

      const sizeBefore = raw.length;
      const sizeAfter = compressed.length;
      console.log(
        `  ${file}  ${Math.round(sizeBefore / 1024)}KB → ${Math.round(sizeAfter / 1024)}KB`,
      );

      // Upload to Supabase Storage (upsert)
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, compressed, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) {
        console.error(`  ❌ Upload failed: ${uploadError.message}`);
        fail++;
        continue;
      }

      // Update DB: find item by name (case-insensitive) and venue_id
      const { data: items, error: findError } = await supabase
        .from('items')
        .select('id, name')
        .eq('venue_id', venueId)
        .ilike('name', itemName);

      if (findError || !items?.length) {
        console.warn(`  ⚠️  Item not found in DB: "${itemName}" (venue: ${slug})`);
        ok++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('items')
        .update({ image_url: publicUrl })
        .eq('id', items[0].id);

      if (updateError) {
        console.error(`  ❌ DB update failed: ${updateError.message}`);
        fail++;
      } else {
        console.log(`  ✅ "${items[0].name}" → DB updated`);
        ok++;
      }
    } catch (e) {
      console.error(`  ❌ Error on ${file}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n  ${slug}: ✅ ${ok}  ❌ ${fail}`);
}

for (const venue of VENUES) {
  await processVenue(venue);
}

console.log('\nDone!');
