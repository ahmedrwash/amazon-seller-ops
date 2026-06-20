import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function git(args, fallback) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

const fullCommit = process.env.GITHUB_SHA || git(['rev-parse', 'HEAD'], 'unknown');
const checkedOutBranch = git(['branch', '--show-current'], '');
const inferredBranch = git(['name-rev', '--name-only', '--exclude=tags/*', 'HEAD'], 'detached')
  .replace(/^remotes\/origin\//, '');
const branch = process.env.GITHUB_REF_NAME || checkedOutBranch || inferredBranch;
const buildInfo = {
  commit: fullCommit === 'unknown' ? fullCommit : fullCommit.slice(0, 8),
  branch: branch || 'detached',
  builtAt: new Date().toISOString(),
};

const publicDir = path.join(root, 'public');
mkdirSync(publicDir, { recursive: true });
writeFileSync(path.join(publicDir, 'build-info.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);

console.log(`Build info: ${buildInfo.commit} (${buildInfo.branch})`);
