<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { __Name__ } from '@dunky.dev/svelte-__name__'

  // The primitive ships headless — the story is the consumer, so it brings the
  // styles. `data-state` on every part is the real styling hook. `exportName`
  // keeps the story ids identical across substrates.
  const { Story } = defineMeta({
    title: 'Primitives/__Name__',
    component: __Name__,
  })
</script>

<Story exportName="standard" asChild>
  <__Name__ disable={() => console.log('disabled')}>
    <__Name__.Root>go</__Name__.Root>
  </__Name__>
</Story>
