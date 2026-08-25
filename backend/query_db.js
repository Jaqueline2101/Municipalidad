const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const queryAll = () => {
    db.all("SELECT * FROM sedes", [], (err, sedes) => {
        console.log("SEDES:", sedes);
        db.all("SELECT * FROM pisos", [], (err, pisos) => {
            console.log("PISOS:", pisos);
            db.all("SELECT * FROM oficinas", [], (err, oficinas) => {
                console.log("OFICINAS:", oficinas);
                db.close();
            });
        });
    });
};

queryAll();
