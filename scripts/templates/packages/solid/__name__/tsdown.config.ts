import { babel } from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

// Solid JSX needs Solid's own compiler (babel-preset-solid) — rolldown/oxc
// only know React-shaped JSX. Presets apply last-to-first: TypeScript strips
// types keeping the JSX, then the Solid preset compiles it. Everything else
// inherits the root config.
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
