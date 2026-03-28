const express = require('express');
const cors = require('cors');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Install pdflatex on startup
try {
  execSync('which pdflatex');
  console.log('pdflatex already installed');
} catch {
  console.log('Installing pdflatex...');
  try {
    execSync('apt-get update -qq && apt-get install -y -qq texlive-latex-base texlive-latex-recommended texlive-fonts-recommended', { stdio: 'inherit' });
    console.log('pdflatex installed!');
  } catch(e) {
    console.log('Could not install pdflatex:', e.message);
  }
}

app.post('/compile', (req, res) => {
  const { latex } = req.body;
  if (!latex) return res.status(400).json({ error: 'No latex content' });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'latex-'));
  const texFile = path.join(tmpDir, 'document.tex');
  const pdfFile = path.join(tmpDir, 'document.pdf');

  fs.writeFileSync(texFile, latex);

  exec(`pdflatex -interaction=nonstopmode -output-directory="${tmpDir}" "${texFile}" 2>&1`, (err, stdout) => {
    if (fs.existsSync(pdfFile)) {
      const pdf = fs.readFileSync(pdfFile);
      res.set('Content-Type', 'application/pdf');
      res.send(pdf);
    } else {
      res.status(500).json({ error: stdout || 'Compilation failed' });
    }
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });
});

app.get('/', (req, res) => res.send('Mercurio compiler running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));