import { join } from 'node:path';
import type { FsLike } from './fs-types.js';
import { realFs } from './fs-types.js';

/**
 * Recursively computes total size in bytes of a directory tree.
 * Missing/unreadable subpaths are skipped rather than throwing,
 * since transient fs errors (permissions, vanished files) shouldn't
 * abort an otherwise-useful scan.
 */
export async function getDirectorySize(
  dirPath: string,
  fs: FsLike = realFs,
): Promise<number> {
  let total = 0;

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(current, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          try {
            const s = await fs.stat(fullPath);
            total += s.size;
          } catch {
            // file vanished mid-scan, or permission issue — skip
          }
        }
      }),
    );
  }

  await walk(dirPath);
  return total;
}
