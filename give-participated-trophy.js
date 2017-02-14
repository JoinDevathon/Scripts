const a = require('async');
const mysql = require('mysql');
const GoogleSpreadsheet = require('google-spreadsheet');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'devathon'
});
connection.connect();

connection.query('SELECT `id` FROM `users`', (err, rows) => {
    if (err) {
        throw err;
    }
    a.series(rows.map(row => function(callback) {
        connection.query('INSERT INTO `trophy` (`id`,`filename`,`name`) VALUES (?,?,?)', [row.id, 'participated2016', 'Participated in the 2016 Contest'], callback);
    }), function (err) {
        connection.end();
        if (err) {
            throw err;
        }
    });
});
