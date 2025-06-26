import { spawn } from 'child_process';
import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';

const asciiArt = `
    _   ______________       _____    ____  ___
   / | / / ____/ ___/ |     / /   |  / __ \\/   |
  /  |/ / __/  \\__ \\| | /| / / /| | / /_/ / /| |
 / /|  / /___ ___/ /| |/ |/ / ___ |/ _, _/ ___ |
/_/ |_/_____//____/ |__/|__/_/  |_/_/ |_/_/  |_|`;

const procs = [];

function run(label, command, color) {
  const proc = spawn(command, { shell: true });
  procs.push(proc);

  proc.stdout.on('data', data => {
    process.stdout.write(chalk[color](`[${label}] `) + data.toString());
  });

  proc.stderr.on('data', data => {
    const lines = data.toString().split('\n');

    const importantLines = lines.filter(line =>
      !line.includes('node_modules') &&
      !line.includes('vite/dist') &&
      !line.includes('internal') &&
      !line.includes('rollup-plugin') &&
      !line.trim().startsWith('at ')
    );

    if (importantLines.length > 0) {
      console.log(chalk.red(`\n[${label} ERROR]`));
      importantLines.forEach(line => {
        if (line.trim() === '^') {
          console.log('  ' + chalk.redBright.bgYellow.bold('^ 🔥 [ERROR DISINI]'));
        } else {
          console.log(chalk.redBright('→ ' + line.trim()));
        }
      });
      console.log(); // spacing
    }
  });

  proc.on('close', code => {
    console.log(chalk.gray(`[${label}] exited with code ${code}`));
  });
}

(async () => {
  console.clear();

  const radar = chalkAnimation.radar(asciiArt);
  await new Promise(r => setTimeout(r, 2500));
  radar.stop();

  console.clear();
  console.log(chalk.cyan(asciiArt));

  const loading = chalkAnimation.karaoke('\n📦 Menyiapkan server NESWARA...\n');
  await new Promise(r => setTimeout(r, 2000));
  loading.stop();

  console.log(chalk.gray('⏳ Menjalankan semua modul...\n'));
  run('Watcher', 'node watcher.js', 'yellow');
  run('Backend', 'node server.js', 'green');
  run('Frontend', 'vite', 'cyan');
})();

process.on('SIGINT', async () => {
  console.clear();
  const exitAnim = chalkAnimation.pulse('🛑 Menghentikan semua proses...');
  await new Promise(r => setTimeout(r, 1500));
  exitAnim.stop();

  for (const proc of procs) {
    try {
      proc.kill();
    } catch {}
  }

  process.stdout.write('\x1Bc');
  console.clear();
  await new Promise(r => setTimeout(r, 300));

  console.log(chalk.redBright.bold(asciiArt));
  console.log(chalk.redBright('\n✨ Semua proses telah dihentikan. Sampai jumpa!\n'));
  console.log(chalk.redBright('\nSilahkan klik enter lalu ketik huruf y dan enter di keyboard\n'));
  await new Promise(r => setTimeout(r, 2000));
  process.exit(0);
});
