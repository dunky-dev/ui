// @vitest-environment jsdom
// The Vue lifecycle around @dunky.dev/dom-scroll-lock — the refcount/restore
// behavior itself is covered in the util's own tests.
import { defineComponent } from 'vue'
import { cleanup, render } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { useScrollLock } from '@dunky.dev/vue-use-scroll-lock'

const Locker = defineComponent({
  props: {
    locked: { type: Boolean, default: true },
  },
  setup(props) {
    useScrollLock(() => props.locked)
    return () => null
  },
})

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('useScrollLock', () => {
  it('locks body scroll while mounted and releases on unmount', () => {
    const { unmount } = render(Locker)
    expect(document.body.style.overflow).toBe('hidden')

    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('does not lock when locked=false', () => {
    const { unmount } = render(Locker, { props: { locked: false } })
    expect(document.body.style.overflow).toBe('')
    unmount()
  })
})
