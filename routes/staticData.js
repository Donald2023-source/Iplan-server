const express = require('express');
const { subjects, classes } = require('../staticData');

const router = express.Router();


router.get('/subjects', (req, res) => {
  res.status(200).json(subjects);
});


router.get('/classes', (req, res) => {
  res.status(200).json(classes);
});

module.exports = router;
