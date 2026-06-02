import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

/**
 * Walks up from this package's location to find the workspace root .env
 * and loads it. No-op when .env is absent (production uses platform env vars).
 */
export function loadRootEnv(): void {
  let dir = fileURLToPath(new URL('.', import.meta.url));
  while (true) {
    const envPath = join(dir, '.env');
    if (existsSync(envPath)) {
      config({ path: envPath });
      return;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
}
