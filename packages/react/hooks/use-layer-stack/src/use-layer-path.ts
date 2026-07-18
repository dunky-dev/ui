import { useContext } from 'react'
import { LayerPathContext } from './layer-path-context'

/** The overlay layer path at the call site — `LayerPathContext` carries the contract. */
export function useLayerPath(): readonly string[] {
  return useContext(LayerPathContext)
}
