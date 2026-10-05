// @vitest-environment jsdom
// The Vue lifecycle around @dunky.dev/dom-scroll-lock — the refcount/restore
// behavior itself is covered in the util's own tests.
import { KeepAlive, defineComponent, h, nextTick, ref } from 'vue'
import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { useScrollLock } from '@dunky.dev/vue-use-scroll-lock'

// TL Vue has no renderHook: a component that only calls the composable.
const Locker = (...args: Parameters<typeof useScrollLock>) =>
  defineComponent({
    setup() {
      useScrollLock(...args)
      return () => null
    },
  })

const mountLock = (...args: Parameters<typeof useScrollLock>): ReturnType<typeof render> =>
  render(Locker(...args))

describe('useScrollLock', () => {
  it('locks body scroll while mounted and releases on unmount', () => {
    const { unmount } = mountLock()
    expect(document.body.style.overflowY).toBe('hidden')

    unmount()
    expect(document.body.style.overflowY).toBe('')
  })

  it('does not lock when locked=false', () => {
    const { unmount } = mountLock(false)
    expect(document.body.style.overflowY).toBe('')
    unmount()
  })

  it('locks nothing when target is null — a target not yet resolved', () => {
    const { unmount } = mountLock(true, () => null)
    expect(document.body.style.overflowY).toBe('')
    unmount()
  })

  // `ref<HTMLElement>()` holds undefined until its element renders.
  it('locks nothing while a template ref is still empty, and its element once it renders', async () => {
    const shown = ref(false)
    const target = ref<HTMLElement>()
    const { unmount } = render(
      defineComponent({
        setup() {
          useScrollLock(true, target)
          return () => h('div', shown.value ? [h('section', { ref: target })] : [])
        },
      }),
    )
    expect(document.body.style.overflowY).toBe('')

    shown.value = true
    await nextTick()
    expect(target.value?.style.overflowY).toBe('hidden')
    expect(document.body.style.overflowY).toBe('')
    unmount()
  })

  it('follows a reactive locked flag, releasing when it turns off', async () => {
    const locked = ref(true)
    const { unmount } = mountLock(locked)
    expect(document.body.style.overflowY).toBe('hidden')

    locked.value = false
    await nextTick()
    expect(document.body.style.overflowY).toBe('')
    unmount()
  })

  it('releases while a KeepAlive deactivation holds the component, and locks again on reactivation', async () => {
    const shown = ref(true)
    const Lock = Locker()
    const { unmount } = render(() => h(KeepAlive, null, () => (shown.value ? h(Lock) : null)))
    expect(document.body.style.overflowY).toBe('hidden')

    shown.value = false
    await nextTick()
    expect(document.body.style.overflowY).toBe('')

    shown.value = true
    await nextTick()
    expect(document.body.style.overflowY).toBe('hidden')
    unmount()
  })
})
