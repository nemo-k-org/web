import * as esbuild from 'esbuild'

import { commonParameters } from './esbuild.common.mjs'

await esbuild.build(Object.assign(commonParameters, {
  sourcemap: false,
  minify: true,
}))

