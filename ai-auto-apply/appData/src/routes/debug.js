const express = require('express');
const router = express.Router();

router.get('/current-user', (req, res) => {
  res.json({
    message: 'Debug endpoint - current user info would be shown here',
    headers: req.headers,
    query: req.query
  });
});

module.exports = router;
