//const questions = require("../questions.json");
const sqlite3 = require('sqlite3');
let marketdb = new sqlite3.Database('./markets.db');
let questionsdb = new sqlite3.Database('./questions.db');


exports.view = function(req, res) {
  // Query markets
  marketdb.all('SELECT * FROM markets', (err,rows) => {
    if (rows.length > 0) {
      const markets = JSON.parse(rows[0].data);

      // Query survey questions
      questionsdb.all('SELECT * FROM questions', (err,rows) => {
        if (rows.length > 0) {
          const questions = JSON.parse(rows[0].data);

          res.render("assess", {
            questions, markets,
            title: "Assess a Market | LWCMP Tool"
          });
        }
        else {
          console.log("Questions database is empty");
        }
      });
    }
    else {
      console.log("Markets database is empty");
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
          address: markets[i].address,
          storeType: markets[i].storeType,
          level: markets[i].level,
          level1progress: markets[i].level1progress,
          level2progress: markets[i].level2progress,
          level3progress: markets[i].level3progress,
          time: time
        }
      }

      //console.log(marketInfo);

      res.render("submission", {
        marketInfo,
        submission,
        title: market + " Assessment (ID " + time + ") | LWCMP Tool"
      });

    }
    else {
      console.log("Markets database is empty");
    }
  });
};

exports.deleteAssessment = function(req, res) {
  let market = req.params.market;
  let time = req.params.time;

  market = market.toString();

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
            // Delete assessment from database
            assessments.splice(j, 1);

            // If assessments array is now empty, remove markets
            if (assessments.length == 0) {
              markets.splice(i, 1);
            }
            break;
          }

        }
      }

      // Update marketdb
      marketdb.run(`UPDATE markets SET data = ?`, JSON.stringify(markets), function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log('Assessment deleted successfully');
        res.redirect('/admin');
      });
    }
    else {
      console.log("Markets database is empty");
    }
  });
};

exports.edit = function(req, res) {
  // Query survey questions
  questionsdb.all('SELECT * FROM questions', (err,rows) => {
    if (rows.length > 0) {
      const questions = JSON.parse(rows[0].data);

      res.render("assess-edit", {
        questions,
        title: "Edit Assessment | LWCMP Tool"
      });
    }
    else {
      console.log("Questions database is empty");
    }
  });
};

exports.save = function(req, res) {
  const newQuestions = req.body;

  // Update marketdb
  questionsdb.run(`UPDATE questions SET data = ?`, JSON.stringify(newQuestions), function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log('Assessment form saved successfully');
  });

/*
  // Clear current questions
  questions.splice(0, questions.length);

  // Push new questions
  for (let i = 0; i < newQuestions.length; i++) {
    questions.push(newQuestions[i]);
  }
  */
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
  marketdb.all('SELECT * FROM markets', (err,rows) => {
    if (rows.length > 0) {
      const markets = JSON.parse(rows[0].data);

      // Push new market to market array
      markets.push(req.body);

      // Update marketdb
      marketdb.run(`UPDATE markets SET data = ?`, JSON.stringify(markets), function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log('New market added successfully');
      });
    }
    else {
      console.log("Markets database is empty");
    }
  });
};

exports.submit = function(req, res) {
  const assessment = req.body.assessment;
  const level = req.body.level;
  const level1progress = req.body.level1progress;
  const level2progress = req.body.level2progress;
  const level3progress = req.body.level3progress;
  const name = req.body.marketName;

  marketdb.all('SELECT * FROM markets', (err,rows) => {
    if (rows.length > 0) {
      const markets = JSON.parse(rows[0].data);

      for (let i = 0; i < markets.length; i++) {
        // Find market
        if (markets[i].name === name) {
          markets[i].assessments.unshift(assessment);
          markets[i].level = level;
          markets[i].level1progress = level1progress;
          markets[i].level2progress = level2progress;
          markets[i].level3progress = level3progress;
        }
      }

      marketdb.run(`UPDATE markets SET data = ?`, JSON.stringify(markets), function(err) {
        if (err) {
          return console.log(err.message);
        }
        console.log('New assessment added successfully');
      });
    }
    else {
      console.log("Markets database is empty");
    }
  });
};
