const { dbAll } = require('./database');

const queryAll = async () => {
    const sedes = await dbAll("SELECT * FROM sedes");
    console.log("SEDES:", sedes);
    const pisos = await dbAll("SELECT * FROM pisos");
    console.log("PISOS:", pisos);
    const oficinas = await dbAll("SELECT * FROM oficinas");
    console.log("OFICINAS:", oficinas);
    process.exit(0);
};


queryAll();
