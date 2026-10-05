// @vitest-environment jsdom
// The Vue lifecycle around @dunky.dev/dom-focus-trap — the wrap/no-op/enabled
// behavior itself is covered in the util's own tests.
import { KeepAlive, defineComponent, nextTick, ref, type PropType } from 'vue'
import { cleanup, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { useFocusTrap } from '@dunky.dev/vue-use-focus-trap'

const Trap = defineComponent({
  props: { enabled: { type: Function as PropType<() => boolean>, default: undefined } },
  setup(props) {
    const target = ref<HTMLDivElement | null>(null)
    // The closure defers the props read to each Tab press.
    useFocusTrap(target, { enabled: () => props.enabled?.() !== false })
    return () => (
      <div ref={target} tabindex={-1} data-testid='container'>
        <button type='button'>first</button>
        <button type='button'>last</button>
      </div>
    )
  },
})

// dispatchEvent returns false when a handler called preventDefault — Vue
// TL's fireEvent resolves void, so it can't report that.
const tab = (target: Element): boolean =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
  )

// Auto-cleanup needs vitest globals; this repo runs with globals: false.
afterEach(cleanup)

describe('useFocusTrap', () => {
  it('traps while mounted and releases on unmount', () => {
    const { unmount } = render(Trap)
    screen.getByText('last').focus()

    expect(tab(screen.getByTestId('container'))).toBe(false)
    expect(document.activeElement).toBe(screen.getByText('first'))

    const container = screen.getByTestId('container')
    screen.getByText('last').focus()
    unmount()
    // The listener is gone with the unmount — a Tab on the detached container
    // is no longer intercepted.
    expect(tab(container)).toBe(true)
  })

  it('forwards enabled() to the trap without re-binding', () => {
    render(Trap, { props: { enabled: () => false } })
    const last = screen.getByText('last')
    last.focus()

    expect(tab(screen.getByTestId('container'))).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  it('lets go while a KeepAlive deactivation holds the component, and re-arms on reactivation', async () => {
    const shown = ref(true)
    render(() => <KeepAlive>{shown.value ? <Trap /> : null}</KeepAlive>)
    const container = screen.getByTestId('container')

    shown.value = false
    await nextTick()
    expect(tab(container)).toBe(true)

    shown.value = true
    await nextTick()
    expect(tab(container)).toBe(false)
  })

  it('stays unarmed when mounted into a deactivated KeepAlive view, and arms once it returns', async () => {
    const shown = ref(true)
    const loaded = ref(false)
    const Page = defineComponent(() => () => (loaded.value ? <Trap /> : <span>loading</span>))
    render(() => <KeepAlive>{shown.value ? <Page /> : null}</KeepAlive>)
    shown.value = false
    await nextTick()

    loaded.value = true // mounts the trap into the cached view
    await nextTick()
    const outside = document.createElement('button')
    document.body.append(outside)
    expect(tab(outside)).toBe(true)

    shown.value = true
    await nextTick()
    expect(tab(screen.getByTestId('container'))).toBe(false)
    outside.remove()
  })

  it("takes a component's ref as its root element", () => {
    const Panel = defineComponent((_, { slots }) => () => (
      <div tabindex={-1} data-testid='container'>
        {slots.default?.()}
      </div>
    ))
    render(
      defineComponent(() => {
        const panel = ref<InstanceType<typeof Panel> | null>(null)
        useFocusTrap(panel)
        return () => (
          <Panel ref={panel}>
            <button type='button'>first</button>
            <button type='button'>last</button>
          </Panel>
        )
      }),
    )
    screen.getByText('last').focus()
    expect(tab(screen.getByTestId('container'))).toBe(false)
    expect(document.activeElement).toBe(screen.getByText('first'))
  })
})
