export const commonParameters = {
    entryPoints: ['src/js/index.ts'],
    platform: 'browser',
    bundle: true,
    loader: {
      '.png': 'dataurl',
      '.jpg': 'file',
      '.svg': 'base64' 
    },
    target: 'es2020',
    outdir: 'build/',
  };
