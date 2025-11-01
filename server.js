const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

app.get('*', (req, res, next) => {
  if (req.path.includes('.')) {
    return next();
  }
  
  const htmlPath = path.join(__dirname, req.path + '.html');
  
  require('fs').access(htmlPath, require('fs').constants.F_OK, (err) => {
    if (!err) {
      res.sendFile(htmlPath);
    } else {
      const indexPath = path.join(__dirname, req.path, 'index.html');
      require('fs').access(indexPath, require('fs').constants.F_OK, (err) => {
        if (!err) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Page not found');
        }
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});