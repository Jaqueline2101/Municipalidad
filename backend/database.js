const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Promise wrappers for SQLite operations
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

// Initialize SQLite Schema and seed default data
const initDb = async () => {
    try {
        console.log("[SQLite DB] Inicializando base de datos local en:", dbPath);
        
        // 1. Create Tables
        await dbRun(`CREATE TABLE IF NOT EXISTS sedes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )`);
        
        await dbRun(`CREATE TABLE IF NOT EXISTS pisos (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sede_id TEXT NOT NULL,
            FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE CASCADE
        )`);
        
        await dbRun(`CREATE TABLE IF NOT EXISTS oficinas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            piso_id TEXT NOT NULL,
            FOREIGN KEY (piso_id) REFERENCES pisos(id) ON DELETE CASCADE
        )`);
        
        await dbRun(`CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            brand TEXT,
            model TEXT,
            serial TEXT,
            control_type TEXT,
            quantity INTEGER,
            state TEXT,
            purchase_order TEXT,
            provider TEXT,
            purchase_date TEXT,
            warranty_end TEXT,
            location TEXT, -- stored as JSON string
            specs TEXT -- stored as JSON string
        )`);
        
        await dbRun(`CREATE TABLE IF NOT EXISTS movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            asset_code TEXT NOT NULL,
            asset_name TEXT NOT NULL,
            origin TEXT,
            destination TEXT,
            responsible TEXT,
            operator TEXT
        )`);
        
        await dbRun(`CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            reg_nro TEXT,
            date_rec TEXT,
            doc_type TEXT,
            doc_nro TEXT,
            sender TEXT,
            recipient TEXT,
            subject TEXT,
            folios INTEGER,
            response TEXT, -- stored as JSON string
            file_path TEXT,
            reentry TEXT -- stored as JSON string
        )`);
        
        // Run migration for existing databases
        try {
            await dbRun("ALTER TABLE documents ADD COLUMN file_path TEXT");
            console.log("[SQLite DB] Columna file_path agregada a tabla documents.");
        } catch (alterErr) {
            // Se ignora si la columna ya existe
        }

        try {
            await dbRun("ALTER TABLE documents ADD COLUMN reentry TEXT");
            console.log("[SQLite DB] Columna reentry agregada a tabla documents.");
        } catch (alterErr) {
            // Se ignora si la columna ya existe
        }

        try {
            await dbRun("ALTER TABLE usuarios ADD COLUMN active INTEGER DEFAULT 1");
            console.log("[SQLite DB] Columna active agregada a tabla usuarios.");
        } catch (alterErr) {
            // Se ignora si la columna ya existe
        }
        
        await dbRun(`CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            role TEXT,
            password TEXT, -- plain-text password for compatibility with offline auth
            created_at TEXT,
            active INTEGER DEFAULT 1
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS document_files (
            filename TEXT PRIMARY KEY,
            file_data BLOB NOT NULL,
            mime_type TEXT
        )`);

        // 2. Check if tables are empty and seed default values
        const checkSedes = await dbGet("SELECT COUNT(*) as count FROM sedes");
        if (checkSedes.count === 0) {
            console.log("[SQLite DB] Base de datos vacía. Insertando datos semilla...");
            
            // Sedes
            await dbRun("INSERT INTO sedes (id, name) VALUES ('s-1', 'Sede Central (Palacio Municipal)'), ('s-2', 'Sede Sur (Seguridad y Obras)')");
            
            // Pisos
            await dbRun("INSERT INTO pisos (id, name, sede_id) VALUES " +
                "('p-1', 'Piso 1', 's-1'), " +
                "('p-2', 'Piso 2', 's-1'), " +
                "('p-3', 'Piso 1', 's-2')");

            // Oficinas
            await dbRun("INSERT INTO oficinas (id, name, piso_id) VALUES " +
                "('o-1', 'Oficina de Mesa de Partes', 'p-1'), " +
                "('o-2', 'Oficina de Presupuesto', 'p-1'), " +
                "('o-3', 'Oficina de Contabilidad', 'p-2'), " +
                "('o-4', 'Oficina de Recursos Humanos', 'p-2'), " +
                "('o-5', 'Oficina de Seguridad Ciudadana', 'p-3')");

            // Default User
            await dbRun("INSERT INTO usuarios (id, email, name, role, password, created_at) VALUES " +
                "('local_default', 'vaidrollteam@munisanroman.gob.pe', 'VaidrollTeam', 'Administrador', '123', ?)",
                [new Date().toISOString()]);

            // Assets
            const defaultAssets = [
                {
                    id: "a-1",
                    code: "PAT-2026-0001",
                    name: "Computadora HP EliteDesk 800 G6",
                    category: "Hardware/TI",
                    brand: "HP",
                    model: "EliteDesk 800 G6",
                    serial: "5CG2019XYZ",
                    control_type: "unique",
                    quantity: 1,
                    state: "Bueno",
                    purchase_order: "OC-2025-0012",
                    provider: "Tecnología Integrada SAC",
                    purchase_date: "2025-02-15",
                    warranty_end: "2028-02-15",
                    location: JSON.stringify({
                        sedeId: "s-1",
                        pisoId: "p-2",
                        oficinaId: "o-3",
                        responsible: "Luis Ramirez"
                    }),
                    specs: JSON.stringify({
                        "Procesador": "Intel Core i7 10ma Gen",
                        "Memoria RAM": "16 GB DDR4",
                        "Almacenamiento": "512 GB SSD NVMe"
                    })
                },
                {
                    id: "a-2",
                    code: "PAT-2026-0002",
                    name: "Impresora Láser HP LaserJet Pro M404dw",
                    category: "Hardware/TI",
                    brand: "HP",
                    model: "LaserJet Pro M404dw",
                    serial: "CNB2912ABC",
                    control_type: "unique",
                    quantity: 1,
                    state: "Regular",
                    purchase_order: "OC-2025-0155",
                    provider: "Ofimática del Sur",
                    purchase_date: "2025-05-10",
                    warranty_end: "2026-05-10",
                    location: JSON.stringify({
                        sedeId: "s-1",
                        pisoId: "p-1",
                        oficinaId: "o-2",
                        responsible: "Ana Gomez"
                    }),
                    specs: JSON.stringify({
                        "Tipo": "Láser Monocromático",
                        "Conectividad": "Wi-Fi & Red Ethernet",
                        "Velocidad de Impresión": "40 ppm"
                    })
                },
                {
                    id: "a-3",
                    code: "PAT-2026-0003",
                    name: "Switch Cisco Catalyst 2960-L",
                    category: "Infraestructura de Red",
                    brand: "Cisco Systems",
                    model: "Catalyst 2960-L (24 Ports)",
                    serial: "FOC1234X56",
                    control_type: "unique",
                    quantity: 1,
                    state: "Nuevo",
                    purchase_order: "OC-2025-0210",
                    provider: "Redes y Telecomunicaciones Perú",
                    purchase_date: "2025-11-20",
                    warranty_end: "2027-11-20",
                    location: JSON.stringify({
                        sedeId: "s-1",
                        pisoId: "p-2",
                        oficinaId: "o-3",
                        responsible: "Luis Ramirez"
                    }),
                    specs: JSON.stringify({
                        "Puertos": "24 Puertos Gigabit PoE+",
                        "Capacidad de Switch": "56 Gbps",
                        "Administrable": "Sí, Capa 2"
                    })
                },
                {
                    id: "a-4",
                    code: "PAT-2026-0004",
                    name: "Bobina de Cable UTP Cat 6A Azul",
                    category: "Infraestructura de Red",
                    brand: "Panduit",
                    model: "Cat 6A F/UTP",
                    serial: "",
                    control_type: "stock",
                    quantity: 8,
                    state: "Bueno",
                    purchase_order: "OC-2026-0005",
                    provider: "Suministros Redes SAC",
                    purchase_date: "2026-01-08",
                    warranty_end: "",
                    location: null,
                    specs: JSON.stringify({
                        "Categoría": "Cat 6A",
                        "Longitud": "305 metros por bobina",
                        "Blindaje": "F/UTP"
                    })
                },
                {
                    id: "a-5",
                    code: "PAT-2026-0005",
                    name: "Escritorio de Madera Estilo Gerente",
                    category: "Mobiliario",
                    brand: "Muebles D'Kora",
                    model: "Gerencial Roble",
                    serial: "",
                    control_type: "stock",
                    quantity: 15,
                    state: "Bueno",
                    purchase_order: "OC-2025-0901",
                    provider: "Maderera del Centro",
                    purchase_date: "2025-09-12",
                    warranty_end: "",
                    location: null,
                    specs: JSON.stringify({
                        "Material": "Madera Roble / Metal",
                        "Dimensiones": "160cm x 80cm x 75cm"
                    })
                },
                {
                    id: "a-6",
                    code: "PAT-2026-0006",
                    name: "Silla Ergonómica Pro con Ajuste Lumbar",
                    category: "Mobiliario",
                    brand: "ErgoChair",
                    model: "Pro Series V2",
                    serial: "SIL-00129",
                    control_type: "unique",
                    quantity: 1,
                    state: "Bueno",
                    purchase_order: "OC-2025-1044",
                    provider: "OfiExpress Perú",
                    purchase_date: "2025-10-02",
                    warranty_end: "2026-10-02",
                    location: JSON.stringify({
                        sedeId: "s-1",
                        pisoId: "p-1",
                        oficinaId: "o-1",
                        responsible: "Carlos Vega"
                    }),
                    specs: JSON.stringify({
                        "Ajuste Lumbar": "Regulable en altura",
                        "Material de Asiento": "Malla Antitranspirante",
                        "Apoyabrazos": "Ajuste 3D"
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

            // Movements
            const now = new Date();
            const defaultMovements = [
                {
                    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 3).toISOString(),
                    asset_code: "PAT-2026-0001",
                    asset_name: "Computadora HP EliteDesk 800 G6",
                    origin: "Almacén Central",
                    destination: "Oficina de Contabilidad (Sede Central)",
                    responsible: "Luis Ramirez",
                    operator: "Juan Delgado (ADMIN)"
                },
                {
                    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 2).toISOString(),
                    asset_code: "PAT-2026-0002",
                    asset_name: "Impresora Láser HP LaserJet Pro M404dw",
                    origin: "Almacén Central",
                    destination: "Oficina de Presupuesto (Sede Central)",
                    responsible: "Ana Gomez",
                    operator: "Juan Delgado (ADMIN)"
                },
                {
                    timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
                    asset_code: "PAT-2026-0006",
                    asset_name: "Silla Ergonómica Pro con Ajuste Lumbar",
                    origin: "Almacén Central",
                    destination: "Oficina de Mesa de Partes (Sede Central)",
                    responsible: "Carlos Vega",
                    operator: "Juan Delgado (ADMIN)"
                }
            ];

            for (const m of defaultMovements) {
                await dbRun(
                    "INSERT INTO movements (timestamp, asset_code, asset_name, origin, destination, responsible, operator) VALUES (?,?,?,?,?,?,?)",
                    [m.timestamp, m.asset_code, m.asset_name, m.origin, m.destination, m.responsible, m.operator]
                );
            }
            console.log("[SQLite DB] Datos semilla insertados correctamente.");
        }
    } catch (err) {
        console.error("[SQLite DB] Error al inicializar base de datos:", err);
    }
};

module.exports = {
    dbRun,
    dbGet,
    dbAll,
    initDb
};
