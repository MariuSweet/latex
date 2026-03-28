const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
 
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
 
app.post('/compile', (req, res) => {
  const { latex, files } = req.body;
  if (!latex) return res.status(400).json({ error: 'No latex content' });
 
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'latex-'));
 
  try {
    // Write all files to tmpDir
    if (files && typeof files === 'object') {
      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(tmpDir, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, content || '');
      }
    } else {
      // fallback: just write main.tex
      fs.writeFileSync(path.join(tmpDir, 'document.tex'), latex);
    }
 
    const mainFile = path.join(tmpDir, 'main.tex');
    const pdfFile = path.join(tmpDir, 'main.pdf');
 
    const cmd = `pdflatex -interaction=nonstopmode -output-directory="${tmpDir}" "${mainFile}" 2>&1`;
 
    // Run twice for references
    exec(cmd, (err, stdout) => {
      exec(cmd, (err2, stdout2) => {
        if (fs.existsSync(pdfFile)) {
          const pdf = fs.readFileSync(pdfFile);
          res.set('Content-Type', 'application/pdf');
          res.send(pdf);
        } else {
          res.status(500).json({ error: stdout2 || stdout || 'Compilation failed' });
        }
        try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  }
});
 
app.get('/', (req, res) => res.send('Mercurio compiler running!'));
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));