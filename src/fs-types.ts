import type { Dirent, Stats } from 'node:fs';
import { readdir, stat, access } from 'node:fs/promises';

/** Minimal fs surface the scanner/size/staleness modules depend on. */
export interface FsLike {
  readdir(path: string, opts: { withFileTypes: true }): Promise<Dirent[]>;
  stat(path: string): Promise<Pick<Stats, 'size' | 'mtime'>>;
  access(path: string): Promise<void>;
}

export const realFs: FsLike = {
  readdir: readdir as FsLike['readdir'],
  stat,
  access,
};
