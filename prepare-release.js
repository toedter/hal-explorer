#!/usr/bin/env node

/**
 * Release Preparation Script
 *
 * This script:
 * 1. Reads the current release version from the last git tag
 * 2. Calculates the current snapshot version (current release + 1 patch)
 * 3. Calculates the next release version by analyzing commits since the last tag
 *    - Uses conventional commits (feat:, fix:, BREAKING CHANGE, etc.)
 *    - Or accepts a manual version override via command line argument
 * 4. Calculates the next snapshot version (next release + 1 patch)
 * 5. Replaces all occurrences in:
 *    - README.adoc
 *    - doc/setup.adoc
 *    - build.gradle
 *    - package.json
 *    - src/app/app.component.ts
 *
 * Conventional commit rules:
 * - feat: or feat(scope): → Minor version bump
 * - fix:, perf:, or similar → Patch version bump
 * - BREAKING CHANGE or !: → Major version bump
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function parseVersion(versionString) {
  const match = versionString.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${versionString}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function incrementMinorVersion(version) {
  return {
    major: version.major,
    minor: version.minor + 1,
    patch: 0,
  };
}

function incrementPatchVersion(version) {
  return {
    major: version.major,
    minor: version.minor,
    patch: version.patch + 1,
  };
}

function versionToString(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✓ Updated ${filePath}`, colors.green);
  } catch (error) {
    throw new Error(`Failed to write ${filePath}: ${error.message}`);
  }
}

function extractCurrentReleaseVersion() {
  const { execSync } = require('child_process');

  try {
    // Get the last git tag
    const tagOutput = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();

    // Remove 'v' prefix if present (e.g., v1.2.3 -> 1.2.3)
    const version = tagOutput.replace(/^v/, '');

    // Validate version format
    const match = version.match(/^(\d+\.\d+\.\d+)$/);
    if (!match) {
      throw new Error(`Invalid version format in git tag: ${tagOutput}`);
    }

    return version;
  } catch (error) {
    throw new Error(
      `Failed to extract version from git tags: ${error.message}. Make sure you have at least one git tag.`
    );
  }
}

function calculateCurrentSnapshotVersion(currentRelease) {
  // Current snapshot = current release + 1 patch
  const currentReleaseVersion = parseVersion(currentRelease);
  const currentSnapshotVersion = incrementPatchVersion(currentReleaseVersion);
  return versionToString(currentSnapshotVersion);
}

function getCommitsSinceLastTag() {
  const { execSync } = require('child_process');

  try {
    // Get the last git tag
    const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();

    // Get all commit messages since the last tag
    const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:%s`, { encoding: 'utf8' }).trim();

    if (!commits) {
      return [];
    }

    return commits.split('\n');
  } catch (error) {
    throw new Error(`Failed to get commits since last tag: ${error.message}`);
  }
}

function calculateNextVersionFromCommits(currentRelease) {
  const commits = getCommitsSinceLastTag();

  if (commits.length === 0) {
    log('  No commits since last release, incrementing patch version', colors.yellow);
    const currentVersion = parseVersion(currentRelease);
    return versionToString(incrementPatchVersion(currentVersion));
  }

  let hasMajorChange = false;
  let hasMinorChange = false;
  let hasPatchChange = false;

  commits.forEach(commit => {
    const commitLower = commit.toLowerCase();

    // Check for breaking changes (major version bump)
    if (commitLower.includes('breaking change') || commitLower.includes('!:') || commitLower.match(/^[a-z]+!:/)) {
      hasMajorChange = true;
      log(`  Breaking change detected: ${commit}`, colors.yellow);
    }
    // Check for features (minor version bump)
    else if (commitLower.startsWith('feat:') || commitLower.startsWith('feat(')) {
      hasMinorChange = true;
      log(`  Feature detected: ${commit}`, colors.cyan);
    }
    // Check for fixes and other changes (patch version bump)
    else if (
      commitLower.startsWith('fix:') ||
      commitLower.startsWith('fix(') ||
      commitLower.startsWith('perf:') ||
      commitLower.startsWith('perf(')
    ) {
      hasPatchChange = true;
    }
  });

  const currentVersion = parseVersion(currentRelease);
  let nextVersion;

  if (hasMajorChange) {
    log(`  Incrementing MAJOR version due to breaking changes`, colors.green);
    nextVersion = {
      major: currentVersion.major + 1,
      minor: 0,
      patch: 0,
    };
  } else if (hasMinorChange) {
    log(`  Incrementing MINOR version due to new features`, colors.green);
    nextVersion = incrementMinorVersion(currentVersion);
  } else if (hasPatchChange || commits.length > 0) {
    log(`  Incrementing PATCH version due to fixes/changes`, colors.green);
    nextVersion = incrementPatchVersion(currentVersion);
  } else {
    log(`  No significant changes, incrementing PATCH version`, colors.green);
    nextVersion = incrementPatchVersion(currentVersion);
  }

  return versionToString(nextVersion);
}

function replaceInFile(filePath, replacements) {
  let content = readFile(filePath);
  let changeCount = 0;

  replacements.forEach(({ from, to, isRegex }) => {
    const regex = isRegex ? new RegExp(from, 'g') : new RegExp(escapeRegExp(from), 'g');
    const matches = content.match(regex);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(regex, to);
    }
  });

  if (changeCount > 0) {
    writeFile(filePath, content);
    log(`  → ${changeCount} replacement(s) made`, colors.cyan);
  } else {
    log(`  → No changes needed`, colors.yellow);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updatePackageJson(currentSnapshot, nextRelease) {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(readFile(packagePath));

  // Update version in package.json to the new release version
  const currentPackageVersion = packageJson.version;
  const nextPackageVersion = nextRelease;

  packageJson.version = nextPackageVersion;
  writeFile(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`  → Updated version: ${currentPackageVersion} → ${nextPackageVersion}`, colors.cyan);
}

function main() {
  try {
    log('\n' + '='.repeat(60), colors.bright);
    log('HAL Explorer - Release Preparation Script', colors.bright);
    log('='.repeat(60) + '\n', colors.bright);

    // Check for command-line argument
    const args = process.argv.slice(2);
    const specifiedVersion = args[0];

    // Step 1: Extract current versions
    log('Step 1: Extracting current versions...', colors.blue);
    const currentRelease = extractCurrentReleaseVersion();
    const currentSnapshot = calculateCurrentSnapshotVersion(currentRelease);

    log(`  Current Release:  ${currentRelease}`, colors.cyan);
    log(`  Current Snapshot: ${currentSnapshot}-SNAPSHOT`, colors.cyan);

    // Step 2: Calculate next versions
    log('\nStep 2: Calculating next versions...', colors.blue);

    let nextRelease;
    let nextReleaseVersion;

    if (specifiedVersion) {
      // Use the specified version
      try {
        nextReleaseVersion = parseVersion(specifiedVersion);
        nextRelease = specifiedVersion;
        log(`  Using specified release version: ${nextRelease}`, colors.green);
      } catch (error) {
        throw new Error(`Invalid version format provided: ${specifiedVersion}. Expected format: X.Y.Z`);
      }
    } else {
      // Calculate version based on commits since last release
      log(`  Analyzing commits since last release...`, colors.cyan);
      nextRelease = calculateNextVersionFromCommits(currentRelease);
      nextReleaseVersion = parseVersion(nextRelease);
    }

    const nextSnapshotVersion = incrementPatchVersion(nextReleaseVersion);
    const nextSnapshot = versionToString(nextSnapshotVersion);

    log(`  Next Release:     ${nextRelease}`, colors.green);
    log(`  Next Snapshot:    ${nextSnapshot}-SNAPSHOT`, colors.green);

    // Step 3: Confirm with user
    log('\nStep 3: Updating files...', colors.blue);

    const filesToUpdate = ['README.adoc', 'doc/setup.adoc'];

    filesToUpdate.forEach(file => {
      const filePath = path.join(__dirname, file);
      log(`\nUpdating ${file}...`, colors.yellow);

      replaceInFile(filePath, [
        { from: currentRelease, to: nextRelease },
        { from: '\\d+\\.\\d+\\.\\d+-SNAPSHOT', to: `${nextSnapshot}-SNAPSHOT`, isRegex: true },
      ]);
    });

    // Update build.gradle to use the new release version
    log(`\nUpdating build.gradle...`, colors.yellow);
    const gradlePath = path.join(__dirname, 'build.gradle');
    replaceInFile(gradlePath, [{ from: '\\d+\\.\\d+\\.\\d+-SNAPSHOT', to: nextRelease, isRegex: true }]);

    // Update app.component.ts to use the next snapshot version
    log(`\nUpdating src/app/app.component.ts...`, colors.yellow);
    const appComponentPath = path.join(__dirname, 'src/app/app.component.ts');
    replaceInFile(appComponentPath, [{ from: "'\\d+\\.\\d+\\.\\d+-SNAPSHOT'", to: `'${nextRelease}'`, isRegex: true }]);

    // Update package.json to use the new release version
    log(`\nUpdating package.json...`, colors.yellow);
    updatePackageJson(currentSnapshot, nextRelease);

    // Summary
    log('\n' + '='.repeat(60), colors.bright);
    log('Release preparation completed successfully!', colors.green + colors.bright);
    log('='.repeat(60), colors.bright);
    log('\nSummary of changes:', colors.blue);
    log(`  ${currentRelease} → ${nextRelease}`, colors.cyan);
    log(`  *-SNAPSHOT → ${nextSnapshot}-SNAPSHOT`, colors.cyan);
    log('\nVersions set:', colors.blue);
    log(`  build.gradle:          ${nextRelease}`, colors.cyan);
    log(`  package.json:          ${nextRelease}`, colors.cyan);
    log(`  app.component.ts:      ${nextRelease}`, colors.cyan);
    log(`  Documentation:         ${nextRelease} (release), ${nextSnapshot}-SNAPSHOT (snapshot)`, colors.cyan);
    log('\nNext steps:', colors.blue);
    log('  1. Review the changes with: git diff', colors.cyan);
    log('  2. Commit the changes: git add . && git commit -m "chore: prepare release"', colors.cyan);
    log('  3. Create a release tag: git tag -a v' + nextRelease + ' -m "Release ' + nextRelease + '"', colors.cyan);
    log('  4. Push changes: git push && git push --tags\n', colors.cyan);
  } catch (error) {
    log('\n❌ Error: ' + error.message, colors.bright);
    log('\nUsage:', colors.blue);
    log(
      '  npm run prepare:release           - Auto-calculate version from commits (conventional commits)',
      colors.cyan
    );
    log('  npm run prepare:release 2.0.0     - Use specific version 2.0.0', colors.cyan);
    log('  npm run prepare:release X.Y.Z     - Use specific version X.Y.Z', colors.cyan);
    log('\nCommit conventions:', colors.blue);
    log('  feat:                             - Increments MINOR version', colors.cyan);
    log('  fix:, perf:                       - Increments PATCH version', colors.cyan);
    log('  BREAKING CHANGE or !:             - Increments MAJOR version\n', colors.cyan);
    process.exit(1);
  }
}

// Run the script
main();
