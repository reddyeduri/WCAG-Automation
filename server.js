const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/playwright-report', express.static(path.join(__dirname, 'playwright-report')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

app.get('/favicon.ico', (_req, res) => res.sendStatus(204));

app.post('/run', (req, res) => {
  let url = String(req.body?.url || '').trim();
  url = url.replace(/^["']|["']$/g, ''); // strip quotes
  
  console.log('[/run] Received URL:', url);
  
  if (!url) return res.status(400).json({ error: 'Missing URL' });
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  try {
    new URL(url); // validate
  } catch (e) {
    console.error('[/run] Invalid URL:', e.message);
    return res.status(400).json({ error: 'Provide a valid http(s) URL' });
  }

  console.log('[/run] Starting Playwright for:', url);

  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = ['run', 'quick-scan'];

  const child = spawn(cmd, args, {
    env: { ...process.env, BASE_URL: url },
    cwd: __dirname,
    shell: true
  });

  let responded = false;

  child.on('error', err => {
    console.error('[/run] Spawn error:', err);
    if (!responded) {
      responded = true;
      res.status(500).json({ error: `Spawn failed: ${err.message}` });
    }
  });

  child.on('close', code => {
    console.log('[/run] Playwright finished with exit code:', code);
    if (!responded) {
      responded = true;
      if (code === 0) {
        res.json({ 
          ok: true, 
          report: '/playwright-report/index.html',
          wcagReports: '/reports/quick-scan/'
        });
      } else {
        res.status(500).json({ error: `Playwright exited with code ${code}. Check server console.` });
      }
    }
  });

  // Timeout safety (10 minutes)
  setTimeout(() => {
    if (!responded) {
      responded = true;
      console.error('[/run] Timeout after 10 minutes');
      res.status(500).json({ error: 'Test run timed out after 10 minutes' });
      try { child.kill(); } catch {}
    }
  }, 600000);
});

app.listen(3001, () => {
  console.log('✅ WCAG UI running at http://localhost:3001');
  console.log('📂 Working directory:', __dirname);
});
