import Table from 'cli-table3';
import type { ScanResult } from './types.js';

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function reportTable(results: ScanResult[]): string {
  const table = new Table({
    head: ['Project', 'node_modules size', 'Stale for'],
  });

  const sorted = [...results].sort((a, b) => b.sizeBytes - a.sizeBytes);
  for (const r of sorted) {
    table.push([
      r.projectPath,
      formatBytes(r.sizeBytes),
      `${r.staleDays} days`,
    ]);
  }

  const totalBytes = results.reduce((sum, r) => sum + r.sizeBytes, 0);
  return `${table.toString()}\n\nTotal reclaimable (if deleted manually): ${formatBytes(
    totalBytes,
  )} across ${results.length} project(s)`;
}

export function reportJson(results: ScanResult[]): string {
  return JSON.stringify(
    results.map((r) => ({
      project: r.projectPath,
      nodeModulesPath: r.nodeModulesPath,
      sizeBytes: r.sizeBytes,
      lastSourceModified: r.lastSourceModified.toISOString(),
      staleDays: r.staleDays,
    })),
    null,
    2,
  );
}

export function reportCsv(results: ScanResult[]): string {
  const header =
    'project,nodeModulesPath,sizeBytes,lastSourceModified,staleDays';
  const rows = results.map(
    (r) =>
      `"${r.projectPath}","${r.nodeModulesPath}",${r.sizeBytes},${r.lastSourceModified.toISOString()},${r.staleDays}`,
  );
  return [header, ...rows].join('\n');
}
