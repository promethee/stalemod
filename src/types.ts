export interface ScanResult {
  projectPath: string;
  nodeModulesPath: string;
  sizeBytes: number;
  lastSourceModified: Date;
  staleDays: number;
}

export interface ScanOptions {
  roots: string[];
  markerFile: string;
  outputFormat: 'table' | 'json' | 'csv';
  minStaleDays: number;
}
