const { spawn } = require('child_process');

console.log('Testing spawn...');
console.log('Platform:', process.platform);
console.log('CWD:', __dirname);

const child = spawn('npm.cmd', ['run', 'quick-scan'], {
  env: { ...process.env, BASE_URL: 'https://vvrtechnologies.com/index.html' },
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

child.on('error', err => {
  console.error('SPAWN ERROR:', err.message);
  process.exit(1);
});

child.on('close', code => {
  console.log('CLOSED with exit code:', code);
  process.exit(code);
});

