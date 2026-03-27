const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/compile', async (req, res) => {
  const { latex } = req.body;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'latex-'));
  const texFile = path.join(tmpDir, 'document.tex');
  const pdfFile = path.join(tmpDir, 'document.pdf');

  fs.writeFileSync(texFile, latex);

  exec(`pdflatex -interaction=nonstopmode -output-directory=${tmpDir} ${texFile}`, (err) => {
    if (fs.existsSync(pdfFile)) {
      const pdf = fs.readFileSync(pdfFile);
      res.set('Content-Type', 'application/pdf');
      res.send(pdf);
    } else {
      res.status(500).json({ error: 'Compilation failed' });
    }
    fs.rmSync(tmpDir, { recursive: true });
  });
});

app.get('/', (req, res) => res.send('LaTeX compiler running!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));