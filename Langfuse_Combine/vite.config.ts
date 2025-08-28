import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
import react from "@vitejs/plugin-react-swc";
import * as path from "node:path";
import viteTsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  server:{
    host:'0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
      }
    }
  },
  plugins: [react(), viteTsconfigPaths()],
  resolve: {
    // alias: [
    //   //{ find: /^~/, replacement: '' },
    //   { find: /^(Components)\//, replacement: path.resolve(__dirname, 'src/Components') + '/' },
    //   { find: /^(ducks)\//, replacement: path.resolve(__dirname, 'src/ducks') + '/' },
    //   { find: /^(hocs)\//, replacement: path.resolve(__dirname, 'src/hocs') + '/' },
    //   { find: /^(Communicator)\//, replacement: path.resolve(__dirname, 'src/Communicator') + '/' },
    //   // { find: /\.js$/, replacement: '' },
    // ],
    alias:{
      Components: path.resolve(__dirname, './src/Components'),
      // ducks: path.resolve(__dirname, './src/ducks'),
      Library: path.resolve(__dirname, './src/Library'),
      Pages: path.resolve(__dirname, './src/Pages'),
      Communicator: path.resolve(__dirname, './src/Communicator'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  optimizeDeps: {
    //noDiscovery: true,
    //exclude: ['node_modules/.vite/deps/*', '/mnt/d/Experiments/vite-test/react-ts/node_modules/.vite/deps', '/mnt/d/Experiments/vite-test/react-ts/node_modules/.vite/deps/*']
  }
})
