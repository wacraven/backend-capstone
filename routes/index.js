const express = require('express');
const router = express.Router();

const pg = require('pg');
const databaseURL = process.env.DATABASE_URL || 'postgres://localhost:5432/serverAPI';
const client = new pg.Client(databaseURL);
client.connect();
const bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);

router.post('/api/login', function(req, res, next) {
  client.query(`
    SELECT * FROM "User"
    WHERE "Username" = '${req.body.Username}';
  `)
  .on('row', (data) => {
    let dbPassword = data.Password
    if (bcrypt.compareSync(req.body.Password, dbPassword)) {
      return res.json({
        status: "OK"
      })
    } else {
      return res.json({
        status: "Passwords do not match"
      })
    }
  })
});

router.post('/api/logout', function(req, res, next) {
  //logout
});


router.post('/api/register', function(req, res, next) {
  let userExists
  client.query(`
    SELECT * FROM "User"
    WHERE "Username" = '${req.body.Username}';
  `)
  .on('row', (data) => userExists = data.Username)
  .on('end', (data) => {
    console.log('USER EXISTS?', userExists);
    if (!userExists) {
      console.log('new user');
      let hashedPassword = bcrypt.hashSync(`${req.body.Password}`, salt);
      let user = {
        ClinicianId: parseInt(Date.now()),
        Name: req.body.FullName,
        Username: req.body.Username,
        Password: hashedPassword
      }
      client.query(`
        INSERT INTO "User" ("Name", "Username", "Password", "ClinicianId")
        VALUES ('${user.Name}','${user.Username}','${user.Password}',${user.ClinicianId})
      `);
      return res.json(user)
    } else {
      return res.json({
        status: 'User already exists'
      })
    }
  })
});

router.post('/api/patient/get/all', function(req, res, next) {
  let patients = []
  client.query(`
    SELECT * FROM "Patient"
    WHERE "ClinicianId" = '${req.body.ClinicianId}'
  `)
  .on('row', (row) => {
    patients.push(row)
  })
  .on('end', () => {
    return res.json(patients)
  })
});

router.post('/api/patient/get/one', function(req, res, next) {
  client.query(`
    SELECT * FROM "Patient"
    WHERE "PatientId" = '${req.body.PatientId}'
  `)
  .on('row', (data) => {
    res.json(data)
  })
});

router.post('/api/patient/new', function(req, res, next) {
  let patient = req.body
  client.query(`
    INSERT INTO "Patient" ("PatientId", "Name", "PrimaryContact", "Phone", "Location", "DateOfBirth", "Diagnosis", "LastEvaluation", "EvaluationFrequency", "Goal1", "Goal2", "Goal3", "SessionTime", "SessionFrequency", "ClinicianId")
    VALUES ('${patient.PatientId}','${patient.Name}','${patient.PrimaryContact}','${patient.Phone}','${patient.Location}','${patient.DateOfBirth}','${patient.Diagnosis}','${patient.LastEvaluation}','${patient.EvaluationFrequency}','${patient.Goal1}','${patient.Goal2}','${patient.Goal3}','${patient.SessionTime}','${patient.SessionFrequency}','${patient.ClinicianId}')
  `)
});

router.post('/api/mileage/get', function(req, res, next) {
  let results = []
  client.query(`
    SELECT * FROM "Mileage"
    WHERE "ClinicianId" = '${req.body.ClinicianId}'
  `)
  .on('row', (row) => {
    results.push(row)
  })
  .on('end', () => {
    return res.json(results)
  })
});

router.post('/api/mileage/new', function(req, res, next) {
  let trip = {
    TripId: req.body.TripId,
    ClinicianId: req.body.ClinicianId,
    Mileage: req.body.Mileage,
    Date: new Date()
  }
  client.query(`
    INSERT INTO "Mileage" ("TripId", "ClinicianId", "Mileage", "Date")
    VALUES ('${trip.TripId}','${trip.ClinicianId}','${trip.Mileage}','${trip.Date}')
  `)
  res.json(trip)
});

module.exports = router;