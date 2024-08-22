const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = 3030;

const cors = require('cors');
app.use(cors())

// Rota para buscar os dados da tabela 'agrupamentos'
app.get('/backup_20062024', (req, res) => {
  let results = [];

  fs.createReadStream('src/api/backup_20062024/agrupamentos.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
          res.json(results);
      });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
