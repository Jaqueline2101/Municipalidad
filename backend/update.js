const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');
db.run("UPDATE usuarios SET password = '123' WHERE email = 'jaqueline.210623@gmail.com'", function(err) {
    if (err) console.error(err);
    else console.log('Password updated successfully');
});
