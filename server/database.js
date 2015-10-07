var sqlite3 = require('sqlite3').verbose();
var path = require('path');

//create new database called emails.db
var dbFile = path.join(__dirname + '/emails.db');
var db = exports.db = new sqlite3.Database(dbFile);

/////FX's TO MODIFY DB
//fx to update the emailTable to mark an email as checked
var markChecked = exports.markChecked = function(emailID) {
  var checkString = 'UPDATE emailTable SET checked="1" WHERE id=' + emailID;

  db.run(checkString);
  console.log('markChecked fx ran/////');
};

//fx to update the emailTable  to mark an email as flagged
var markFlagged = exports.markFlagged = function(emailID) {
  var flagString = 'UPDATE emailTable SET flagged="1" WHERE id=' + emailID;

  db.run(flagString);
  console.log('markFlagged fx ran/////');
};

//insert email into emailTable
var insertIntoEmailTable = exports.insertIntoEmailTable = function(toField, fromField, cc, bcc, subject, priority, text, date, checked, flagged) {
  var emailContent = 'INSERT into emailTable (recipient, sender, cc, bcc, subject, priority, body, sendTime, checked, flagged) VALUES(\''
    + toField + '\',\''
    + fromField + '\',\''
    + cc + '\',\''
    + bcc + '\',\''
    + subject + '\',\''
    + priority + '\',\''
    + text + '\',\''
    + date + '\',\''
    + checked + '\',\''
    + flagged + '\');';

  db.run(emailContent);
};

//fx to insert into the contextTable
var insertIntoContextTable = exports.insertIntoContextTable = function(userID, filterID, emailID, flaggedKeyword, context) {
  var flaggedContent = 'INSERT INTO contextTable (userID, filterID, emailID, flaggedKeyword, context) VALUES (' + userID + ',' + filterID + ',' + emailID + ',\'' +  flaggedKeyword + '\',\'' + context +  '\')';

  db.run(flaggedContent);
  console.log('insertIntoContextTable fx ran/////');
};

//setting up sqlite3 database w/ potential email schema
var insertEmail = exports.insertEmail = function(email) {
  var toField = email.to === undefined ? 'undefined' : email.to[0].address;
  var fromField = email.from === undefined ? 'undefined' : email.from[0].address;
  var cc = email.cc === undefined ? 'undefined' : email.cc[0].address;
  var bcc = email.bcc === undefined ? 'undefined' : email.bcc[0].address;
  var subject = email.subject;
  var priority = email.priority;
  var text = email.text;
  var date = email.date;
  var checked = '0';
  var flagged = '0';

  createEmailTable();
  createContextTable();
  insertIntoEmailTable(toField, fromField, cc, bcc, subject, priority, text, date, checked, flagged);
  printEmailTable();
};

//fx to add a new filter into the database for the user
var insertFilter = exports.insertFilter = function(body, cb) {
  console.log('this is body', body);
  var username = body.username;
  var filterName = body.filterName;
  var getUserIDString = 'SELECT * FROM userTable WHERE username="' + username + '"';

  //get user id from database
  db.all(getUserIDString, function(err, userInfo) {
    if (err) {
      console.log('There was an error finding the userID for username', username);

      //if username is not found.
    } else if (userInfo.length === 0) {
      console.log('user not found for username', username);
    } else {
      console.log('found username', userInfo);
      var userID = userInfo[0].id;
      var queryString = 'INSERT INTO filterTable (userID, filterName) VALUES (' + userID + ',\'' +  filterName +  '\')';

      db.all(queryString, function(error, response) {
        if (error) {
          console.log('this is the error', error);
          cb(err);
        } else {
          console.log('this is the response', response);
          cb('YOUR FILTER HAS BEEN ADDED');
        }
      });
    }
  });
};

