#!/usr/bin/env node

/**
 * Release Preparation Script
 *
 * This script:
 * 1. Reads the current release version from README.adoc
 * 2. Reads the current snapshot version from build.gradle
 * 3. Calculates the next release version (incrementing minor version)
 * 4. Calculates the next snapshot version (incrementing minor version + SNAPSHOT)
 * 5. Replaces all occurrences in:
 *    - README.adoc
 *    - doc/setup.adoc
 *    - build.gradle
 *    - package.json
 *    - src/app/app.component.ts
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
  const readmePath = path.join(__dirname, 'README.adoc');
  const content = readFile(readmePath);

  // Look for the release version in the table: | Release | 1.2.3 |
  const match = content.match(/\|\s*Release\s*\|\s*(\d+\.\d+\.\d+)\s*\|/);
  if (!match) {
    throw new Error('Could not find current release version in README.adoc');
  }

  return match[1];
}

function extractCurrentSnapshotVersion() {
  const gradlePath = path.join(__dirname, 'build.gradle');
  const content = readFile(gradlePath);

  // Look for: version = '2.0.0-SNAPSHOT'
  const match = content.match(/version\s*=\s*['"](\d+\.\d+\.\d+)-SNAPSHOT['"]/);
  if (!match) {
    throw new Error('Could not find current snapshot version in build.gradle');
  }

  return match[1];
}

function replaceInFile(filePath, replacements) {
  let content = readFile(filePath);
  let changeCount = 0;

  replacements.forEach(({ from, to }) => {
    const regex = new RegExp(escapeRegExp(from), 'g');
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
    const currentSnapshot = extractCurrentSnapshotVersion();

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
      // Auto-increment minor version
      const currentReleaseVersion = parseVersion(currentRelease);
      nextReleaseVersion = incrementMinorVersion(currentReleaseVersion);
      nextRelease = versionToString(nextReleaseVersion);
      log(`  Auto-incrementing minor version`, colors.green);
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
        { from: `${currentSnapshot}-SNAPSHOT`, to: `${nextSnapshot}-SNAPSHOT` },
      ]);
    });

    // Update build.gradle to use the new release version
    log(`\nUpdating build.gradle...`, colors.yellow);
    const gradlePath = path.join(__dirname, 'build.gradle');
    replaceInFile(gradlePath, [{ from: `${currentSnapshot}-SNAPSHOT`, to: nextRelease }]);

    // Update app.component.ts to use the next snapshot version
    log(`\nUpdating src/app/app.component.ts...`, colors.yellow);
    const appComponentPath = path.join(__dirname, 'src/app/app.component.ts');
    replaceInFile(appComponentPath, [{ from: `'${currentSnapshot}-SNAPSHOT'`, to: `'${nextRelease}'` }]);

    // Update package.json to use the new release version
    log(`\nUpdating package.json...`, colors.yellow);
    updatePackageJson(currentSnapshot, nextRelease);

    // Summary
    log('\n' + '='.repeat(60), colors.bright);
    log('Release preparation completed successfully!', colors.green + colors.bright);
    log('='.repeat(60), colors.bright);
    log('\nSummary of changes:', colors.blue);
    log(`  ${currentRelease} → ${nextRelease}`, colors.cyan);
    log(`  ${currentSnapshot}-SNAPSHOT → ${nextSnapshot}-SNAPSHOT`, colors.cyan);
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
    log('  npm run prepare:release           - Auto-increment minor version', colors.cyan);
    log('  npm run prepare:release 2.0.0     - Use specific version 2.0.0', colors.cyan);
    log('  npm run prepare:release X.Y.Z     - Use specific version X.Y.Z\n', colors.cyan);
    process.exit(1);
  }
}

// Run the script
main();
