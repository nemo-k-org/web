import * as esbuild from 'esbuild'
import fs from 'node:fs'

import { commonParameters } from './esbuild.common.mjs'

const result = await esbuild.build(Object.assign(commonParameters, {
  sourcemap: true,
  metafile: true,
}))

// fs.writeFileSync('test-results/meta.json', JSON.stringify(result.metafile))
