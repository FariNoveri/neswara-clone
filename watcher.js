import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

let changeCounter = 0;
const lastContents = new Map();
const fileHashes = new Map();
const trackedFiles = new Set();

function getHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

function highlightDiff(oldLine, newLine) {
  if (!oldLine || !newLine) return [oldLine || '', chalk.green(newLine || '')];

  let i = 0;
  while (i < oldLine.length && i < newLine.length && oldLine[i] === newLine[i]) i++;

  const commonPrefix = oldLine.slice(0, i);
  const oldDiff = oldLine.slice(i);
  const newDiff = newLine.slice(i);

  return [
    chalk.red(`${commonPrefix}${oldDiff}`),
    chalk.green(`${commonPrefix}${newDiff}`)
  ];
}

function compareFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const newLines = content.split('\n');
  const newHash = getHash(content);
  const oldHash = fileHashes.get(filepath);
  if (newHash === oldHash) return;

  const oldLines = lastContents.get(filepath) || [];
  fileHashes.set(filepath, newHash);
  lastContents.set(filepath, newLines);

  const changes = [];
  for (let i = 0; i < Math.max(newLines.length, oldLines.length); i++) {
    if (newLines[i] !== oldLines[i]) {
      changes.push({ line: i + 1, old: oldLines[i], new: newLines[i] });
    }
  }

  console.log(chalk.cyan(`\n✏️ edited: ${path.relative(process.cwd(), filepath)}`));
  if (changes.length === 1) {
    const { old, new: newer } = changes[0];
    const [oldColored, newColored] = highlightDiff((old || '').trim(), (newer || '').trim());
    console.log(`   → "${oldColored}" → "${newColored}"`);
  } else {
    console.log(
      chalk.yellow(
        `   → Perubahan baris ${changes[0].line} sampai ${changes[changes.length - 1].line}`
      )
    );
  }
  console.log();

  if (++changeCounter >= 5) {
    console.clear();
    console.log(chalk.gray('🧹 Terlalu banyak update, dibersihkan ulang...\n'));
    changeCounter = 0;
  }
}

function printDeleted(filepath) {
  console.log(chalk.redBright(`\n🗑️ deleted file: ${path.relative(process.cwd(), filepath)}\n`));
  if (++changeCounter >= 5) {
    console.clear();
    console.log(chalk.gray('🧹 Notifikasi dibersihkan karena terlalu banyak perubahan.\n'));
    changeCounter = 0;
  }
}

function printAdded(filepath) {
  console.log(chalk.greenBright(`\n🆕 added file: ${path.relative(process.cwd(), filepath)}\n`));
}

const watcher = chokidar.watch('.', {
  ignored: /(^|[\/\\])\..|node_modules|dist|.git/,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 100,
  },
});

watcher
  .on('add', (filepath) => {
    if (!fs.existsSync(filepath) || fs.lstatSync(filepath).isDirectory()) return;

    const content = fs.readFileSync(filepath, 'utf-8');
    const hash = getHash(content);
    const relativePath = path.relative(process.cwd(), filepath);

    let foundCopy = false;
    for (const [oldPath, oldHash] of fileHashes.entries()) {
      if (oldHash === hash && oldPath !== filepath) {
        const oldName = path.basename(oldPath);
        const newName = path.basename(filepath);
        const newFolder = path.dirname(relativePath);

        console.log(
          chalk.magenta(`\n🔁 renamed or copied: ${chalk.strikethrough(oldName)} → ${chalk.bold(newName)}`)
        );
        console.log(chalk.gray(`   📂 new location: ${newFolder}/\n`));
        foundCopy = true;
        break;
      }
    }

    fileHashes.set(filepath, hash);
    lastContents.set(filepath, content.split('\n'));
    trackedFiles.add(filepath);

    if (!foundCopy) printAdded(filepath);
  })
  .on('change', compareFile)
  .on('unlink', (filepath) => {
    trackedFiles.delete(filepath);
    printDeleted(filepath);
  });

process.on('SIGINT', () => {
  console.clear();
  console.log(chalk.redBright('🛑 Watcher dihentikan.\n'));
  process.exit();
});

console.log(chalk.gray('👁️  Watching for file changes...'));
