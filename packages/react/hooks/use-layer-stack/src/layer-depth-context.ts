import { createContext } from 'react'
import type { Context } from 'react'

/**
 * The shared nesting-depth scale for overlay layers (0 = outside any layer).
 * Every overlay root reads it, adds 1, and provides it; the part that mounts
 * while open feeds the value to `registerLayer`.
 *
 * React context crosses portals, so this depth reflects logical nesting where
 * portaled DOM order inverts it — and one scale shared by every primitive
 * keeps cross-primitive stacks (a popover inside a dialog) ordered even when
 * nested layers mount in the same commit, where registration order alone
 * would pick the wrong topmost.
 */
export const LayerDepthContext: Context<number> = createContext(0)
