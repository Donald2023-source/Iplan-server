const express = require('express');
const { juniorSubjects, seniorSubjects } = require('../staticData');

const router = express.Router();

// Fetch all subjects for a class
router.get('/classes/:classId/subjects', (req, res) => {
    const classId = parseInt(req.params.classId, 10);
  
    let subjects;
    if (classId <= 3) {
      subjects = juniorSubjects;
    } else { 
      subjects = seniorSubjects;
    }
  
    res.status(200).json(subjects);
  });