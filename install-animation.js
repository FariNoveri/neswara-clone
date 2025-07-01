import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import { setTimeout as wait } from 'node:timers/promises';
import cliProgress from 'cli-progress';

const modules = [
  'react', 'firebase', 'tailwindcss', 'vite',
  'react-router-dom', 'axios', 'zustand', 'dotenv'
];

async function startInstaller() {
  console.clear();

  const banner = chalkAnimation.radar('✨ NESWARA INSTALLER ✨');
  await wait(2000);
  banner.stop();

  console.log(chalk.cyanBright('\n📦 Preparing dependencies...\n'));

  const bar = new cliProgress.SingleBar({
    format: `${chalk.greenBright('⏳ Installing')} |{bar}| {percentage}% | {module}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  bar.start(modules.length, 0, {
    module: 'Starting...'
  });

  for (let i = 0; i < modules.length; i++) {
    bar.update(i, { module: `Installing ${modules[i]}...` });
    await wait(600); // simulate install
    bar.update(i + 1, { module: `✅ ${modules[i]}` });
  }

  bar.stop();
  const done = chalkAnimation.karaoke('\n✅ Semua dependensi berhasil diinstal! 🚀');
  await wait(2000);
  done.stop();

  console.log(chalk.magentaBright('\nSelamat berkarya dengan NESWARA!\n'));
}

startInstaller();
