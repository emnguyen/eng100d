const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('assessment.db');
const questions = require('./assessment-matrix.json');

db.serialize(() => {
  //db.run("CREATE TABLE assessmentTable (firstName, lastName, marketName, email, level, assessment, address, storeType)");
  db.run("CREATE TABLE assessmentTable(name, address, storeType, level, assessment)");
});
db.close();
