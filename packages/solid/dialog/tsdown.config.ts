import { babel } from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

// Solid JSX needs Solid's own compiler: babel-preset-solid turns JSX into
// reactive templates + effects, which neither oxc nor rolldown's React-shaped
// JSX transform can produce. The plugin transforms .tsx before rolldown's own
// transform sees it; everything else (entry, dts, publint) inherits the root
// config. Babel applies presets last-to-first: TypeScript strips types while
// keeping the JSX (isTSX), then the Solid preset compiles it.
export default defineConfig({
  plugins: [
    babel({
      babelHelpers: 'bundled',
      extensions: ['.tsx'],
      presets: [
        ['babel-preset-solid'],
        ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
      ],
    }),
  ],
})
