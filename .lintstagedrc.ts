import type { Configuration } from 'lint-staged'

// oxlint and oxfmt both ignore `scripts/templates/**` (see their rc files — the
// placeholder files aren't valid TS on their own), and both treat a fully
// ignored file list as an error rather than a no-op. So a commit touching only
// templates would fail the hook on "no files to check": drop them here instead.
const IGNORED = '/scripts/templates/'

const quote = (paths: string[]): string => paths.map(path => JSON.stringify(path)).join(' ')

const config: Configuration = {
  '*.{ts,tsx}': files => {
    const checkable = files.filter(file => !file.includes(IGNORED))
    if (checkable.length === 0) return []
    const targets = quote(checkable)
    return [`oxlint --fix ${targets}`, `oxfmt ${targets}`]
  },
}

export default config
