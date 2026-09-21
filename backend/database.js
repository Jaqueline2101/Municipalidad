const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'patrigest',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promise wrappers to maintain compatibility with SQLite calls
const dbRun = async (sql, params = []) => {
    try {
        const [result] = await pool.execute(sql, params);
        return result;
    } catch (err) {
        throw err;
    }
};

const dbGet = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows.length > 0 ? rows[0] : undefined;
    } catch (err) {
        throw err;
    }
};

const dbAll = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (err) {
        throw err;
    }
};

// Initialize MySQL Schema and seed default data
const initDb = async () => {
    try {
        console.log("[MySQL DB] Inicializando base de datos en:", process.env.DB_HOST || 'localhost');
        
        // 1. Create Database if not exists and use it
        const initPool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });
        const dbName = process.env.DB_NAME || 'patrigest';
        await initPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await initPool.end();

        // 1. Create Tables
        await dbRun(`CREATE TABLE IF NOT EXISTS sedes (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS pisos (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            sede_id VARCHAR(255) NOT NULL,
            FOREIGN KEY (sede_id) REFERENCES sedes(id)
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS oficinas (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            piso_id VARCHAR(255) NOT NULL,
            FOREIGN KEY (piso_id) REFERENCES pisos(id)
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS assets (
            id VARCHAR(255) PRIMARY KEY,
            code VARCHAR(255) UNIQUE NOT NULL,
            type VARCHAR(255) DEFAULT 'Hardware/TI',
            name VARCHAR(255) NOT NULL,
            category VARCHAR(255) NOT NULL,
            brand VARCHAR(255),
            model VARCHAR(255),
            serial VARCHAR(255),
            control_type VARCHAR(50) DEFAULT 'unique',
            quantity INTEGER DEFAULT 1,
            state VARCHAR(50) DEFAULT 'Bueno',
            purchase_order VARCHAR(255),
            provider VARCHAR(255),
            purchase_date VARCHAR(255),
            warranty_end VARCHAR(255),
            location TEXT,
            specs TEXT
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS movements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp VARCHAR(255) NOT NULL,
            asset_code VARCHAR(255) NOT NULL,
            asset_name VARCHAR(255),
            origin VARCHAR(255),
            destination VARCHAR(255),
            responsible VARCHAR(255),
            operator VARCHAR(255)
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS documents (
            id VARCHAR(255) PRIMARY KEY,
            reg_nro VARCHAR(255) NOT NULL,
            date_rec VARCHAR(255) NOT NULL,
            doc_type VARCHAR(255) NOT NULL,
            doc_nro VARCHAR(255) NOT NULL,
            sender VARCHAR(255) NOT NULL,
            recipient VARCHAR(255) NOT NULL,
            subject TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pendiente',
            file_path VARCHAR(255),
            response TEXT,
            reentry TEXT
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS document_files (
            filename VARCHAR(255) PRIMARY KEY,
            file_data LONGBLOB NOT NULL,
            mime_type VARCHAR(255) NOT NULL
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS usuarios (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'Operador',
            active TINYINT(1) DEFAULT 1
        )`);

        // Check if DB is empty to seed initial data
        const sedes = await dbAll("SELECT id FROM sedes");
        if (sedes.length === 0) {
            console.log("[MySQL DB] Base de datos vacía. Insertando datos semilla...");

            // Insert Users
            await dbRun(
                "INSERT INTO usuarios (id, email, password, name, role, active) VALUES (?,?,?,?,?,?)",
                ["u-1", "admin@munisanroman.gob.pe", "admin123", "Jaqueline Administradora", "Administrador", 1]
            );
            await dbRun(
                "INSERT INTO usuarios (id, email, password, name, role, active) VALUES (?,?,?,?,?,?)",
                ["u-2", "operador@munisanroman.gob.pe", "operador123", "Carlos Operador", "Operador", 1]
            );

            // Insert Locations
            const sedesData = [
                { id: "s-1", name: "Sede Central (Plaza de Armas)" },
                { id: "s-2", name: "Sede Administrativa (Tapia)" }
            ];
            for (const s of sedesData) {
                await dbRun("INSERT INTO sedes (id, name) VALUES (?,?)", [s.id, s.name]);
            }

            const pisosData = [
                { id: "p-1", name: "Piso 1", sedeId: "s-1" },
                { id: "p-2", name: "Piso 2", sedeId: "s-1" }
            ];
            for (const p of pisosData) {
                await dbRun("INSERT INTO pisos (id, name, sede_id) VALUES (?,?,?)", [p.id, p.name, p.sedeId]);
            }

            const oficinasData = [
                { id: "o-1", name: "Mesa de Partes", pisoId: "p-1" },
                { id: "o-2", name: "Almacén Central", pisoId: "p-1" },
                { id: "o-3", name: "Oficina de TI", pisoId: "p-2" }
            ];
            for (const o of oficinasData) {
                await dbRun("INSERT INTO oficinas (id, name, piso_id) VALUES (?,?,?)", [o.id, o.name, o.pisoId]);
            }

            // Insert Assets
            const defaultAssets = [
                {
                    id: "a-1",
                    code: "PAT-2026-0001",
                    name: "Computadora HP EliteDesk 800 G6",
                    category: "Hardware/TI",
                    brand: "HP",
                    model: "EliteDesk 800 G6",
                    serial: "CZC1234567",
                    control_type: "unique",
                    quantity: 1,
                    state: "Bueno",
                    purchase_order: "OC-2025-0150",
                    provider: "Tech Solutions SAC",
                    purchase_date: "2025-05-15",
                    warranty_end: "2028-05-15",
                    location: JSON.stringify({
                        sedeId: "s-1",
                        pisoId: "p-2",
                        oficinaId: "o-3",
                        responsible: "Luis Ramirez"
                    }),
                    specs: JSON.stringify({
                        "Procesador": "Intel Core i7-10700",
                        "Memoria RAM": "16GB DDR4",
                        "Almacenamiento": "512GB SSD NVMe"
                    })
                }
            ];

            for (const asset of defaultAssets) {
                await dbRun(
                    `INSERT INTO assets (id, code, name, category, brand, model, serial, control_type, quantity, state, purchase_order, provider, purchase_date, warranty_end, location, specs) 
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        asset.id, asset.code, asset.name, asset.category, asset.brand, asset.model, asset.serial, 
                        asset.control_type, asset.quantity, asset.state, asset.purchase_order, asset.provider, 
                        asset.purchase_date, asset.warranty_end, asset.location, asset.specs
                    ]
                );
            }

            console.log("[MySQL DB] Datos semilla insertados correctamente.");
        }
    } catch (err) {
        console.error("[MySQL DB] Error al inicializar base de datos:", err);
    }
};

module.exports = {
    dbRun,
    dbGet,
    dbAll,
    initDb
};
