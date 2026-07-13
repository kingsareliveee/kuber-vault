// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

function generateIndexHtml() {
  return {
    name: "generate-index-html",
    apply: "build",
    enforce: "post",
    generateBundle(options: any, bundle: any) {
      const isClient = options.dir && options.dir.endsWith("client");
      if (!isClient) return;
      
      const entryChunk = Object.values(bundle).find((chunk: any) => chunk.isEntry && chunk.type === 'chunk') as any;
      if (!entryChunk) return;
      
      // Find all css assets
      const cssAssets = Object.values(bundle).filter(
        (asset: any) => asset.type === 'asset' && asset.fileName.endsWith('.css')
      );
      
      const cssImports = cssAssets.map(
        (css: any) => `<link rel="stylesheet" href="/${css.fileName}" crossorigin>`
      ).join("\n    ");
      
      const jsImport = `<script type="module" src="/${entryChunk.fileName}"></script>`;
      
      const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>Kuber Vault</title>
    ${cssImports}
    <link rel="manifest" href="/manifest.webmanifest">
  </head>
  <body>
    ${jsImport}
  </body>
</html>`;
      
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source: html
      });
      console.log(`\nGenerated index.html with entry ${entryChunk.fileName}`);
    },
    async closeBundle() {
      const fs = await import("fs");
      const path = await import("path");
      
      const pwaFiles = ["sw.js"];
      if (fs.existsSync("dist")) {
        const filesInDist = fs.readdirSync("dist");
        const workboxFile = filesInDist.find(f => f.startsWith("workbox-") && f.endsWith(".js"));
        if (workboxFile) pwaFiles.push(workboxFile);
        
        for (const file of pwaFiles) {
          const src = path.join("dist", file);
          const dest = path.join("dist/client", file);
          if (fs.existsSync(src)) {
            // Ensure client directory exists
            if (!fs.existsSync("dist/client")) {
              fs.mkdirSync("dist/client", { recursive: true });
            }
            fs.renameSync(src, dest);
            console.log(`Moved PWA asset: ${file} -> dist/client/${file}`);
          }
        }
      }
    }
  };
}

export default defineConfig({
  tanstackStart: {
    ssr: false,
  },
  nitro: false,
  vite: {
    build: {
      manifest: true,
    },
    plugins: [
      generateIndexHtml(),
      {
        name: 'mock-pwa-register-ssr',
        enforce: 'pre',
        resolveId(id: string, importer: any, options: any) {
          if (id === 'virtual:pwa-register' && options?.ssr) {
            return id;
          }
        },
        load(id: string, options: any) {
          if (id === 'virtual:pwa-register' && options?.ssr) {
            return `export function registerSW() {}`;
          }
        }
      },
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        includeAssets: ["favicon.png", "logo.png", "apple-touch-icon.png"],
        manifest: {
          name: "Kuber Vault",
          short_name: "Kuber",
          description: "Premium Personal Finance Manager",
          theme_color: "#16A34A",
          background_color: "#FFFFFF",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,ttf}"],
        },
      })
    ],
  },
});
