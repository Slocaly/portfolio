// @ts-check
import { defineConfig } from 'astro/config';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import mdx from '@astrojs/mdx';

/** Astro integration that replaces `script-src 'self'` in dist/_headers
 *  with exact SHA-256 hashes of every inline script in the built HTML. */
function cspHashes() {
  return {
    name: 'csp-hashes',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const dist = dir.pathname;
        const hashes = new Set();

        function walk(d) {
          for (const entry of readdirSync(d, { withFileTypes: true })) {
            const full = join(d, entry.name);
            if (entry.isDirectory()) {
              walk(full);
            } else if (entry.name.endsWith('.html')) {
              const html = readFileSync(full, 'utf-8');
              for (const [, body] of html.matchAll(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/g)) {
                if (body.trim()) {
                  hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
                }
              }
            }
          }
        }

        walk(dist);

        const headersPath = join(dist, '_headers');
        const updated = readFileSync(headersPath, 'utf-8').replace(
          /script-src ([^;]+)/,
          `script-src 'self' ${[...hashes].join(' ')}`
        );
        writeFileSync(headersPath, updated);

        logger.info(`CSP: injected ${hashes.size} script hashes into _headers`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://slocaly.dev',
  integrations: [mdx(), cspHashes()],
});