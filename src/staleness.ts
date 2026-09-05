import { join } from 'node:path';
import type { FsLike } from './fs-types.js';
import { realFs } from './fs-types.js';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
]);

/**
 * Finds the most recent mtime among a project's own source files,
 * ignoring node_modules and common build/vcs noise directories.
 *
 * If the project directory is entirely unreadable, this returns the
 * Unix epoch, which will report as maximally stale — a deliberate
 * fail-safe rather than a crash, though callers should be aware an
 * inaccessible project looks identical to a genuinely ancient one.
 */
export async function getLastSourceModified(
  projectPath: string,
  fs: FsLike = realFs,
): Promise<Date> {
  let latest = new Date(0);

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    await Promise.all(
      entries.map(async (entry) => {
        if (entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.'))
            return;
          await walk(join(dir, entry.name));
        } else if (entry.isFile()) {
          try {
            const s = await fs.stat(join(dir, entry.name));
            if (s.mtime > latest) latest = s.mtime;
          } catch {
            // file vanished mid-scan — skip
          }
        }
      }),
    );
  }

  await walk(projectPath);
  return latest;
}

export function daysSince(date: Date): number {
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
