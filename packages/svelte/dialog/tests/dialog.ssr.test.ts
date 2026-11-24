// The server half: `svelte/server` renders with no document, and effects never
// run — so no portal, no listeners, nothing but the markup.
import { render } from 'svelte/server'
import { describe, expect, it } from 'vitest'
import DefaultDialog from './fixtures/default-dialog.svelte'

describe('Dialog on the server', () => {
  it('renders a closed dialog as its trigger alone', () => {
    const { body } = render(DefaultDialog)
    expect(body).toContain('aria-expanded="false"')
    expect(body).not.toContain('role="dialog"')
  })

  // The layers wait for the client, where the Portal has a document to mount
  // into; the trigger already names them by an id hydration will reuse.
  it('renders an open dialog with ids stable across renders', () => {
    const render$ = (): string => render(DefaultDialog, { props: { defaultOpen: true } }).body
    const body = render$()
    expect(body).toMatch(/aria-controls="[^"]+-content"/)
    expect(body).not.toContain('role="dialog"')
    expect(render$()).toBe(body)
  })
})
