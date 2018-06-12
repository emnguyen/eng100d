const questions = require("../questions.json");
//const markets = require("../markets.json");
const sqlite3 = require('sqlite3');
let marketdb = new sqlite3.Database('./markets.db');

exports.view = function(req, res) {
  marketdb.all('SELECT * FROM markets', (err,rows) => {
    if (rows.length > 0) {
      const markets = JSON.parse(rows[0].data);

      res.render("assess", {
        questions, markets,
        title: "Market Assessment | LWCMP Tool"
      });

    }
    else {
      console.log("Database is empty");
    }
  });
};

exports.viewAssessment = function(req, res) {
  let market = req.params.market;
  let time = req.params.time;

  market = market.toString();
  let submission;
  let marketInfo;

  marketdb.all('SELECT * FROM markets', (err,rows) => {
    if (rows.length > 0) {
      const markets = JSON.parse(rows[0].data);

      // Iterate through all markets
      for (let i = 0; i < markets.length; i++) {
        // Skip until matching market is found
        if (market !== markets[i].name)
          continue;

        // Iterate through market's assessments
        let assessments = markets[i].assessments;
        for (let j = 0; j < assessments.length; j++) {

          // If timestamp matches, assessment is found
          let currTime = assessments[j].evaluator.time;
          if (time == currTime) {
            submission = assessments[j];
          }

        }
        marketInfo = {
          name: markets[i].name,
          address: markets[i].address.address + ", " + markets[i].address.city + ", " + markets[i].address.state
    + " " + markets[i].address.zip,
          storeType: markets[i].storeType,
          level: markets[i].level,
          time: time
        }
      }

      res.render("submission", {
        marketInfo,
        submission,
        title: market + " Assessment (ID " + time + ") | LWCMP Tool"
      });

    }
    else {
      console.log("Database is empty");
    }
  });
};

exports.deleteAssessment = function(req, res) {
  let market = req.params.market;
  let time = req.params.time;

  market = market.toString();

  // Iterate through all markets
  for (let i = 0; i < markets.length; i++) {
    // Skip until matching market is found
    if (market !== markets[i].name)
      continue;

    // Iterate through market's assessments
    let assessments = markets[i].assessments;
    for (let j = 0; j < assessments.length; j++) {

      // If timestamp matches, assessment is found
      let currTime = assessments[j].evaluator.time;
      if (time == currTime) {
        // Delete assessment from database
        assessments.splice(j, 1);
      }

    }
  }

  res.redirect('/admin');
};

exports.edit = function(req, res) {
  res.render("assess-edit", {
    questions,
    title: "Edit Assessment | LWCMP Tool"
  });
};

exports.save = function(req, res) {
  const newQuestions = req.body;

  // Clear current questions
  questions.splice(0, questions.length);

  // Push new questions
  for (let i = 0; i < newQuestions.length; i++) {
    questions.push(newQuestions[i]);
  }
};

exports.verifyCode = function(req, res) {
  const code = req.body.code;

  if (code !== process.env.ASSESS_CODE) {
    console.log('Incorrect passcode');
    res.send(false);
    return;
  }
  console.log('Correct passcode');
  res.send(true);
};

exports.saveMarket = function(req, res) {
  markets.push(req.body);
  console.log(req.body);
  return;
};

exports.submit = function(req, res) {
  const assessment = req.body.assessment;
  const level = req.body.level;
  const name = req.body.marketName;

  marketdb.all('SELECT * FROM markets', (err,rows) => {
    if (rows.length > 0) {
      const markets = JSON.parse(rows[0].data);

      for (let i = 0; i < markets.length; i++) {
        // Find market
        if (markets[i].name === name) {
          markets[i].assessments.unshift(assessment);
          markets[i].level = level;
        }
      }

      marketdb.run(`UPDATE markets SET data = ${JSON.stringify(markets)}`, function(err) {
        if (err) {
          return console.log("Error adding new assessment to database");
        }
        console.log('New assessment added successfully');
      });
    }
    else {
      console.log("Database is empty");
    }
  });


/*
  console.log(req.body);

  let name = req.body.marketName;
  let assessment = req.body.assessment;
  let level = req.body.level;

  assessments.run("INSERT INTO assessmentTable(name) VALUES(?)", req.body.everything); */

  //assessments.run("INSERT INTO assessmentTable(name, address) VALUES(?,?)", req.body.assessment, req.body.submission);
  /*
  assessments.run("INSERT INTO assessmentTable(firstName, lastName, marketName, email, level, assessment) VALUES(?,?,?,?,?,?)",
  req.body['evaluator[first]'], req.body['evaluator[last]'], req.body.marketName, req.body['evaluator[email]'], req.body.level, req.body.answers);

  res.send("Completed Assessment"); */
};

//marketdb.close();
