import path from 'node:path';
import fsp from 'node:fs/promises';

import { Uint8ArrayReader, ZipReader } from '@zip.js/zip.js';
import * as tar from 'tar';

export const ARCHIVE_EXTENSIONS = ['zip', 'tar.gz', 'tgz', 'tar'];

const MAX_TOTAL_SIZE = 200 * 1024 * 1024;

export const isArchive = (filePath: string) => {
  const name = filePath.toLowerCase();

  return ARCHIVE_EXTENSIONS.some(ext => name.endsWith(`.${ext}`));
};

const resolveEntry = (dest: string, name: string) => {
  const target = path.resolve(dest, name.replace(/\\/g, '/'));

  if (
    path.isAbsolute(name) ||
    (target !== dest && !target.startsWith(dest + path.sep))
  ) {
    throw new Error(`Unsafe path in archive: ${name}`);
  }

  return target;
};

export const extractZip = async (file: string, dest: string) => {
  const root = path.resolve(dest);
  const reader = new ZipReader(new Uint8ArrayReader(await fsp.readFile(file)));
  let total = 0;

  try {
    const entries = await reader.getEntries();

    await fsp.mkdir(root, { recursive: true });

    for (const entry of entries) {
      if (
        entry.directory ||
        entry.symlink ||
        entry.filename.startsWith('__MACOSX/')
      ) {
        continue;
      }

      if (entry.encrypted) {
        throw new Error('Encrypted zip archives are not supported');
      }

      total += entry.uncompressedSize;

      if (total > MAX_TOTAL_SIZE) {
        throw new Error('Archive is too large');
      }

      const target = resolveEntry(root, entry.filename);
      const content = new Uint8Array(await entry.arrayBuffer());

      if (content.length !== entry.uncompressedSize) {
        throw new Error('Corrupted zip archive');
      }

      await fsp.mkdir(path.dirname(target), { recursive: true });
      await fsp.writeFile(target, content);
    }
  } finally {
    await reader.close();
  }
};

export const extractTar = async (file: string, dest: string) => {
  const root = path.resolve(dest);
  let total = 0;

  await fsp.mkdir(root, { recursive: true });
  await tar.extract({
    file,
    cwd: root,
    filter: (entryPath, entry) => {
      const { type, size = 0 } = entry as { type?: string; size?: number };

      if (type !== 'File' && type !== 'Directory') {
        return false;
      }

      resolveEntry(root, entryPath);
      total += size;

      if (total > MAX_TOTAL_SIZE) {
        throw new Error('Archive is too large');
      }

      return true;
    },
  });
};

export const extractArchive = async (file: string, dest: string) => {
  if (file.toLowerCase().endsWith('.zip')) {
    return extractZip(file, dest);
  }

  if (isArchive(file)) {
    return extractTar(file, dest);
  }

  throw new Error('Unsupported archive format');
};
