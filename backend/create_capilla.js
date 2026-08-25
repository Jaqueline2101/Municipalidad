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

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
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

const generateId = (prefix) => prefix + '-' + Math.random().toString(36).substr(2, 9);

const codesCapilla = [
    '462200500009', '46220500022', '462200500034', '740805000761', '746437120126',
    '462252150253', '462252150341', '462252150521', '746461340229', '740887000249',
    '740881870381', '740881870389', '740889500020', '740882000010', '740882000011',
    '740882000012', '740894870014', '740894870015', '740894870016', '740894870025',
    '740894870046', '740895000641', '740895000666', '740895000778', '740895000849',
    '740895000945', '952282870076', '952285830001', '952285830002', '952285830003',
    '952285830017', '952285830018', '952285830019', '462289500004', '740895000323',
    '740895000346', '740895000562'
];

const createCapilla = async () => {
    try {
        console.log("Creando estructura para La Capilla...");

        // 1. Create Sede
        let sedeId = 's-capilla';
        let sede = await dbGet("SELECT id FROM sedes WHERE id = ?", [sedeId]);
        if (!sede) {
            await dbRun("INSERT INTO sedes (id, name) VALUES (?, ?)", [sedeId, 'Centro Recreacional La Capilla']);
        }

        // 2. Create Piso
        let pisoId = 'p-capilla';
        let piso = await dbGet("SELECT id FROM pisos WHERE id = ?", [pisoId]);
        if (!piso) {
            await dbRun("INSERT INTO pisos (id, name, sede_id) VALUES (?, ?, ?)", [pisoId, 'Oficina General de Tecnologia de Informacion', sedeId]);
        }

        // 3. Create Oficina
        let oficinaId = 'o-capilla';
        let oficina = await dbGet("SELECT id FROM oficinas WHERE id = ?", [oficinaId]);
        if (!oficina) {
            await dbRun("INSERT INTO oficinas (id, name, piso_id) VALUES (?, ?, ?)", [oficinaId, 'La Capilla', pisoId]);
        }

        const newLocation = JSON.stringify({
            sedeId: sedeId,
            pisoId: pisoId,
            oficinaId: oficinaId,
            responsible: "LUTHER PEDRO VILCA MANSILLA"
        });

        // 4. Mover bienes
        let updatedCount = 0;
        for (const code of codesCapilla) {
            const result = await dbGet("SELECT id FROM assets WHERE code = ?", [code]);
            if (result) {
                await dbRun("UPDATE assets SET location = ? WHERE code = ?", [newLocation, code]);
                updatedCount++;
            }
        }

        console.log(`Estructura creada. Se reasignaron exitosamente ${updatedCount} activos a La Capilla.`);
    } catch (err) {
        console.error("Error al actualizar:", err);
    } finally {
        db.close();
    }
};

createCapilla();
