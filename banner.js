import figlet from 'figlet';
import chalk from 'chalk';

console.clear();

console.log(
  chalk.cyanBright(
    figlet.textSync('NESWARA', { font: 'Slant' })
  )
);

const text = '💻 Menyiapkan server NESWARA...';
let i = 0;

const typing = setInterval(() => {
  process.stdout.write(text[i]);
  i++;
  if (i === text.length) {
    clearInterval(typing);
    process.stdout.write('\n\n');
  }
}, 50);

process.on('SIGINT', () => {
  console.clear();
  console.log('👋 Proses dibatalkan oleh pengguna.');
  process.exit();
});
