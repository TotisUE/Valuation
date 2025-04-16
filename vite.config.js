import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'buffer/';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Añadir alias para asegurar que se use el polyfill correcto
      'buffer': 'buffer/',
    },
  },
  // --- AÑADIR ESTA SECCIÓN 'optimizeDeps' (si no existe) ---
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        // Definir global.Buffer para que sea accesible como en Node
        global: 'globalThis', // Necesario para algunas dependencias
        'global.Buffer': 'Buffer', // Hacer que global.Buffer apunte a nuestro Buffer importado
      },
      // Enable esbuild polyfill plugins (puede que no sea estrictamente necesario con lo anterior, pero no hace daño)
      // plugins: [
      //   NodeGlobalsPolyfillPlugin({
      //     buffer: true, process: true // Incluir polyfills para buffer y process si otras dependencias los necesitan
      //   }),
      // ],
    },
  },
   // --- OPCIONALMENTE, AÑADIR 'build' config si también da error al construir para producción ---
   build: {
     rollupOptions: {
       plugins: [
         // Puedes necesitar plugins específicos de rollup si el problema persiste en build
         // Ej: import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
         // rollupNodePolyFill()
       ]
     }
   }
});

// --- NOTA: Si tu archivo ya tiene una configuración, fusiona estas ---
// --- secciones ('resolve', 'optimizeDeps') con tu configuración existente. ---

