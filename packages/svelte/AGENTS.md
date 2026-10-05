# Agents / svelte substrate

Svelte 5 bindings. Everything in the root `AGENTS.md` applies; only the host
differs:

- **Packages ship uncompiled.** `@sveltejs/package` builds each one, not
  tsdown — the consumer's Svelte compiles the `.svelte` files and `.svelte.js`
  rune modules (see `ARCHITECTURE.md`). Nothing rewrites the emitted imports,
  so a relative import names the file it loads: `./context.js` for a `.ts`
  module, `./use-x.svelte.js` for a rune module, `./part.svelte` for a
  component.
- **One component per file.** Each part is a kebab-case `.svelte` file
  (`dialog-trigger.svelte`); `src/index.ts` assembles the compound. A module
  that calls runes is a `.svelte.ts` file.
- **Effects run in tree order, children first.** `bind:this` fills in the
  same pass, after mount — a part sees a sibling's element only if the sibling
  renders before it. The connected `api` is a fresh snapshot per machine
  change, so an effect keyed on one value derives it first
  (`const open = $derived(api.open)`) and reads everything else `untrack`ed.
  Each effect tears down right before its own re-run, so two effects keyed on
  the same edge interleave: keep a sequence and its inverse in one effect.
- **svelte-check typechecks it**, not `tsc`, which can't read `.svelte`
  (`pnpm typecheck` runs both). svelte-check and the package build drive
  TypeScript's classic API, gone in TypeScript 7, so these packages hold a
  local `typescript@^6`.
- **oxfmt can't parse `.svelte`.** oxlint still lints the `<script>` blocks;
  keep the markup in the repo's style by hand.
- **Two vitest projects.** `vitest.config.ts` renders through the DOM
  (`svelteTesting()`, jsdom per file); `vitest.ssr.config.ts` runs the
  `*.ssr.test.ts` files through `svelte/server`. A composition a test renders
  is a `.svelte` fixture in `tests/fixtures/`; call `flushSync()` after an
  interaction before reading the DOM.
- **Stories are Svelte CSF** (`*.stories.svelte`): `asChild` renders the
  composition as written and `exportName` keeps the story ids identical to the
  other substrates'. A story that needs local state is a component in
  `stories/`.
