#!/usr/bin/env node
import { Command } from 'commander';
import { scanRoots } from './scanner.js';
import { reportTable, reportJson, reportCsv } from './reporter.js';
import { parseDays } from './options.js';

const DEFAULT_MIN_STALE_DAYS = 30;

const program = new Command();

program
  .name('stalemod')
  .description(
    'Scan folders for opted-in stale node_modules directories and report their size.',
  )
  .argument('<paths...>', 'One or more root folders to scan')
  .option('-f, --format <type>', 'Output format: table, json, csv', 'table')
  .option(
    '-d, --days <n>',
    `Only show projects untouched for at least this many days (default: ${DEFAULT_MIN_STALE_DAYS}). Use 0 to show everything.`,
    String(DEFAULT_MIN_STALE_DAYS),
  )
  .action(
    async (paths: string[], options: { format: string; days: string }) => {
      const minStaleDays = parseDays(options.days);
      if (minStaleDays === null) {
        console.error('Error: --days must be a non-negative number.');
        process.exitCode = 1;
        return;
      }

      const allResults = await scanRoots(paths);
      const results = allResults.filter((r) => r.staleDays >= minStaleDays);

      if (results.length === 0) {
        if (allResults.length === 0) {
          console.log(
            "No opted-in projects found. Add a .stalemod file to a project's root to include it in scans.",
          );
        } else {
          console.log(
            `No projects found stale for ${minStaleDays}+ days. ${allResults.length} opted-in project(s) were scanned but none met the threshold.`,
          );
        }
        return;
      }

      switch (options.format) {
        case 'json':
          console.log(reportJson(results));
          break;
        case 'csv':
          console.log(reportCsv(results));
          break;
        default:
          console.log(reportTable(results));
      }
    },
  );

program.parse();