//fx to add a new filter into the database for the user
var insertKeyword = exports.insertKeyword = function(body, cb) {
  console.log('this is body', body);
  var username = body.username;
  var filterName = body.filterName;
  var keyword = body.keyword;
  var getUserIDString = 'SELECT * FROM userTable WHERE username="' + username + '"';

  //get user id from database
  db.all(getUserIDString, function(err, userInfo) {
    if (err) {
      console.log('There was an error finding the userID for username', username);
    } else {
      console.log('found username', userInfo);
      var userID = userInfo[0].id;
      var getFilterIDString = 'SELECT * FROM filterTable WHERE userID="' + userID + '" AND filterName="' + filterName + '"';

      //get filter id from database
      db.all(getFilterIDString, function(err, filterInfo) {
        if (err) {
          console.log('There was an error finding the filterID for filter', filterName, 'and user', username);
        } else {
          console.log('found filter', filterInfo);
          var filterID = filterInfo[0].id;
          var queryString = 'INSERT INTO keywordTable (userID, filterID, keyword) VALUES (' + userID + ',' +  filterID + ',\'' + keyword + '\')';

          //insert keyword into the keywordTable
          db.all(queryString, function(error, response) {
            if (error) {
              console.log('this is the error', error);
              cb(err);
            } else {
              console.log('this is the response', response);
              cb('YOUR KEYWORD HAS BEEN ADDED');
            }
          });
        }
      });
    }
  });
};

//fx to insert into tagsTable, eg tagName=racist, keyword=coolie
var insertIntoTagsTable = exports.insertIntoTagsTable = function(tagName, keyword) {
  var query = 'INSERT INTO tagsTable(tagName, keyword) VALUES (\'' +  tagName + '\',\'' + keyword +  '\')';

  db.run(query);
  console.log('insertIntoTagsTable fx ran/////');
};


/////FX's TO GET DATA FROM DB
//fx to get an array of flagged keywords.
var getFlaggedWords = exports.getFlaggedWords = function(cb) {
  var queryString = 'SELECT userID, filterID, keyword FROM keywordTable';
  db.all(queryString, function(err, flaggedWords) {
    if (err) {
      console.log('There was an error getting keywords', err);
    } else {
      console.log('These are the keywords returned from getFlaggedWords......', flaggedWords);

      cb(flaggedWords);
    }
  });
};

//fx to get an array of flagged emails.
var getFlaggedEmails = exports.getFlaggedEmails = function(userID, isAdmin, cb) {
  console.log('triggered');
  var queryString = 'SELECT * FROM emailTable WHERE flagged="1"';

  db.all(queryString, function(err, flaggedEmails) {
    if (err) {
      console.log('err');
    } else {
      console.log('emails fetched, now getting all the flagged contexts for user');
      var fetchString = isAdmin ? 'SELECT emailID, flaggedKeyword, context FROM contextTable' : 'SELECT emailID, flaggedKeyword, context FROM contextTable WHERE userID=' + userID;
      console.log('this is fetchString', fetchString);
      db.all(fetchString, function(error, flaggedContext) {
        if (error) {
          console.log('fetch error', error)
        } else {
          console.log('emails and flagged contexts all fetched');
          for (var i = 0; i < flaggedContext.length; i++) {
            for (var j = 0; j < flaggedEmails.length; j++) {
              flaggedEmails[j].flags = flaggedEmails[j].flags || [];
              if (flaggedContext[i].emailID === flaggedEmails[j].id) {
                flaggedEmails[j].flags.push(flaggedContext[i])
              }
            }
          }

          cb(flaggedEmails);
        }
      })

      // for (var i = 0; i < flaggedEmails.length; i++) {
      //   var email = flaggedEmails[i];

      // }

      // cb(flaggedEmails);
    }
  });
};

//fx to pull all unchecked emails from the db
var getUncheckedEmails = exports.getUncheckedEmails = function(cb) {
  console.log('starting to get Unchecked Emails');
  var query = 'SELECT * FROM emailTable WHERE checked="0"';

  db.all(query, function(err, responseArrayOfObjects) {
    if (err) {
      console.log('There was an error getting Unchecked Emails');
    } else {
      console.log('this is the database response.....', responseArrayOfObjects);
      cb(responseArrayOfObjects);
    }
  });
};

