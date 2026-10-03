import { copyFile, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
const maxAssetSize = 25 * 1024 * 1024;
const files = [];

async function collect(relativePath) {
  const source = join(root, relativePath);
  const stat = await lstat(source);
  if (stat.isSymbolicLink()) {
    throw new Error(`Symlinks are not allowed in public assets: ${relativePath}`);
  }
  if (stat.isDirectory()) {
    for (const entry of await readdir(source)) {
      if (!entry.startsWith('.')) await collect(join(relativePath, entry));
    }
  } else if (stat.isFile()) {
    if (stat.size > maxAssetSize) {
      throw new Error(`Asset exceeds Cloudflare's 25 MiB limit: ${relativePath}`);
    }
    files.push({ relativePath, size: stat.size });
  } else {
    throw new Error(`Unsupported asset: ${relativePath}`);
  }
}

// Explicit public inputs keep Git history, dependencies and tooling out of uploads.
for (const input of ['index.html', 'ross-cameron', 'bnf', 'seykota', 'livermore', '.nojekyll']) {
  await collect(input);
}

// Only remove the generated directory directly inside this project.
if (dirname(output) !== root) throw new Error('Invalid build output directory');
try {
  if ((await lstat(output)).isSymbolicLink()) {
    throw new Error('Build output must not be a symlink');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const { relativePath } of files) {
  const destination = join(output, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(join(root, relativePath), destination);
}

const largest = files.reduce((a, b) => a.size > b.size ? a : b);
console.log(`Built ${files.length} public files in dist/`);
console.log(`Largest asset: ${largest.relativePath} (${(largest.size / 1024 / 1024).toFixed(2)} MiB / 25 MiB)`);
