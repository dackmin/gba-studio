import path from 'node:path';
import fs from 'node:fs/promises';

import type { Build } from '../../../types';
import { getBuildDir, humanSize } from './utils';

const REGIONS = [{
  name: 'EWRAM',
  start: 0x02000000,
  size: 256 * 1024,
}, {
  name: 'IWRAM',
  start: 0x03000000,
  size: 32 * 1024,
}];

const SHF_ALLOC = 0x2;

// Reads the section header table of a 32-bit little-endian ELF
async function readSections (elfPath: string) {
  const file = await fs.open(elfPath, 'r');

  try {
    const header = Buffer.alloc(52);
    await file.read(header, 0, header.length, 0);

    const shoff = header.readUInt32LE(0x20);
    const shentsize = header.readUInt16LE(0x2e);
    const shnum = header.readUInt16LE(0x30);

    const table = Buffer.alloc(shentsize * shnum);
    await file.read(table, 0, table.length, shoff);

    return Array.from({ length: shnum }, (_, i) => {
      const base = i * shentsize;

      return {
        flags: table.readUInt32LE(base + 8),
        addr: table.readUInt32LE(base + 12),
        size: table.readUInt32LE(base + 20),
      };
    }).filter(s => (s.flags & SHF_ALLOC) && s.size > 0);
  } finally {
    await file.close();
  }
}

// Static usage per memory region, from the section headers of the linked ELF
export async function getMemoryUsage (build: Build, target: string) {
  const sections = await readSections(
    path.join(getBuildDir(build), target + '.elf'),
  );

  return REGIONS.map(region => {
    // Overlay sections share an address, so use the highest end rather than a sum
    const end = sections
      .filter(s => s.addr >= region.start && s.addr < region.start + region.size)
      .reduce((max, s) => Math.max(max, s.addr + s.size), region.start);
    const used = end - region.start;

    return { ...region, used, free: region.size - used };
  });
}

export async function logMemoryUsage (build: Build, target: string) {
  try {
    const regions = await getMemoryUsage(build, target);

    for (const { name, size, used, free } of regions) {
      const percent = ((used / size) * 100).toFixed(1);
      const detail = name === 'EWRAM' ? 'heap' : 'stack';

      if (free < 0) {
        build.events.onLog(
          `⚠️ ${name}: ${humanSize(used)} / ${humanSize(size)} static ` +
          `(${percent}%), over by ${humanSize(-free)}, the game will not boot`
        );
      } else {
        build.events.onLog(
          `${name}: ${humanSize(used)} / ${humanSize(size)} static ` +
          `(${percent}%), ~${humanSize(free)} left for ${detail}`
        );
      }
    }
  } catch {
    // Informational only, never fail the build over it
  }
}
