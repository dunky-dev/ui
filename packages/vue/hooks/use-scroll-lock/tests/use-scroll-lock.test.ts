// @vitest-environment jsdom
// The Vue lifecycle around @dunky.dev/dom-scroll-lock — the refcount/restore
// behavior itself is covered in the util's own tests.
import { KeepAlive, defineComponent, h, nextTick, ref } from 'vue'
import { cleanup, render } from '@testing-library/vue'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
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

// Auto-cleanup needs vitest globals; this repo runs with globals: false. A
// test that fails before its end must not leave the body locked.
afterEach(cleanup)

describe('useScrollLock', () => {
  it('locks body scroll while mounted and releases on unmount', () => {
    const { unmount } = mountLock()
    expect(document.body.style.overflowY).toBe('hidden')

    unmount()
    expect(document.body.style.overflowY).toBe('')
  })

  it('does not lock when locked=false', () => {
    mountLock(false)
    expect(document.body.style.overflowY).toBe('')
  })

  it('locks nothing when target is null — a target not yet resolved', () => {
    mountLock(true, () => null)
    expect(document.body.style.overflowY).toBe('')
  })

  // `ref<HTMLElement>()` holds undefined until its element renders.
  it('locks nothing while a template ref is still empty, and its element once it renders', async () => {
    const shown = ref(false)
    const target = ref<HTMLElement>()
    render(
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
  })

  it('follows a reactive locked flag, releasing when it turns off', async () => {
    const locked = ref(true)
    mountLock(locked)
    expect(document.body.style.overflowY).toBe('hidden')

    locked.value = false
    await nextTick()
    expect(document.body.style.overflowY).toBe('')
  })

  it('releases while a KeepAlive deactivation holds the component, and locks again on reactivation', async () => {
    const shown = ref(true)
    const Lock = Locker()
    render(() => h(KeepAlive, null, () => (shown.value ? h(Lock) : null)))
    expect(document.body.style.overflowY).toBe('hidden')

    shown.value = false
    await nextTick()
    expect(document.body.style.overflowY).toBe('')

    shown.value = true
    await nextTick()
    expect(document.body.style.overflowY).toBe('hidden')
  })

  it('holds nothing when mounted into a deactivated KeepAlive view, and locks once it returns', async () => {
    const shown = ref(true)
    const loaded = ref(false)
    const Lock = Locker()
    const Page = defineComponent(() => () => (loaded.value ? h(Lock) : null))
    render(() => h(KeepAlive, null, () => (shown.value ? h(Page) : null)))
    shown.value = false
    await nextTick()

    loaded.value = true // mounts the locker into the cached view
    await nextTick()
    expect(document.body.style.overflowY).toBe('')

    shown.value = true
    await nextTick()
    expect(document.body.style.overflowY).toBe('hidden')
  })

  it("takes a component's ref as its root element", () => {
    const Surface = defineComponent(() => () => h('section'))
    const surface = ref<InstanceType<typeof Surface> | null>(null)
    render(
      defineComponent({
        setup() {
          useScrollLock(true, surface)
          return () => h(Surface, { ref: surface })
        },
      }),
    )
    expect((surface.value?.$el as HTMLElement | undefined)?.style.overflowY).toBe('hidden')
    expect(document.body.style.overflowY).toBe('')
  })

  // An iframe's elements belong to another realm, which `instanceof` misses.
  it('locks an element from another document', () => {
    const frame = document.createElement('iframe')
    document.body.append(frame)
    onTestFinished(() => frame.remove())
    const surface = frame.contentDocument?.body ?? null
    mountLock(true, surface)
    expect(surface?.style.overflowY).toBe('hidden')
  })
})