//fx to get all filters
var getAllFilters = exports.getAllFilters = function(cb) {
  var queryString = 'SELECT * FROM filterTable;';
  db.all(queryString, function(err, filterArray) {
    if (err) {
      console.log('There was an error getting filters');
    } else {
      console.log('this is the database response.....', filterArray);
      var userQuery = 'SELECT * FROM userTable';
      db.all(userQuery, function(err, userArray) {
        var keywordQuery = 'SELECT * FROM keywordTable';
        db.all(keywordQuery, function(error, keywordArray) {
          if (error) {
            console.log('There was an error getting keywords', error);
          } else {
            for (var i = 0; i < filterArray.length; i++) {
              var filter = filterArray[i];
              filter.keyword = filterArray[i].keyword || [];
              var filterID = filter.id;
              for (var j = 0; j < keywordArray.length; j++) {
                var keyword = keywordArray[j];
                if (filterID === keyword.filterID) {
                  filter.keyWord.push(keyword.keyword)
                }
              }
              for (var k = 0; k < userArray.length; k++) {
                if (filter.userID === userArray[k].id) {
                  filterArray[i].username = userArray[k].username;
                }
              }
            }

            cb(filterArray);
          }
        });
      });
    }
  });
};

//fx to return an array of keywords from the tagsTable (NOT the keyword table!)
var getArrayOfKeywordsFromTagsTable = function getArrayOfKeywordsFromTagsTable(tagName) {
  var query = 'SELECT keyword FROM tagsTable WHERE tagName ="' + tagName + '"' ;
  // var query = 'SELECT keyword FROM tagsTable WHERE tagName =' + tagName + ')' ;
  db.all(query, function(err, result){
    if (err){
      console.log('There was an error getting keywordsArray with tagName =', tagName);
    } else {
      console.log('this is the result.....', result);
      return result; //eg of result... [ { keyword: 'coolie' }, { keyword: 'gringo'} ]
    }
  });
};

/////FX FOR DEBUGGING PURPOSES
//fx to print email table to the terminal
var printEmailTable = function() {
  db.all('SELECT * FROM emailTable', function(err, rows) {
    if (err) {
      console.log('err');
    } else {
      console.log('these are rows', rows);
    }
  });
};

/////FX's TO CREATE TABLES
//create emailTable if it doesnt exit
var createEmailTable = function() {
  var createTable = 'CREATE TABLE IF NOT EXISTS emailTable(id INTEGER PRIMARY KEY AUTOINCREMENT, recipient char(100), sender char(100), cc char(100), bcc char(100), subject char(100), priority char(100), body MEDIUMTEXT, parsedText MEDIUMTEXT, sendTime DATE, checked INTEGER, flagged INTEGER)';

  db.run(createTable);
};

//fx to create contextTable if it doesnt exit
var createContextTable = function() {
  var createTable = 'CREATE TABLE IF NOT EXISTS contextTable(id INTEGER PRIMARY KEY AUTOINCREMENT, userID INTEGER, filterID INTEGER, emailID INTEGER, flaggedKeyword char(100), context char(500))';

  db.run(createTable);
};

//fx to create keywordTable  if it doesnt exit
var createKeywordTable = function() {
  var createTable = 'CREATE TABLE IF NOT EXISTS keywordTable(id INTEGER PRIMARY KEY AUTOINCREMENT, userID INTEGER, filterID INTEGER, keyword char(50))';

  db.run(createTable);
};

//fx to create contextTable if it doesnt exit
var createFilterTable = function() {
  var createTable = 'CREATE TABLE IF NOT EXISTS filterTable(id INTEGER PRIMARY KEY AUTOINCREMENT, userID INTEGER, filterName char(50))';

  db.run(createTable);
};

//fx to create userTable if it doesnt exit
var createUserTable = function() {
  var createUserTable = 'CREATE TABLE IF NOT EXISTS userTable(id INTEGER PRIMARY KEY AUTOINCREMENT, username char(20))';

  //TODO: add user password and stuff
  db.run(createUserTable);
};

//fx to create tagsTable if it doesnt exist.  eg tagName=racist, harassment, corporate treason
var createTagsTable = function createTagsTable() {
  var query = 'CREATE TABLE IF NOT EXISTS tagsTable(id INTEGER PRIMARY KEY AUTOINCREMENT, tagName CHAR(30), keyword CHAR(30))'

  db.run(query);
};

createEmailTable();
createUserTable();
createFilterTable();
createKeywordTable();
createContextTable();
createTagsTable();
