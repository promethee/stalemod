# stalemod

Scan your local dev folders for stale, opted-in `node_modules` directories and report their size and location — so you can decide for yourself what's worth cleaning up.

`stalemod` is a **reporting tool only**. It never deletes anything. It can be used two ways:

- **Standalone**, as a quick way to see how much disk space old projects are quietly hoarding.
- **As a building block**, feeding its structured JSON/CSV output into your own scripts, dashboards, or cleanup automation — `stalemod` deliberately stops at reporting so you can decide what happens next.

## Why

Every developer accumulates old side projects, clones, and experiments — each with its own multi-hundred-MB `node_modules` folder that nobody ever revisits. `stalemod` finds those, tells you exactly how much space they're using and how long it's been since you last touched the actual source code (not just when you last ran `npm install`), and leaves the decision to delete entirely in your hands.

## Install / Usage

No installation needed — run directly with `npx`:

```bash
npx stalemod ~/dev
```

Or install globally:

```bash
npm install -g stalemod
stalemod ~/dev
```

### Opting in a project

`stalemod` only reports on projects you've explicitly opted in. To include a project in scans, add an empty marker file to its root:

```bash
touch .stalemod
```

Projects without this file are **always ignored**, even if they have a large `node_modules` folder. This is intentional — see [Scope](#scope) below.

### Options

| Flag                  | Description                                                                                                                   | Default |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------- |
| `-d, --days <n>`      | Only show projects whose source hasn't been touched in at least `n` days. Use `0` to show everything regardless of staleness. | `30`    |
| `-f, --format <type>` | Output format: `table`, `json`, or `csv`                                                                                      | `table` |

### Examples

```bash
# Default: show projects untouched for 30+ days
npx stalemod ~/dev

# Show everything, ignore staleness
npx stalemod ~/dev --days 0

# Only show projects untouched for 90+ days, as JSON
npx stalemod ~/dev --days 90 --format json

# Scan multiple root folders at once
npx stalemod ~/dev ~/work ~/experiments
```

### Sample output

```
┌───────────────┬───────────────────┬────────────┐
│ Project       │ node_modules size │ Stale for  │
├───────────────┼───────────────────┼────────────┤
│ dev/todo-list │      22.53 MB     │   47 days  │
└───────────────┴───────────────────┴────────────┘
```

Total reclaimable (if deleted manually): 22.53 MB across 1 project(s)

## Using stalemod as a building block

The `--format json` and `--format csv` outputs are designed to be piped into other tools rather than just read by a human. For example:

```bash
npx stalemod ~/dev --format json > report.json
```

You could use this to feed a scheduled report into Slack, build a dashboard of reclaimable space across machines, or drive your own (reviewed) cleanup script. `stalemod` intentionally does not do any of this itself — it hands you clean data and stops there.

## Scheduling regular scans

`stalemod` is a plain CLI with no background service or daemon. To run it periodically, use your OS's own scheduler:

- **Windows**: [Task Scheduler](https://learn.microsoft.com/en-us/windows/win32/taskschd/task-scheduler-start-page)
- **macOS/Linux**: `cron` or `launchd`

## What stalemod does _not_ do

- It does **not** delete anything, automatically or otherwise.
- It does **not** print a ready-to-run delete command — even that small nudge toward copy-pasting a deletion without review is more risk than the tool wants to introduce.
- It does **not** run as a background service — you control when it runs.

Any cleanup decision, and the action of deleting, is entirely up to you.

## Scope

**stalemod is for:**

- A solo developer cleaning up their own local projects on their own machine.
- Anyone comfortable reviewing a report and manually deciding what to delete.

**stalemod is _not_ for:**

- Shared or company-wide machines, where deleting another person's project files could cause harm without their knowledge.
- Any automated deletion pipeline — `stalemod` was deliberately built to stop short of that.
- Determining whether a project is _safe_ to delete — it only reports size and staleness, not project importance, backups, or version control status. Always confirm a project is safely committed/pushed elsewhere before deleting.

## License

MIT

## AI disclosure

This project was built with the assistance of AI (Claude, by Anthropic) in a conversational pair-programming style: I defined the requirements, scope, and design decisions (opt-in marker file, no auto-delete, staleness signal based on source files rather than `node_modules` itself, the `--days` filter, etc.), and the AI generated the initial TypeScript implementation, README, and supporting files based on that direction. I reviewed, tested, and iterated on the output myself before publishing.

I'm disclosing this explicitly and in detail because I believe transparency about AI-assisted development matters, especially for a public package other developers may choose to install and run on their own machines. If you have questions about which parts were AI-generated versus hand-written, feel free to open an issue.
