import sharp from 'sharp';
import { config, requireDiscordConfig } from './config.js';
import {
  createApplicationEmoji,
  emojiToMention,
  listApplicationEmojis
} from './services/discordApplicationEmojis.js';
import { fetchAllCards } from './services/riftboundCards.js';
import {
  extractCardSymbolNames,
  symbolAssetCandidateUrls
} from './services/riftboundSymbols.js';

const EMOJI_SIZE = 128;

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function isSvg(buffer) {
  const text = buffer.slice(0, 512).toString('utf8').trimStart().toLowerCase();
  return text.startsWith('<svg') || text.startsWith('<?xml') || text.includes('<svg');
}

function isLikelyImage(buffer, contentType = '') {
  if (contentType.includes('image/svg')) return isSvg(buffer);
  if (contentType.startsWith('image/')) return !buffer.slice(0, 64).toString('utf8').includes('<HTML');

  return isSvg(buffer);
}

async function fetchSymbolImage(symbolName) {
  const errors = [];

  for (const url of symbolAssetCandidateUrls(symbolName)) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      const buffer = Buffer.from(await response.arrayBuffer());

      if (!isLikelyImage(buffer, contentType)) {
        throw new Error(`unexpected ${contentType || 'unknown'} response`);
      }

      return { buffer, url, isSvg: isSvg(buffer) };
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  throw new Error(errors.join('; '));
}

async function fetchSymbolPngDataUrl(symbolName) {
  const image = await fetchSymbolImage(symbolName);
  const png = await sharp(image.buffer, image.isSvg ? { density: EMOJI_SIZE * 2 } : {})
    .resize(EMOJI_SIZE, EMOJI_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  return {
    dataUrl: `data:image/png;base64,${png.toString('base64')}`,
    sourceUrl: image.url
  };
}

async function main() {
  requireDiscordConfig();

  const dryRun = hasFlag('--dry-run');
  const cards = await fetchAllCards({ forceRefresh: true });
  const symbolNames = extractCardSymbolNames(cards);
  const existingEmojis = await listApplicationEmojis({
    applicationId: config.discordClientId,
    token: config.discordToken
  });
  const existingNames = new Set(existingEmojis.map((emoji) => emoji.name));
  const missingNames = symbolNames.filter((name) => !existingNames.has(name));

  console.log(`Found ${symbolNames.length} Riftbound symbol(s) in card text.`);

  if (missingNames.length === 0) {
    console.log('All discovered Riftbound symbols already exist as application emojis.');
    return;
  }

  console.log(
    `${dryRun ? 'Would create' : 'Creating'} ${missingNames.length} missing application emoji(s): ` +
      missingNames.join(', ')
  );

  if (dryRun) return;

  const created = [];
  const failed = [];

  for (const name of missingNames) {
    try {
      const image = await fetchSymbolPngDataUrl(name);
      const emoji = await createApplicationEmoji({
        applicationId: config.discordClientId,
        token: config.discordToken,
        name,
        image: image.dataUrl
      });

      created.push(emoji);
      console.log(`Created ${emojiToMention(emoji)} from ${image.sourceUrl}`);
    } catch (error) {
      failed.push({ name, message: error.message });
      console.warn(`Failed to create ${name}: ${error.message}`);
    }
  }

  console.log(`Created ${created.length} application emoji(s).`);

  if (failed.length > 0) {
    console.log(`Failed ${failed.length} symbol(s):`);
    for (const failure of failed) {
      console.log(`- ${failure.name}: ${failure.message}`);
    }
    process.exitCode = 1;
  }
}

await main();
