import type { Dirent, Stats } from 'node:fs';
import type { FsLike } from '../src/fs-types.js';

type FakeFile = { type: 'file'; size: number; mtime: Date };
type FakeDir = { type: 'dir'; children: Record<string, FakeNode> };
type FakeNode = FakeFile | FakeDir;

export function file(size: number, mtime: Date): FakeFile {
  return { type: 'file', size, mtime };
}

export function dir(children: Record<string, FakeNode> = {}): FakeDir {
  return { type: 'dir', children };
}

function makeDirent(name: string, node: FakeNode): Dirent {
  return {
    name,
    isDirectory: () => node.type === 'dir',
    isFile: () => node.type === 'file',
  } as Dirent;
}

/**
 * Splits a path into segments, ignoring "." and empty segments — so both
 * "." and "" refer to the tree's top level, mirroring how path.join(".", "x")
 * collapses to just "x" in real usage. Splits on either slash type so tests
 * are unaffected by the host OS's native separator.
 */
function splitPath(p: string): string[] {
  return p.split(/[\\/]+/).filter((seg) => seg !== '' && seg !== '.');
}

/**
 * Builds an in-memory FsLike implementation from a tree of dir()/file()
 * nodes, so scanner/size/staleness logic can be tested without real I/O.
 *
 * Convention: pass "." as the root path to the function under test
 * (e.g. scanRoot(".", fs)) so the tree's top level represents the scan
 * root directly.
 */
export class FakeFs implements FsLike {
  private root: FakeDir;
  private deniedPaths = new Set<string>();

  constructor(tree: FakeDir) {
    this.root = tree;
  }

  private canonical(path: string): string {
    return splitPath(path).join('/');
  }

  /** Marks a path as unreadable, regardless of which separator style
   *  it's later queried with (real code uses native path.join). */
  denyReaddir(path: string): void {
    this.deniedPaths.add(this.canonical(path));
  }

  private resolve(path: string): FakeNode | undefined {
    const parts = splitPath(path);
    let current: FakeNode | undefined = this.root;
    for (const part of parts) {
      if (!current || current.type !== 'dir') return undefined;
      current = current.children[part];
    }
    return current;
  }

  async readdir(
    path: string,
    _opts: { withFileTypes: true },
  ): Promise<Dirent[]> {
    if (this.deniedPaths.has(this.canonical(path))) {
      throw new Error(`EACCES: permission denied, scandir '${path}'`);
    }
    const node = this.resolve(path);
    if (!node || node.type !== 'dir') {
      throw new Error(`ENOENT: no such file or directory, scandir '${path}'`);
    }
    return Object.entries(node.children).map(([name, child]) =>
      makeDirent(name, child),
    );
  }

  async stat(path: string): Promise<Pick<Stats, 'size' | 'mtime'>> {
    const node = this.resolve(path);
    if (!node || node.type !== 'file') {
      throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
    }
    return { size: node.size, mtime: node.mtime };
  }

  async access(path: string): Promise<void> {
    const node = this.resolve(path);
    if (!node) {
      throw new Error(`ENOENT: no such file or directory, access '${path}'`);
    }
  }
}
