import { createContext } from 'react'
import type { Context } from 'react'

/**
 * The shared nesting chain for overlay layers — the enclosing layers' ids,
 * outermost first (empty outside any layer). Every overlay root reads it,
 * appends its own layer id, and provides the result; the part that mounts
 * while open feeds the value to `registerLayer`, which takes nesting depth
 * from the path's length and ancestry from its contents.
 *
 * React context crosses portals, so the path reflects logical nesting where
 * portaled DOM order inverts it — and one chain shared by every primitive
 * keeps cross-primitive stacks (a popover inside a dialog) ordered even when
 * nested layers mount in the same commit, where registration order alone
 * would pick the wrong topmost.
 */
export const LayerPathContext: Context<readonly string[]> = createContext<readonly string[]>([])
