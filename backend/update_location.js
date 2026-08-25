const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const updateLocations = async () => {
    try {
        console.log("Iniciando actualización de ubicaciones...");
        
        const newLocation = JSON.stringify({
            sedeId: "loc-1786652281494",
            pisoId: "loc-1786652297096",
            oficinaId: "loc-1786652301505",
            responsible: "LUTHER PEDRO VILCA MANSILLA"
        });

        // Buscar activos que están en o-10 (la oficina temporal que creamos)
        const assets = await dbAll("SELECT id, location FROM assets WHERE location LIKE '%\"oficinaId\":\"o-10\"%'");
        
        console.log(`Se encontraron ${assets.length} activos para actualizar.`);

        let updatedCount = 0;
        for (const asset of assets) {
            await dbRun("UPDATE assets SET location = ? WHERE id = ?", [newLocation, asset.id]);
            updatedCount++;
        }

        // Eliminar la oficina 'o-10' antigua para no generar confusión
        await dbRun("DELETE FROM oficinas WHERE id = 'o-10'");

        console.log(`Se han reasignado exitosamente ${updatedCount} activos al Coliseo.`);
    } catch (err) {
        console.error("Error al actualizar:", err);
    } finally {
        db.close();
    }
};

updateLocations();
