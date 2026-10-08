<script lang="ts">
  import { set__Name__Context } from './context.js'
  import type { __Name__Props } from './types.js'
  import { use__Name__ } from './use-__name__.js'

  let { children, ...options }: __Name__Props = $props()

  set__Name__Context(use__Name__(() => options))
</script>

{@render children?.()}
