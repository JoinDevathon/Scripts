const mysql = require('mysql');
const GoogleSpreadsheet = require('google-spreadsheet');

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
        updateSheet();
    });
}

function updateSheet() {
    // retrieve stuff from mysql
    connection.query('SELECT `username` FROM `users`', (err, rows) => {
        if (err) {
            throw err;
        }
        const usernames = rows.map(({username}) => username);

        sheet.getCells({
            'min-row': 2,
            'max-row': usernames.length + 1,
            'return-empty': true
        }, (err, cells) => {
            if (err) {
                throw err;
            }
            const width = 26;

            usernames.forEach((username, index) => {
                const rowStart = index * width;
                cells[rowStart].value = username;
                cells[rowStart + 1].value = `https://github.com/JoinDevathon/${username}-2016`;
            });

            sheet.bulkUpdateCells(cells, (err) => {
                if (err) {
                    throw err;
                }
                end();
            });
        });
    });
}

function end() {
    connection.end();
}

auth();
