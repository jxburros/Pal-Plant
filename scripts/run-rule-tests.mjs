import { mkdir, rm, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const testEntry = process.argv[2];

if (!testEntry) {
  console.error('Usage: node scripts/run-rule-tests.mjs <test-file>');
  process.exit(1);
}

const DIST_DIR = '.rule-test-dist';
const DIST_PACKAGE_JSON = `${DIST_DIR}/package.json`;
const DIST_TEST_ENTRY = `${DIST_DIR}/${testEntry}`;

await rm(DIST_DIR, { recursive: true, force: true });
execSync('tsc -p tsconfig.rules.json', { stdio: 'inherit' });
await mkdir(DIST_DIR, { recursive: true });
await writeFile(DIST_PACKAGE_JSON, '{"type":"commonjs"}\n');
execSync(`node ${DIST_TEST_ENTRY}`, { stdio: 'inherit' });
