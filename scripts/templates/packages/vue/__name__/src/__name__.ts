import {
  defineComponent,
  h,
  provide,
  type ButtonHTMLAttributes,
  type DefineComponent,
} from 'vue'
import type { __Name__Callbacks, __Name__Options } from '@dunky.dev/__name__'

import { mergeProps, normalize } from '@dunky.dev/vue-state-machine'
import { __Name__ContextKey, use__Name__Context } from './context'
import { use__Name__, type __Name__Emit } from './use-__name__'

// Explicit so the exports satisfy --isolatedDeclarations (a bare
// defineComponent call gives the variable no annotatable type).
type PartComponent<Props> = DefineComponent<Props>

// =============================================================================
// <__Name__> — root, owns the machine and renders no DOM
// =============================================================================

/** The root's props: the core options; the core callbacks are emits (typed
 * here as listener props so templates and TSX check them). */
export interface __Name__Props extends Omit<__Name__Options, keyof __Name__Callbacks> {
  /** Fired when the primitive becomes disabled. */
  onDisable?: () => void
}

const __Name__Root = defineComponent({
  name: '__Name__',
  props: {
    // Vue casts an undeclared-default Boolean prop to false — `default:
    // undefined` keeps the tri-state the options contract needs.
    disabled: { type: Boolean, default: undefined },
  },
  emits: ['disable'],
  setup(props, { slots, emit }) {
    const value = use__Name__(props, emit as __Name__Emit)
    provide(__Name__ContextKey, value)
    return () => slots.default?.()
  },
})

// =============================================================================
// <__Name__.Root> — placeholder part: wires the root bindings onto an element.
// TODO(spec): replace with one part per piece of the anatomy in SPEC.md.
// =============================================================================

export interface __Name__RootProps extends ButtonHTMLAttributes {}

export const Root: PartComponent<__Name__RootProps> = defineComponent({
  name: '__Name__Root',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const { api } = use__Name__Context()
    return () =>
      h(
        'button',
        mergeProps({ type: 'button', ...attrs }, normalize(api.value.parts.root)),
        slots.default?.(),
      )
  },
}) as unknown as PartComponent<__Name__RootProps>

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Root: typeof Root
}

export const __Name__: DefineComponent<__Name__Props> & Parts = Object.assign(
  __Name__Root as unknown as DefineComponent<__Name__Props>,
  { Root },
)
