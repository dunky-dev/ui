// Run a substrate's Storybook. Substrate defaults to react.
//   pnpm dev              -> @dunky-dev/react  dev
//   pnpm dev vue          -> @dunky-dev/vue    dev
//   pnpm build-storybook  -> @dunky-dev/react  build
// Each substrate is a self-contained package (packages/<substrate>) that owns its
// Storybook + framework deps and its own dev/build scripts (incl. port). We
// delegate via `pnpm --filter` so Storybook resolves everything inside the
// package (the root has no Storybook deps to resolve against).
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [command, substrate = 'react'] = process.argv.slice(2)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

if (existsSync(join(root, 'packages', substrate))) {
  const child = spawn('pnpm', ['--filter', `@dunky-dev/${substrate}`, 'run', command], {
    stdio: 'inherit',
  })
  child.on('exit', code => (process.exitCode = code ?? 0))
} else {
  console.error(`Unknown substrate '${substrate}' — create packages/${substrate} first.`)
  process.exitCode = 1
}
