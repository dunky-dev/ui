import { useContext } from 'react'
import { LayerDepthContext } from './layer-depth-context'

/**
 * The overlay nesting depth at the call site (0 = outside any layer). An
 * overlay root reads it, adds 1, and provides the result through
 * `LayerDepthContext`; the part that mounts while open feeds the value to
 * `registerLayer`.
 */
export function useLayerDepth(): number {
  return useContext(LayerDepthContext)
}
