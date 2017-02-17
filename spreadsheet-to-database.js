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
        offset: 1,
    }, function (err, rows) {
        if (err) {
            throw err;
        }
        rows = rows.filter(row => row.isgoodyesno === 'yes');
        rows = rows.map(row => {
            return {
                name: row.si,
                reviews: [
                    {
                        reviewer: 28, // codebeasty
                        Creativity: {
                            value: row['codebeastycreativityrating1-10'],
                            text: row['codebeastycreativityresponse']
                        },
                        Originality: {
                            value: row['codebeastyoriginalityrating1-10'],
                            text: row['codebeastyoriginalityresponse']
                        },
                        Implementation: {
                            value: row['codebeastyimplementationrating1-10'],
                            text: row['codebeastyimplementationresponse']
                        }
                    },
                    {
                        reviewer: 110, // thenickparks
                        Creativity: {
                            value: row['nickparkscreativityrating1-10'],
                            text: row['nickparkscreativityresponse']
                        },
                        Originality: {
                            value: row['nickparksoriginalityrating1-10'],
                            text: row['nickparksoriginalityresponse']
                        },
                        Implementation: {
                            value: row['nickparksimplementationrating1-10'],
                            text: row['nickparksimplementationresponse']
                        }
                    },
                    {
                        reviewer: 114, // kazzaBABEgamer
                        Creativity: {
                            value: row['mckellecreativityrating1-10'],
                            text: row['mckellecreativityresponse']
                        },
                        Originality: {
                            value: row['mckelleoriginalityrating1-10'],
                            text: row['mckelleoriginalityresponse']
                        },
                        Implementation: {
                            value: row['mckelleimplementationrating1-10'],
                            text: row['mckelleimplementationresponse']
                        }
                    }
                ]
            };
        });

        const tasks = rows.map(row => {
            return function(callback) {
                a.waterfall([
                    function (callback) {
                        fetch(`https://api.github.com/users/${row.name}?client_id=6a04bce123b63cf0917a&client_secret=6fb692abad5761d25d6515d447f323b9d48a33c4`, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'User-Agent': 'DevathonScripts'
                            }
                        }).then(res => res.json()).then(res => callback(null, res.id)).catch(callback);
                    },
                    function (id, callback) {
                        connection.query('SELECT `id` FROM `users` WHERE `github_id` = ?', [id], callback);
                    },
                    function (rows, thing, callback) {
                        return callback(null, Math.floor(Math.random() * 20000) || rows[0].id);
                    },
                    function (id, callback) {
                        connection.query('INSERT INTO `user_entry` (`user`,`contest`,`url`) VALUES (?,?,?)', [id, 1, `https://github.com/JoinDevathon/${row.name}-2016`], callback);
                    },
                    function ({insertId}, thing, callback) {
                        const tasks = row.reviews.map(review => {
                            return function(callback) {
                                const tasks = ['Creativity', 'Originality', 'Implementation'].map(topic => {
                                    return function (callback) {
                                        console.log('doing topic', topic, review[topic].value, row.name);
                                        connection.query('INSERT INTO `user_entry_feedback` (`entry`,`reviewer`,`key`,`value`,`text`) VALUES (?,?,?,?,?)', [
                                            insertId,
                                            review.reviewer,
                                            topic,
                                            review[topic].value,
                                            review[topic].text
                                        ], callback);
                                    };
                                });

                                a.parallel(tasks, callback);
                            };
                        });
                        a.parallel(tasks, callback);
                    }
                ], callback);
            };
        });
        a.series(tasks, function (error) {
            if (error) {
                throw error;
            }
            end();
        });
    });
}

function end() {
    connection.end();
}

auth();
