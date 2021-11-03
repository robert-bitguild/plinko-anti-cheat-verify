const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.on('listening', () => {
  console.log('server start up');
  console.log(`visit http://localhost:9005`);
});

app.listen(9005);
