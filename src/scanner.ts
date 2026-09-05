import { join } from 'node:path';
import type { ScanResult } from './types.js';
import { getDirectorySize } from './size.js';
import { getLastSourceModified, daysSince } from './staleness.js';
import type { FsLike } from './fs-types.js';
import { realFs } from './fs-types.js';

const MARKER_FILE = '.stalemod';

async function exists(path: string, fs: FsLike): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively walk `root`, looking for directories that contain both
 * a `node_modules` folder AND the opt-in marker file. Does not descend
 * into node_modules itself (perf: no need to look for markers inside deps).
 */
export async function scanRoot(
  root: string,
  fs: FsLike = realFs,
): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const hasNodeModules = entries.some(
      (e) => e.isDirectory() && e.name === 'node_modules',
    );
    const hasMarker = entries.some((e) => e.isFile() && e.name === MARKER_FILE);

    if (hasNodeModules && hasMarker) {
      const nodeModulesPath = join(dir, 'node_modules');
      const [sizeBytes, lastSourceModified] = await Promise.all([
        getDirectorySize(nodeModulesPath, fs),
        getLastSourceModified(dir, fs),
      ]);
      results.push({
        projectPath: dir,
        nodeModulesPath,
        sizeBytes,
        lastSourceModified,
        staleDays: daysSince(lastSourceModified),
      });
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules') continue;
      if (entry.name.startsWith('.')) continue;
      await walk(join(dir, entry.name));
    }
  }

  if (await exists(root, fs)) {
    await walk(root);
  }

  return results;
}

export async function scanRoots(
  roots: string[],
  fs: FsLike = realFs,
): Promise<ScanResult[]> {
  const all = await Promise.all(roots.map((r) => scanRoot(r, fs)));
  return all.flat();
}
