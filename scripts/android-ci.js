#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    ...options,
  });
}

function git(args, options) {
  return run('git', args, options);
}

function getPackageVersion() {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  return appJson.expo?.version;
}

function requireCleanWorkingTree() {
  const status = git(['status', '--porcelain'], { capture: true }).trim();
  if (status) {
    console.error('Working tree has uncommitted changes. Commit or stash them first.');
    console.error(status);
    process.exit(1);
  }
}

function currentBranch() {
  return git(['branch', '--show-current'], { capture: true }).trim();
}

function mergeBuild() {
  const branch = currentBranch();
  if (!branch) {
    console.error('Could not determine the current git branch.');
    process.exit(1);
  }

  console.log(`Pushing current branch: ${branch}`);
  git(['push', '-u', 'origin', branch]);

  console.log('\nNext step: open a PR and merge it into main/master.');
  console.log('After merge, GitHub Actions will run Android Release and upload signed APK/AAB artifacts.');
  console.log('\nIf GitHub CLI is installed, you can create the PR with:');
  console.log(`  gh pr create --base main --head ${branch}`);
}

function releaseTag() {
  requireCleanWorkingTree();

  const version = getPackageVersion();
  if (!version) {
    console.error('Could not read expo.version from app.json.');
    process.exit(1);
  }

  const tag = `v${version}`;
  const existingTag = git(['tag', '--list', tag], { capture: true }).trim();
  if (existingTag) {
    console.error(`Tag ${tag} already exists locally.`);
    console.error('Bump app.json expo.version or delete the tag intentionally before retrying.');
    process.exit(1);
  }

  console.log(`Creating release tag: ${tag}`);
  git(['tag', tag]);
  git(['push', 'origin', tag]);

  console.log('\nGitHub Actions will now build signed Android artifacts and publish a GitHub Release.');
}

const command = process.argv[2];

switch (command) {
  case 'merge-build':
    mergeBuild();
    break;
  case 'release-tag':
    releaseTag();
    break;
  default:
    console.log('Usage:');
    console.log('  node scripts/android-ci.js merge-build');
    console.log('  node scripts/android-ci.js release-tag');
    process.exit(command ? 1 : 0);
}
