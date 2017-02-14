const a = require('async');
const mysql = require('mysql');
const GoogleSpreadsheet = require('google-spreadsheet');
const fetch = require('node-fetch');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'devathon'
});
connection.connect();

const doc = new GoogleSpreadsheet('1Mb1gFpii-yxZw0bEnwLQdvaNZl-f_33qkX-_HkSibug');
let sheet;

function auth() {
    doc.useServiceAccountAuth(require('./service-account-details.json'), (err) => {
        if (err) {
            throw err;
        }
        getInfo();
    });
}

function getInfo() {
    doc.getInfo((err, info) => {
        if (err) {
            throw err;
        }
        console.log(`Editing ${info.title} by ${info.author.name} ${info.author.email}`);
        sheet = info.worksheets[0];
        // updateSheet();
        getResults();
    });
}

function getResults() {
    sheet.getRows({
        offset: 1
    }, function (err, rows) {
        if (err) {
            throw err;
        }
        const tasks = rows.map(row => {
            return function(callback) {
                a.waterfall([
                    function (callback) {
                        console.log('si:', row.si);
                        fetch(`https://api.github.com/users/${row.si}?client_id=6a04bce123b63cf0917a&client_secret=6fb692abad5761d25d6515d447f323b9d48a33c4`, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'User-Agent': 'DevathonScripts'
                            }
                        }).then(res => {
                            return res.json();
                        }).then(res => {
                            if (!res.id) {
                                return callback(null, -1)
                            }
                            return callback(null, res.id);
                        }).catch(callback);
                    },
                    function (id, callback) {
                        if (id === -1) {
                            return callback(null, '', '');
                        }
                        console.log(row.si, id);
                        connection.query('INSERT INTO `users` (`github_id`) VALUES (?)', [id], callback);
                    },
                    function(a, b, callback) {
                        setTimeout(callback, 10);
                    }
                ], callback);
            };
        });
        a.parallel(tasks, (err) => {
            end();
            if (err) {
                throw err;
            }
        });
    });
}

function end() {
    connection.end();
}

auth();
