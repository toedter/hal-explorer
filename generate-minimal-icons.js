#!/usr/bin/env node

/**
 * Generate a minimal Bootstrap Icons font subset
 * This script extracts only the icons used in HAL Explorer
 *
 * Usage:
 *   node generate-minimal-icons.js
 *
 * Prerequisites:
 *   npm install -g fonttools-cli
 *   OR
 *   pip install fonttools brotli
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Icons used in HAL Explorer with their Unicode code points
const iconsUsed = [
  { name: 'chevron-left', unicode: 'f284', usage: 'GET button' },
  { name: 'plus-lg', unicode: 'f64d', usage: 'POST button' },
  { name: 'chevron-double-right', unicode: 'f280', usage: 'PUT button' },
  { name: 'chevron-right', unicode: 'f285', usage: 'PATCH button' },
  { name: 'x-lg', unicode: 'f659', usage: 'DELETE button' },
  { name: 'book', unicode: 'f194', usage: 'Documentation button' },
  { name: 'sun-fill', unicode: 'f5a1', usage: 'Light mode' },
  { name: 'moon-stars-fill', unicode: 'f495', usage: 'Dark mode' },
  { name: 'circle-half', unicode: 'f288', usage: 'Auto mode' },
  { name: 'check', unicode: 'f26e', usage: 'Checkmark (plain)' },
  { name: 'check2', unicode: 'f272', usage: 'Checkmark (thicker)' },
];

const sourceFont = 'node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2';
const outputDir = 'src/assets/fonts';
const outputWoff2 = path.join(outputDir, 'bootstrap-icons-minimal.woff2');
const outputWoff = path.join(outputDir, 'bootstrap-icons-minimal.woff');

console.log('🎨 Bootstrap Icons Minimal Font Generator');
console.log('==========================================\n');

console.log(`📦 Icons to include: ${iconsUsed.length}`);
iconsUsed.forEach(icon => {
  console.log(`   • ${icon.name} (U+${icon.unicode}) - ${icon.usage}`);
});
console.log();

// Check if source font exists
if (!fs.existsSync(sourceFont)) {
  console.error('❌ Error: Bootstrap Icons font not found!');
  console.error(`   Expected at: ${sourceFont}`);
  console.error('   Run: yarn install');
  process.exit(1);
}

// Create output directory
if (!fs.existsSync(outputDir)) {
  console.log(`📁 Creating output directory: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });
}

// Build unicode string for pyftsubset
const unicodes = iconsUsed.map(icon => `U+${icon.unicode}`).join(',');

console.log('⚙️  Checking for fonttools...\n');

// Check if pyftsubset is available
try {
  execSync('pyftsubset --help', { stdio: 'ignore' });
  console.log('✅ fonttools found!\n');
} catch (error) {
  console.error('❌ Error: pyftsubset (fonttools) not found!');
  console.error('   Install with: pip install fonttools brotli');
  console.error('   OR use IcoMoon App: https://icomoon.io/app/');
  process.exit(1);
}

// Generate woff2
console.log('🔨 Generating .woff2 font...');
try {
  execSync(`pyftsubset "${sourceFont}" --unicodes="${unicodes}" --output-file="${outputWoff2}" --flavor=woff2`, {
    stdio: 'inherit'
  });
  const stats = fs.statSync(outputWoff2);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`✅ Created: ${outputWoff2} (${sizeKB} KB)\n`);
} catch (error) {
  console.error('❌ Error generating .woff2 file');
  process.exit(1);
}

// Generate woff
console.log('🔨 Generating .woff font...');
try {
  execSync(`pyftsubset "${sourceFont}" --unicodes="${unicodes}" --output-file="${outputWoff}" --flavor=woff`, {
    stdio: 'inherit'
  });
  const stats = fs.statSync(outputWoff);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`✅ Created: ${outputWoff} (${sizeKB} KB)\n`);
} catch (error) {
  console.error('❌ Error generating .woff file');
  process.exit(1);
}

// Calculate savings
const originalSize = fs.statSync(sourceFont).size;
const newSize = fs.statSync(outputWoff2).size;
const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

console.log('📊 Size Comparison:');
console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   Minimal:  ${(newSize / 1024).toFixed(2)} KB`);
console.log(`   Savings:  ${savings}% reduction! 🎉\n`);

console.log('✅ Font generation complete!');
console.log('\n📝 Next steps:');
console.log('   1. Update angular.json to use: src/assets/bootstrap-icons-minimal.css');
console.log('   2. Run: yarn build');
console.log('   3. Check dist/ folder for reduced font sizes');
console.log('\n   See BOOTSTRAP-ICONS-MINIMAL-GUIDE.md for details');

