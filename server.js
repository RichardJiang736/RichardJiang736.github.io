// Express server configuration for clean URLs
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(__dirname));

// Handle clean URLs by removing .html extension
app.get('*', (req, res, next) => {
  // If the request is for a file that exists, serve it
  if (req.path.includes('.')) {
    return next();
  }
  
  // Try to serve the .html version
  const htmlPath = path.join(__dirname, req.path + '.html');
  
  // Check if the HTML file exists
  require('fs').access(htmlPath, require('fs').constants.F_OK, (err) => {
    if (!err) {
      res.sendFile(htmlPath);
    } else {
      // If no HTML file, try serving as directory with index.html
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