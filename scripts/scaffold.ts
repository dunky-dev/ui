import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// Scaffolds a new primitive from a template kind. Templates live as real
// (`__name__`-tokenized) files under scripts/templates/<kind>, so they stay
// lintable/formattable and diffable against the packages they mirror. The script
// copies the tree with token substitution, then derives the workspace wiring
// (tsconfig paths + tsdown workspace) from the packages it created — add a
// substrate later by dropping a new folder into a kind, no script change needed.
//
//   pnpm scaffold <kind> <name>      e.g. pnpm scaffold full toggle

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TEMPLATES = join(ROOT, 'scripts', 'templates')

const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

interface Tokens {
  kebab: string
  pascal: string
  camel: string
}

interface CreatedPackage {
  name: string
  private: boolean
  dir: string
  src: string
}

function fail(message: string): never {
  throw new Error(message)
}

function toPascal(kebab: string): string {
  return kebab
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function toCamel(pascal: string): string {
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

function applyTokens(text: string, tokens: Tokens): string {
  return text
    .replaceAll('__camelName__', tokens.camel)
    .replaceAll('__Name__', tokens.pascal)
    .replaceAll('__name__', tokens.kebab)
}

function walk(dir: string, visit: (file: string) => void): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, visit)
    else visit(full)
  }
}

function collectJobs(
  templateDir: string,
  tokens: Tokens,
): Array<{ src: string; dest: string; rel: string }> {
  const jobs: Array<{ src: string; dest: string; rel: string }> = []
  walk(templateDir, src => {
    const rel = relative(templateDir, src).replaceAll('__name__', tokens.kebab)
    jobs.push({ src, dest: join(ROOT, rel), rel })
  })
  return jobs
}

function describeCreatedPackages(jobs: Array<{ dest: string; rel: string }>): CreatedPackage[] {
  return jobs
    .filter(job => job.rel.startsWith('packages/') && job.rel.endsWith('package.json'))
    .map(job => {
      const dir = dirname(job.dest)
      const pkg = JSON.parse(readFileSync(job.dest, 'utf8'))
      return {
        name: pkg.name,
        private: pkg.private === true,
        dir: relative(ROOT, dir),
        src: relative(ROOT, join(dir, 'src')),
      }
    })
}

// tsconfig.json is plain JSON but authored with inline single-element path arrays;
// a JSON round-trip would expand them and churn the diff. Insert new entries as
// text, right after the `paths` opener, matching the existing style.
function wireTsconfig(created: CreatedPackage[]): void {
  const path = join(ROOT, 'tsconfig.json')
  let text = readFileSync(path, 'utf8')
  const lines = created
    .filter(pkg => !text.includes(`"${pkg.name}":`))
    .map(pkg => `      "${pkg.name}": ["./${pkg.src}"],`)
  if (lines.length === 0) return
  text = text.replace('"paths": {\n', `"paths": {\n${lines.join('\n')}\n`)
  writeFileSync(path, text)
}

// The tsdown workspace is an explicit list of publishable packages. Rebuild it as
// a sorted, deduped multiline array (private packages are never published).
function wireTsdown(created: CreatedPackage[]): void {
  const path = join(ROOT, 'tsdown.config.ts')
  const text = readFileSync(path, 'utf8')
  const match = text.match(/workspace:\s*\[([\s\S]*?)\]/)
  if (!match) fail('could not find the workspace array in tsdown.config.ts')
  const existing = [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1])
  const additions = created.filter(pkg => !pkg.private).map(pkg => pkg.dir)
  const all = [...new Set([...existing, ...additions])].sort()
  const rebuilt = `workspace: [\n${all.map(entry => `    '${entry}',`).join('\n')}\n  ]`
  writeFileSync(path, text.replace(match[0], rebuilt))
}

// Templates are excluded from oxfmt (the `__name__` token collides with markdown
// bold), and oxfmt sorts package.json keys — an order the substituted names won't
// match. The wired root files are hand-edited as text (inline vs multiline depends
// on entry count). Format all of it so the result passes format:check straight away.
function formatOutputs(created: CreatedPackage[]): void {
  const bin = join(ROOT, 'node_modules', '.bin', 'oxfmt')
  if (!existsSync(bin)) return
  const targets = [...created.map(pkg => pkg.dir), 'tsconfig.json', 'tsdown.config.ts']
  execFileSync(bin, targets, { cwd: ROOT, stdio: 'inherit' })
}

function main(): void {
  const [kind, rawName] = process.argv.slice(2)
  const available = existsSync(TEMPLATES)
    ? readdirSync(TEMPLATES, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
    : []

  if (!kind || !rawName) {
    fail(`usage: pnpm scaffold <kind> <name>\navailable kinds: ${available.join(', ') || '(none)'}`)
  }
  const templateDir = join(TEMPLATES, kind)
  if (!existsSync(templateDir)) {
    fail(`unknown kind "${kind}". available kinds: ${available.join(', ') || '(none)'}`)
  }
  if (!NAME_PATTERN.test(rawName)) {
    fail(`name "${rawName}" must be kebab-case (e.g. toggle, toggle-button)`)
  }

  const pascal = toPascal(rawName)
  const tokens: Tokens = { kebab: rawName, pascal, camel: toCamel(pascal) }

  const jobs = collectJobs(templateDir, tokens)
  for (const job of jobs) {
    if (existsSync(job.dest)) fail(`refusing to overwrite existing ${job.rel}`)
  }
  for (const job of jobs) {
    mkdirSync(dirname(job.dest), { recursive: true })
    writeFileSync(job.dest, applyTokens(readFileSync(job.src, 'utf8'), tokens))
  }

  const created = describeCreatedPackages(jobs)
  wireTsconfig(created)
  wireTsdown(created)
  formatOutputs(created)

  console.log(`\nScaffolded "${rawName}" (${kind}):\n`)
  for (const pkg of created) console.log(`  ${pkg.name}  ->  ${pkg.dir}`)
  console.log('\nNext:')
  console.log('  1. pnpm install       # link the new workspace packages')
  console.log('  2. write each SPEC.md, then the tests, then the implementation')
  console.log('  3. pnpm test && pnpm typecheck && pnpm lint && pnpm build\n')
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
