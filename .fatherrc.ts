import { defineConfig } from 'father';

export default defineConfig({
  cjs: { 
    output: 'lib', 
    // ignores: [
    //   'src/components'
    // ] 
  },
  esm: { 
    output: 'es', 
    // ignores: [
    //   'src/components'
    // ] 
  },
  sourcemap: true,

});

