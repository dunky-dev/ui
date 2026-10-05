import type { Configuration } from 'lint-staged'

// oxlint and oxfmt both ignore `scripts/templates/**` (see their rc files — the
// placeholder files aren't valid TS on their own), and both treat a fully
// ignored file list as an error rather than a no-op. So a commit touching only
// templates would fail the hook on "no files to check": drop them here instead.
const IGNORED = '/scripts/templates/'

const quote = (paths: string[]): string => paths.map(path => JSON.stringify(path)).join(' ')

const checkable = (files: string[]): string[] => files.filter(file => !file.includes(IGNORED))

const config: Configuration = {
  '*.{ts,tsx}': files => {
    const targets = checkable(files)
    if (targets.length === 0) return []
    return [`oxlint --fix ${quote(targets)}`, `oxfmt ${quote(targets)}`]
  },
  // oxlint reads a component's <script> blocks; oxfmt can't parse `.svelte`
  // yet, so these get the lint pass only.
  '*.svelte': files => {
    const targets = checkable(files)
    if (targets.length === 0) return []
    return [`oxlint --fix ${quote(targets)}`]
  },
}

export default config
