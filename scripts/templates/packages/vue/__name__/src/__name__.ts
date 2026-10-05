import {
  defineComponent,
  h,
  provide,
  type ButtonHTMLAttributes,
  type ComponentOptionsMixin,
  type DefineComponent,
  type EmitsOptions,
} from 'vue'
import type { __Name__Callbacks, __Name__Options } from '@dunky.dev/__name__'

import { mergeProps, normalize } from '@dunky.dev/vue-state-machine'
import { __Name__ContextKey, use__Name__Context } from './context'
import { use__Name__ } from './use-__name__'

// Explicit so the exports satisfy --isolatedDeclarations (a bare
// defineComponent call gives the variable no annotatable type). It is the
// options-carrying type an SFC gets: the function-signature defineComponent
// types its result as a bare constructor, which tooling built around SFCs
// (Storybook's Meta) rejects — the value is the same options object either
// way, so the casts below only name it.
type __Name__Component<Props, Emits extends EmitsOptions = {}> = DefineComponent<
  Props,
  {},
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  Emits
>

// Vue casts an absent Boolean prop to `false`; `default: undefined` keeps it
// absent, so the core's defaults hold.
const booleanOption = { type: Boolean, default: undefined }

// =============================================================================
// <__Name__> — root, owns the machine and renders no DOM
// =============================================================================

/** The core options; the core callbacks are the emits (`__Name__Emits`). */
export interface __Name__Props extends Omit<__Name__Options, keyof __Name__Callbacks> {}

/** The core callbacks as emits, listeners called synchronously. */
export type __Name__Emits = {
  /** Fired when the primitive becomes disabled. */
  disable: () => void
}

const __Name__Root = defineComponent<__Name__Props, __Name__Emits>(
  (props, { emit, slots }) => {
    // Built once: a fresh forwarder per read would re-run the effects keyed on
    // a callback on every prop change.
    const callbacks: __Name__Callbacks = { disable: () => emit('disable') }
    const value = use__Name__(() => ({ ...props, ...callbacks }))
    provide(__Name__ContextKey, value)
    return () => slots.default?.()
  },
  {
    name: '__Name__',
    // Renders no element of its own.
    inheritAttrs: false,
    props: { disabled: booleanOption },
    emits: ['disable'],
  },
) as __Name__Component<__Name__Props, __Name__Emits>

// =============================================================================
// <__Name__.Root> — placeholder part: wires the root bindings onto an element.
// TODO(spec): replace with one part per piece of the anatomy in SPEC.md.
// =============================================================================

export interface __Name__RootProps extends ButtonHTMLAttributes {}

export const Root: __Name__Component<__Name__RootProps> = defineComponent(
  (_props: __Name__RootProps, { attrs, slots }) => {
    const { api } = use__Name__Context()
    return () =>
      h(
        'button',
        mergeProps({ type: 'button', ...attrs }, normalize(api.value.parts.root)),
        slots.default?.(),
      )
  },
  { name: '__Name__Root', inheritAttrs: false },
) as __Name__Component<__Name__RootProps>

// Parts
// -----------------------------------------------------------------------------

export interface Parts {
  Root: typeof Root
}

export const __Name__: __Name__Component<__Name__Props, __Name__Emits> & Parts = Object.assign(
  __Name__Root,
  { Root },
)
