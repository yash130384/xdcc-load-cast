#!/usr/bin/env node

/**
 * scripts/cleanup-duplicates.js
 * 
 * Idempotent cleanup script to remove redundant duplicate media files
 * and rename incorrectly prefixed files on the INTENSO storage drive.
 * Also synchronizes .metadata_cache.json accordingly.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_FILE = path.join(os.homedir(), '.xdcc_downloader_config.json');

function getDownloadDir() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (cfg.downloadDir && fs.existsSync(cfg.downloadDir)) {
        return cfg.downloadDir;
      }
    } catch (e) {
      console.error('[Cleanup] Error reading config:', e.message);
    }
  }
  return '/media/yash/INTENSO';
}

const downloadDir = getDownloadDir();
console.log(`[Cleanup] Working with download directory: ${downloadDir}`);

const metadataCachePath = path.join(downloadDir, '.metadata_cache.json');
let metadataCache = {};
if (fs.existsSync(metadataCachePath)) {
  try {
    metadataCache = JSON.parse(fs.readFileSync(metadataCachePath, 'utf8'));
    console.log(`[Cleanup] Loaded metadata cache with ${Object.keys(metadataCache).length} items.`);
  } catch (e) {
    console.error('[Cleanup] Error loading metadata cache:', e.message);
  }
}

// Actions definitions
const tasks = [
  // 1. Ted Lasso S04E06: Remove redundant duplicate
  {
    name: 'Ted Lasso S04E06',
    cleanPath: path.join(downloadDir, 'Serien', 'Ted Lasso', 'Staffel 04', 'Ted Lasso (2020) DE - S04E06 - Vorsicht beim Springen!.mkv'),
    dirtyPath: path.join(downloadDir, 'Serien', 'Ted Lasso', 'Staffel 04', 'Ted Lasso (2020) DE - S04E06 - Ted Lasso (2020) DE - S04E06 - Vorsicht beim Springen!.mkv'),
    action: 'deduplicate' // delete dirty if clean exists; rename dirty to clean if clean missing
  },
  // 2. Ted Lasso S04E07: Rename clean
  {
    name: 'Ted Lasso S04E07',
    cleanPath: path.join(downloadDir, 'Serien', 'Ted Lasso', 'Staffel 04', 'Ted Lasso (2020) DE - S04E07 - Ja und, Baby.mkv'),
    dirtyPath: path.join(downloadDir, 'Serien', 'Ted Lasso', 'Staffel 04', 'Ted Lasso (2020) DE - S04E07 - Ted Lasso (2020) DE - S04E07 - Ja und, Baby.mkv'),
    action: 'deduplicate'
  },
  // 3. Widow's Bay S01E06: Rename clean
  {
    name: "Widow's Bay S01E06",
    cleanPath: path.join(downloadDir, 'Serien', "Widow's Bay", 'Staffel 01', "Widow's Bay (2026) DE - S01E06 - Unsere Geschichte.mkv"),
    dirtyPath: path.join(downloadDir, 'Serien', "Widow's Bay", 'Staffel 01', "Widow's Bay (2026) DE - S01E06 - Widow's Bay (2026) DE - S01E06 - Unsere Geschichte.mkv"),
    action: 'deduplicate'
  },
  // 4. True Detective S03E04: Rename clean
  {
    name: 'True Detective S03E04',
    cleanPath: path.join(downloadDir, 'Serien', 'True Detective', 'Staffel 03', 'True Detective (2014) DE - S03E04.mkv'),
    dirtyPath: path.join(downloadDir, 'Serien', 'True Detective', 'Staffel 03', 'True Detective (2014) DE - S03E04 - True Detective (2014) - S03E04.mkv'),
    action: 'deduplicate'
  }
];

let cacheModified = false;

for (const task of tasks) {
  const cleanExists = fs.existsSync(task.cleanPath);
  const dirtyExists = fs.existsSync(task.dirtyPath);

  const cleanRel = path.relative(downloadDir, task.cleanPath);
  const dirtyRel = path.relative(downloadDir, task.dirtyPath);
  const cleanBase = path.basename(task.cleanPath);
  const dirtyBase = path.basename(task.dirtyPath);

  console.log(`\n[Cleanup] Checking ${task.name}:`);
  console.log(`  Clean exists: ${cleanExists} (${task.cleanPath})`);
  console.log(`  Dirty exists: ${dirtyExists} (${task.dirtyPath})`);

  if (dirtyExists && cleanExists) {
    // Delete dirty file
    try {
      fs.unlinkSync(task.dirtyPath);
      console.log(`  -> GELÖSCHT: Redundantes Duplikat ${dirtyRel}`);
    } catch (e) {
      console.error(`  -> Fehler beim Löschen von ${dirtyRel}:`, e.message);
    }
    // Clean cache entries
    delete metadataCache[dirtyRel];
    delete metadataCache[dirtyBase];
    cacheModified = true;
  } else if (dirtyExists && !cleanExists) {
    // Rename dirty file to clean file
    try {
      fs.mkdirSync(path.dirname(task.cleanPath), { recursive: true });
      fs.renameSync(task.dirtyPath, task.cleanPath);
      console.log(`  -> UMBENANNT: ${dirtyRel} -> ${cleanRel}`);
    } catch (e) {
      console.error(`  -> Fehler beim Umbenennen von ${dirtyRel}:`, e.message);
    }
    // Update cache entries
    const existingMeta = metadataCache[dirtyRel] || metadataCache[dirtyBase] || {};
    delete metadataCache[dirtyRel];
    delete metadataCache[dirtyBase];
    metadataCache[cleanRel] = {
      ...existingMeta,
      title: path.parse(cleanBase).name
    };
    cacheModified = true;
  } else if (!dirtyExists && cleanExists) {
    console.log(`  -> Bereits im sauberen Zustand: ${cleanRel}`);
  } else {
    console.log(`  -> Keine Dateien für diesen Eintrag gefunden.`);
  }
}

if (cacheModified) {
  try {
    fs.writeFileSync(metadataCachePath, JSON.stringify(metadataCache, null, 2), 'utf8');
    console.log(`\n[Cleanup] Metadaten-Cache erfolgreich aktualisiert (${metadataCachePath}).`);
  } catch (e) {
    console.error('[Cleanup] Fehler beim Speichern des Metadaten-Caches:', e.message);
  }
} else {
  console.log('\n[Cleanup] Keine Cache-Änderungen erforderlich.');
}

console.log('[Cleanup] Bereinigung abgeschlossen.');
