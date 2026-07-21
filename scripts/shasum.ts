#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide a file path as an argument.');
  process.exit(1);
}

const digest = createHash('sha256')
  .update(readFileSync(filePath))
  .digest('hex');

// eslint-disable-next-line no-console
console.log(`SHA-256 hash of ${filePath}: ${digest}`);
