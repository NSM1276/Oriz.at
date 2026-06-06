import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC = 'public';

// ── PRIME menu items mapping ──────────────────────────────────────
const PRIME_SRC = path.join(PUBLIC, 'PRIME Argentinian Steakhouse menu image');
const PRIME_DST = path.join(PUBLIC, 'items', 'prime-steakhouse');

const PRIME_MAP = {
  'Aperol_Spritz_in_wine_glass': 'aperol-spritz',
  'Avocado_rocket_salad': 'avocado-salat',
  'Beef_tartare_with_egg_yolk': 'rindstatar',
  'Beef_tenderloin_filet_mignon': 'filet-steak',
  'Braised_beef_ragout_red_wine': 'rinderfilet-ragout',
  'Caesar_salad_with_grilled_chicken': 'caesar-mit-huhn',
  'Caesar_salad_with_grilled_prawns': 'caesar-mit-shrimps',
  'Cheesecake_slice_on_dark_plate': 'cheesecake',
  'Chocolate_lava_cake_with_ice': 'schoko-lavakuchen',
  'Classic_beef_burger_on_board': 'homemade-burger',
  'Classic_Caesar_salad_dark_bowl': 'caesar-salat',
  'Cold_Pilsner_beer_in_glass': 'bier',
  'Crispy_buffalo_chicken_wings': 'buffalo-wings',
  'Crème_brülée_in_white_ramekin': 'creme-brulee',
  'Double_cheeseburger_hero_shot': 'cheeseburger',
  'Espresso_in_white_cup': 'espresso',
  'Filet_mignon_with_tiger_prawns': 'surf-turf',
  'Four_sauce_bowls_on_slate': 'saucen',
  'Gemüsesuppe': 'gemuesesuppe',
  'Glass_of_wine_steak': 'wein',
  'Greek_farmer_salad_rustic_bowl': 'bauernsalat',
  'Grilled_lamb_chops_on_slate': 'lammkoteletten',
  'Grilled_salmon_fillet_on_plate': 'gegrillter-lachs',
  'Homemade_beef_sausages_cast_iron': 'rindswurstel',
  'Massive_T-bone_steak_hero_shot': 't-bone-steak',
  'Mixed_green_salad_with_bread': 'gemischter-salat',
  'New_York_striploin_steak_medium': 'striploin',
  'Penne_arrabbiata_with_chili': 'pasta-arrabiata',
  'Philly_cheesesteak_sandwich': 'philly-cheese',
  'Rib-eye_steak_on_cast_iron': 'ribeye-steak',
  'Rindfleischsuppe': 'rindfleischsuppe',
  'Signature_prime_burger_hero_shot': 'prime-burger',
  'Slow-cooked_spareribs_on_board': 'spareribs',
  'Spaghetti_Bolognese_with_beef': 'spaghetti-bolognese',
  'Spaghetti_with_tomato_sauce': 'spaghetti-pomodoro',
  'Spirits_bottles_on_bar_shelf': 'spirituosen',
  'Tomahawk_ribeye_steak_on_board': 'tomahawk',
  'Tuna_steak_with_avocado_cream': 'thunfischsteak',
  'Wiener_Schnitzel_on_white_plate': 'wiener-schnitzel',
};

// ── Profile gallery mapping ───────────────────────────────────────
const GALLERY_SRC = path.join(PUBLIC, 'menu profile image');

const GALLERY_SLUGS = ['brasserie-lumiere', 'ristorante-tosca', 'sushi-schonbrunn'];

// ── Helpers ───────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function matchKey(filename, map) {
  for (const key of Object.keys(map)) {
    if (filename.startsWith(key)) return map[key];
  }
  return null;
}

async function compressItem(src, dst) {
  await sharp(src)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(dst);
  const before = Math.round(fs.statSync(src).size / 1024);
  const after = Math.round(fs.statSync(dst).size / 1024);
  console.log(`  ${path.basename(dst)}: ${before}KB → ${after}KB`);
}

async function compressGallery(src, dst) {
  await sharp(src)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dst);
  const before = Math.round(fs.statSync(src).size / 1024);
  const after = Math.round(fs.statSync(dst).size / 1024);
  console.log(`  ${path.basename(dst)}: ${before}KB → ${after}KB`);
}

// ── Process PRIME menu items ──────────────────────────────────────
async function processPrime() {
  ensureDir(PRIME_DST);
  console.log('\n📁 PRIME menu items → public/items/prime-steakhouse/');
  const files = fs.readdirSync(PRIME_SRC);
  for (const file of files) {
    const baseName = file.replace(/(_\d{15,})?\.jpe?g$/i, '').replace(/\.jpeg$/i, '');
    const newName = matchKey(baseName, PRIME_MAP);
    if (!newName) {
      console.log(`  ⚠️  No mapping for: ${file}`);
      continue;
    }
    const src = path.join(PRIME_SRC, file);
    const dst = path.join(PRIME_DST, `${newName}.jpg`);
    await compressItem(src, dst);
  }
}

// ── Process profile gallery ───────────────────────────────────────
async function processGallery() {
  console.log('\n📁 Profile gallery → public/gallery/{slug}/');
  const files = fs.readdirSync(GALLERY_SRC);

  for (const slug of GALLERY_SLUGS) {
    const dstDir = path.join(PUBLIC, 'gallery', slug);
    ensureDir(dstDir);
    const slugFiles = files
      .filter(f => f.startsWith(slug))
      .sort();

    let n = 1;
    for (const file of slugFiles) {
      const src = path.join(GALLERY_SRC, file);
      const dst = path.join(dstDir, `gallery-${n}.jpg`);
      await compressGallery(src, dst);
      n++;
    }
  }
}

// ── Run ───────────────────────────────────────────────────────────
(async () => {
  await processPrime();
  await processGallery();
  console.log('\n✅ Done. Old folders untouched — delete manually when satisfied.');
})();
