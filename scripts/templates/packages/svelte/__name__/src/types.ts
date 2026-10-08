import type { Snippet } from 'svelte'
import type { HTMLButtonAttributes } from 'svelte/elements'
import type { __Name__Options } from '@dunky.dev/__name__'

export interface __Name__Props extends __Name__Options {
  /** The __name__'s parts. */
  children?: Snippet
}

// TODO(spec): one props interface per part of the anatomy in SPEC.md.
export interface __Name__RootProps extends HTMLButtonAttributes {
  /** The rendered `<button>`; `bind:ref` to read it. */
  ref?: HTMLButtonElement | null
}
