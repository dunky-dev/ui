// @vitest-environment node
// Server rendering, where there is no document: nothing may touch the DOM
// before mount, and the portal renders nothing.
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { Dialog } from '@dunky.dev/vue-dialog'

const render = (defaultOpen: boolean): Promise<string> =>
  renderToString(
    createSSRApp(() => (
      <Dialog defaultOpen={defaultOpen} closeOnBack>
        <Dialog.Trigger>Trigger</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Viewport>
            <Dialog.Content>
              <Dialog.Title>Title</Dialog.Title>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    )),
  )

describe('Dialog on the server', () => {
  it('renders a closed dialog as its trigger alone', async () => {
    const html = await render(false)
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('role="dialog"')
  })

  it('renders an open dialog without its portal, the trigger already announcing it', async () => {
    const html = await render(true)
    expect(html).toMatch(/aria-controls="v-[^"]+-content"/)
    expect(html).toContain('data-state="open"')
    expect(html).not.toContain('role="dialog"')
  })
})
