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

const generateId = (prefix) => prefix + '-' + Math.random().toString(36).substr(2, 9);

const items = [
    // PAGINA 2
    { code: '746437450185', name: 'ESCRITORIO DE MELAMINA', brand: 'S/I', model: '4 GABETAS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '462252150257', name: 'ESTABILIZADOR', brand: 'QUASAR', model: 'PLI 1200', serial: '3685PL1200603', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '462252150482', name: 'ESTABILIZADOR', brand: 'ORION', model: 'PLI1200', serial: '326BPLI1200422', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '462252150518', name: 'ESTABILIZADOR', brand: 'QUASAR', model: 'PLI1200', serial: '326BPLI1200424', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '462252150519', name: 'ESTABILIZADOR', brand: 'QUASAR', model: 'PLI1200', serial: '326BPLI1200421', state: 'MALO', category: 'Hardware/TI' },
    { code: '462252150522', name: 'ESTABILIZADOR', brand: 'QUASAR', model: 'PLI 1200', serial: '326BPLI1200004', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '462252150523', name: 'ESTABILIZADOR', brand: 'QUASAR', model: 'PLI 1200', serial: '326BPLI12000425', state: 'MALO', category: 'Hardware/TI' },
    { code: '74641520039', name: 'ESTANTE DE MELAMINA', brand: 'S/I', model: '5 PISOS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '74641860051', name: 'ESTANTE DE METAL', brand: 'S/I', model: '5 NIVELES', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '74644910001', name: 'GABINETE DE METAL', brand: 'SATRA', model: '4 PISOS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '74644910002', name: 'GABINETE DE METAL', brand: 'S/I', model: '4 PISOS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '74644910003', name: 'GABINETE DE METAL', brand: 'S/I', model: 'PARA SWITCH', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '74644910004', name: 'GABINETE DE METAL', brand: 'S/I', model: 'S/I', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '74644910005', name: 'GABINETE DE METAL', brand: 'SATRA', model: 'S/I', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '74644910023', name: 'GABINETE DE METAL', brand: 'NACIONAL', model: 'DE PARED 6 RU', serial: '', state: 'BUENO', category: 'Mobiliario' },
    { code: '74644910024', name: 'GABINETE DE METAL', brand: 'NACIONAL', model: 'DE PARED 6 RU', serial: '', state: 'BUENO', category: 'Mobiliario' },
    { code: '74644910025', name: 'GABINETE DE METAL', brand: 'XTRING', model: 'DE PARED 4 RU', serial: '', state: 'NUEVO', category: 'Mobiliario' },
    { code: '74644910026', name: 'GABINETE DE METAL', brand: 'XTRING', model: 'DE PARED 4 RU', serial: '', state: 'NUEVO', category: 'Mobiliario' },
    { code: '74644910027', name: 'GABINETE DE METAL', brand: 'XTRING', model: 'DE PARED 4 RU', serial: '', state: 'NUEVO', category: 'Mobiliario' },
    { code: '74644910028', name: 'GABINETE DE METAL', brand: 'XTRING', model: 'DE PARED 4 RU', serial: '', state: 'NUEVO', category: 'Mobiliario' },
    { code: '74644910029', name: 'GABINETE DE METAL', brand: 'XTRING', model: 'DE PARED 4 RU', serial: '', state: 'NUEVO', category: 'Mobiliario' },
    { code: '74644910030', name: 'GABINETE DE METAL', brand: 'XTRING', model: 'DE PARED 4 RU', serial: '', state: 'NUEVO', category: 'Mobiliario' },
    { code: '74644910031', name: 'GABINETE DE METAL', brand: 'XTRING', model: 'DE PARED 4 RU', serial: '', state: 'NUEVO', category: 'Mobiliario' },
    { code: '74644910032', name: 'GABINETE DE METAL', brand: 'XTRING', model: 'DE PARED 4 RU', serial: '', state: 'NUEVO', category: 'Mobiliario' },

    // PAGINA 3
    { code: '952245280009', name: 'GRABADOR DIGITAL DE VIDEO', brand: 'DAHUA', model: 'DVR 8 CANALES', serial: '', state: 'REGULAR', category: 'Seguridad' },
    { code: '742229330012', name: 'GUILLOTINA', brand: 'PAPER CUTTER', model: '', serial: '', state: 'REGULAR', category: 'Equipos de Oficina' },
    { code: '740836500073', name: 'IMPRESORA A INYECCION DE', brand: 'EPSON', model: 'L355', serial: 'S42K213167', state: 'MALO', category: 'Hardware/TI' },
    { code: '740836750002', name: 'IMPRESORA DE CODIGO DE BAR', brand: 'ZEBRA', model: 'GG420T', serial: 'S4J175300020', state: 'MALO', category: 'Hardware/TI' },
    { code: '740841000350', name: 'IMPRESORA LASER', brand: 'HP', model: 'C2181A', serial: 'BRBSG1PVPT', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740863500020', name: 'LECTORA DE CODIGO DE BAR', brand: 'DATALOGIT', model: 'BC2030', serial: 'G21A77619', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740863500021', name: 'LECTORA DE CODIGO DE BAR', brand: 'DATALOGIT', model: 'BC2030', serial: 'G21B4279', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740863500022', name: 'LECTORA DE CODIGO DE BAR', brand: 'DATALOGIT', model: 'BC2030', serial: 'G20MB1694', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740863500023', name: 'LECTORA DE CODIGO DE BAR', brand: 'DATALOGIT', model: 'BC2030', serial: 'G21B4083', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740870810001', name: 'LECTORA DE TARJETA DE PR', brand: 'BIT 4DIT', model: 'MINILECTOR', serial: 'BPCA-0365870', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740870810002', name: 'LECTORA DE TARJETA DE PR', brand: 'BIT 4DIT', model: 'MINILECTOR', serial: 'BPCA-0365862', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740870810003', name: 'LECTORA DE TARJETA DE PR', brand: 'BIT 4DIT', model: 'MINILECTOR', serial: 'BPCA-0365863', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740870810004', name: 'LECTORA DE TARJETA DE PR', brand: 'BIT 4DIT', model: 'MINILECTOR', serial: 'BPCA-0457207', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '742245990002', name: 'MAQUINA ESPIRALADORA', brand: 'CALIBRINT', model: 'S-12', serial: '', state: 'REGULAR', category: 'Equipos de Oficina' },
    { code: '746449320014', name: 'MESA DE MADERA', brand: 'S/I', model: '', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '746461240030', name: 'MODULO DE MELAMINA PARA', brand: 'S/I', model: '2 PISOS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '746461240031', name: 'MODULO DE MELAMINA PARA', brand: 'S/I', model: '3 PISOS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '746461240032', name: 'MODULO DE MELAMINA PARA', brand: 'S/I', model: '2 PISOS', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '746461240033', name: 'MODULO DE MELAMINA PARA', brand: 'S/I', model: '2 PISOS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '952258350001', name: 'MONITOR LCD', brand: 'TEROS', model: 'TE-325012', serial: 'TE325C324C05', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740880370025', name: 'MONITOR LED', brand: 'TEROS', model: 'TE-3253S', serial: 'TE3253324C050', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740880370026', name: 'MONITOR LED', brand: 'TEROS', model: 'TE-3253S', serial: 'TE3253324C050', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740880370027', name: 'MONITOR LED', brand: 'TEROS', model: 'TE-3253S', serial: 'TE3233504D250', state: 'BUENO', category: 'Hardware/TI' },

    // PAGINA 6
    { code: '740895000688', name: 'UNIDAD CENTRAL DE PROCESAMIENTO', brand: 'ADVANCE', model: 'CORE I5', serial: 'GD160249000036', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895000732', name: 'UNIDAD CENTRAL DE PROCESAMIENTO', brand: 'ADVANCE', model: 'OPENV07388', serial: 'GD160249000035', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000733', name: 'UNIDAD CENTRAL DE PROCESAMIENTO', brand: 'ADVANCE', model: 'OPENV07398', serial: 'GD160249000099', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895000735', name: 'UNIDAD CENTRAL DE PROCESAMIENTO', brand: 'ADVANCE', model: 'OPENV07396', serial: 'GD16024900027', state: 'MALO', category: 'Hardware/TI' },
    { code: '7408929500794', name: 'UNIDAD CENTRAL DE PROCESAMIENTO', brand: 'LG', model: '', serial: '', state: 'REGULAR', category: 'Hardware/TI' }
];

const seedData = async () => {
    try {
        console.log("Iniciando inserción de datos (Parte 2)...");
        
        const oficinaId = 'o-10'; // OFI GENERAL DE TECNOLOGIA DE LA INFORMACION
        const location = JSON.stringify({
            sedeId: "s-1",
            pisoId: "p-1",
            oficinaId: "o-10",
            responsible: "LUTHER PEDRO VILCA MANSILLA" 
        });

        let insertedCount = 0;

        for (const item of items) {
            const assetId = generateId('a');
            
            const exists = await dbGet("SELECT id FROM assets WHERE code = ?", [item.code]);
            if (!exists) {
                await dbRun(
                    `INSERT INTO assets (id, code, name, category, brand, model, serial, control_type, quantity, state, purchase_order, provider, purchase_date, warranty_end, location, specs) 
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        assetId, item.code, item.name, item.category, item.brand, item.model, item.serial, 
                        'unique', 1, item.state, '', '', '', '', location, JSON.stringify({})
                    ]
                );
                insertedCount++;
            }
        }
        
        console.log(`Se han insertado ${insertedCount} activos adicionales correctamente.`);
    } catch (err) {
        console.error("Error al insertar:", err);
    }
};

seedData();
