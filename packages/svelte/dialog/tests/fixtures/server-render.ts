import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { createServer } from 'vite'
import type { TestProject } from 'vitest/node'

declare module 'vitest' {
  export interface ProvidedContext {
    /** DefaultDialog's server render, `defaultOpen` — what hydration starts from. */
    defaultOpenServerMarkup: string
  }
}

// A vitest globalSetup for the DOM project: the hydration test needs real
// server markup, but that project resolves Svelte's browser runtime. So the
// render happens here, once, in a Vite SSR graph of its own.
export default async function renderOnServer(project: TestProject): Promise<void> {
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../..', import.meta.url)),
    logLevel: 'silent',
    appType: 'custom',
    plugins: [svelte({ configFile: false })],
    server: { middlewareMode: true, hmr: false, ws: false },
    // The workspace packages export TypeScript source and the adapter ships
    // rune modules: Vite compiles them rather than Node loading them raw.
    ssr: { noExternal: [/^@dunky\.dev\//] },
  })
  try {
    const { render } = await server.ssrLoadModule('svelte/server')
    const { default: DefaultDialog } = await server.ssrLoadModule(
      fileURLToPath(new URL('./default-dialog.svelte', import.meta.url)),
    )
    const { body } = render(DefaultDialog, { props: { defaultOpen: true } })
    project.provide('defaultOpenServerMarkup', body)
  } finally {
    await server.close()
  }
}
