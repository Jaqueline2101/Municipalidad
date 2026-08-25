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
    // PAGINA 1
    { code: '462200500010', name: 'ACUMULADOR DE ENERGIA', brand: 'EATON POWER', model: 'ELISE', serial: '120901-05470058', state: 'MALO', category: 'Hardware/TI' },
    { code: '462200500011', name: 'ACUMULADOR DE ENERGIA', brand: 'EATON POWER', model: 'ELISE', serial: '120901-05470060', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '462200500012', name: 'ACUMULADOR DE ENERGIA', brand: 'EATON POWER', model: 'ELISE', serial: '120901-05470077', state: 'MALO', category: 'Hardware/TI' },
    { code: '462200500020', name: 'ACUMULADOR DE ENERGIA', brand: 'APC', model: 'C1500', serial: 'S/I', state: 'MALO', category: 'Hardware/TI' },
    { code: '462200500021', name: 'ACUMULADOR DE ENERGIA', brand: 'APC', model: 'C1500', serial: 'S/I', state: 'MALO', category: 'Hardware/TI' },
    { code: '462200500023', name: 'ACUMULADOR DE ENERGIA', brand: 'FORZA', model: 'FX-2200', serial: '191273500529', state: 'MALO', category: 'Hardware/TI' },
    { code: '952205030028', name: 'ANTENA (OTRAS)', brand: 'POWER BEAN', model: 'AC-520', serial: '', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '746403210039', name: 'ARCHIVADOR DE MADERA', brand: 'S/I', model: 'S/I', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '676400150001', name: 'ARMARIO BASTIDOR METALICO', brand: 'SATRA', model: 'S/I', serial: 'S/I', state: 'MALO', category: 'Mobiliario' },
    { code: '746406260004', name: 'ARMARIO DE MELAMINA', brand: 'S/I', model: '2 PUERTAS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '952214740016', name: 'CAMARA DOMO A COLOR', brand: 'HIKVISION', model: '', serial: '', state: 'MALO', category: 'Seguridad' },
    { code: '952214740019', name: 'CAMARA DOMO A COLOR', brand: 'HIKVISION', model: '', serial: '', state: 'REGULAR', category: 'Seguridad' },
    { code: '952214740023', name: 'CAMARA DOMO A COLOR', brand: 'DAHUA', model: 'FULL COLOR', serial: '', state: 'REGULAR', category: 'Seguridad' },
    { code: '952214740024', name: 'CAMARA DOMO A COLOR', brand: 'DAHUA', model: 'FULL COLOR', serial: '', state: 'REGULAR', category: 'Seguridad' },
    { code: '952214740025', name: 'CAMARA DOMO A COLOR', brand: 'DAHUA', model: 'FULL COLOR', serial: '', state: 'REGULAR', category: 'Seguridad' },
    { code: '952214740026', name: 'CAMARA DOMO A COLOR', brand: 'DAHUA', model: 'FULL COLOR', serial: '', state: 'REGULAR', category: 'Seguridad' },
    { code: '740805000077', name: 'COMPUTADORA PERSONAL', brand: 'LENOVO', model: 'CORE I7', serial: 'PWOA4AZB', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740805000093', name: 'COMPUTADORA PERSONAL', brand: 'MSI', model: 'THIN 15', serial: 'K2409N0084672', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740805000094', name: 'COMPUTADORA PERSONAL', brand: 'MSI', model: 'THIN A15AL85V', serial: 'ZZCW14LG500', state: 'BUENO', category: 'Hardware/TI' },
    { code: '742223580003', name: 'EQUIPO MULTIFUNCIONAL', brand: 'ECOSYS5545', model: 'M2035DN/L', serial: 'LZJ5X07429', state: 'MALO', category: 'Hardware/TI' },
    { code: '742223580183', name: 'EQUIPO MULTIFUNCIONAL', brand: 'KYOCERA', model: 'ECOSYS M2040', serial: 'MFP220-20V', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740826560020', name: 'EQUIPO PARA MOSTRAR DATOS', brand: 'EPSON', model: 'H552A/S18+', serial: 'V8UK5600035', state: 'MALO', category: 'Hardware/TI' },
    { code: '740826560021', name: 'EQUIPO PARA MOSTRAR DATOS', brand: 'EPSON', model: 'H552A/X24+', serial: 'VABK5605021', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '746437120153', name: 'ESCRITORIO DE MADERA', brand: 'S/I', model: 'SIN GABETAS', serial: '', state: 'MALO', category: 'Mobiliario' },
    
    // PAGINA 2
    { code: '740881870040', name: 'MONITOR PLANO', brand: 'AOC', model: '18.5LM00012', serial: 'ADX8203003002', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740881870252', name: 'MONITOR PLANO', brand: 'HP', model: 'L1710', serial: 'CNC837BLQX', state: 'MALO', category: 'Hardware/TI' },
    { code: '740881870253', name: 'MONITOR PLANO', brand: 'LG', model: 'S/I', serial: '909UXFV6H1893', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740881870548', name: 'MONITOR PLANO', brand: 'AOC', model: '215LM00040', serial: 'AGBFC9A004153', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740881870549', name: 'MONITOR PLANO', brand: 'AOC', model: '215LM00040', serial: 'AGBFC9A004172', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740881870550', name: 'MONITOR PLANO', brand: 'AOC', model: '215LM00040', serial: 'AGBFC9A004152', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740881870551', name: 'MONITOR PLANO', brand: 'AOC', model: '215LM00040', serial: 'AGBFC9A004157', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740881870552', name: 'MONITOR PLANO', brand: 'AOC', model: '215LM00040', serial: 'AGBFC9A004143', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740881870553', name: 'MONITOR PLANO', brand: 'AOC', model: '215LM00040', serial: 'AGBFC9A004161', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '602284430003', name: 'MULTIMETRO-MULTITESTER', brand: 'CABLE TESTER', model: 'GLT-104', serial: '', state: 'REGULAR', category: 'Herramientas' },
    { code: '746466950003', name: 'PANTALLA ECRAN', brand: 'CATA', model: '', serial: '', state: 'REGULAR', category: 'Accesorios' },
    { code: '740889500011', name: 'RUTEADOR DE RED - ROUTER', brand: 'CISCO', model: 'CISCO 1941 W/2', serial: 'F1X153590100', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '740889500012', name: 'RUTEADOR DE RED - ROUTER', brand: 'CISCO', model: 'CISCO 1941', serial: 'F1X1506891IM', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '740889500013', name: 'RUTEADOR DE RED - ROUTER', brand: 'CISCO', model: 'CISCO 1941 MBP', serial: 'F1X1529038H', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '740889500017', name: 'RUTEADOR DE RED - ROUTER', brand: 'MIKROTIK', model: 'RB4011', serial: 'D4400C5604ED', state: 'REGULAR', category: 'Infraestructura de Red' },
    { code: '740889500018', name: 'RUTEADOR DE RED - ROUTER', brand: 'TP-LINK', model: 'TL-WR940N', serial: '22065V6007457', state: 'REGULAR', category: 'Infraestructura de Red' },
    { code: '740882000001', name: 'SERVIDOR', brand: 'INTEL', model: 'PROLIANT DL38', serial: 'MXQ12403WP', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740882000005', name: 'SERVIDOR', brand: 'HP', model: 'HSTNS-2146', serial: '151600138406', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740882000009', name: 'SERVIDOR', brand: 'HP', model: 'PROLIANT DL380 GEN10', serial: '2M293200PZ', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740892000009', name: 'SERVIDOR', brand: '', model: '', serial: '2M204100V6', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '746483900000', name: 'SILLA GIRATORIA DE METAL', brand: 'S/I', model: 'S/I', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '746483900071', name: 'SILLA GIRATORIA DE METAL', brand: 'S/I', model: 'CON CODERAS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '746483900084', name: 'SILLA GIRATORIA DE METAL', brand: 'S/I', model: 'CON CODERA', serial: '', state: 'CHATARRA', category: 'Mobiliario' },
    { code: '746483900113', name: 'SILLA GIRATORIA DE METAL', brand: 'S/I', model: 'CON CODERA', serial: '', state: 'CHATARRA', category: 'Mobiliario' },
    
    // PAGINA 3
    { code: '746483900186', name: 'SILLA GIRATORIA DE METAL', brand: 'S/I', model: 'SIN CODERAS', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '746483900187', name: 'SILLA GIRATORIA DE METAL', brand: 'S/I', model: 'UNA CODERA', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '746483900188', name: 'SILLA GIRATORIA DE METAL', brand: 'S/I', model: 'CON CODERAS', serial: '', state: 'REGULAR', category: 'Mobiliario' },
    { code: '952278340005', name: 'SISTEMA DE PROYECCION', brand: 'EPSON', model: 'H661A POWER', serial: 'X8824607808', state: 'BUENO', category: 'Hardware/TI' },
    { code: '740894870006', name: 'SWITCH PARA RED', brand: 'D-LINK', model: 'DES-1024A', serial: 'CB3T1B201054B', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '740894870018', name: 'SWITCH PARA RED', brand: 'D-LINK', model: 'DES-1024A', serial: 'CB3T1B8000561', state: 'REGULAR', category: 'Infraestructura de Red' },
    { code: '740894870023', name: 'SWITCH PARA RED', brand: 'TP-LINK', model: 'TLSG102YD', serial: '218C824003365', state: 'REGULAR', category: 'Infraestructura de Red' },
    { code: '740894870027', name: 'SWITCH PARA RED', brand: 'TP-LINK', model: 'TLSG1024D', serial: '218C824003399', state: 'REGULAR', category: 'Infraestructura de Red' },
    { code: '740894870029', name: 'SWITCH PARA RED', brand: 'TP-LINK', model: 'SF-1008D', serial: '21897490009023', state: 'REGULAR', category: 'Infraestructura de Red' },
    { code: '740895000360', name: 'TECLADO - KEYBOARD', brand: 'ECOTREND', model: 'S/I', serial: '9JF1MT1UBS72', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000629', name: 'TECLADO - KEYBOARD', brand: 'GENIUS', model: 'GK-070008/U', serial: 'YB4CC1UX3605', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895000679', name: 'TECLADO - KEYBOARD', brand: 'GENIUS', model: 'GK-150002', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000691', name: 'TECLADO - KEYBOARD', brand: 'GENIUS', model: 'GK12-0012', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000859', name: 'TECLADO - KEYBOARD', brand: 'MICROSOFT', model: '1576', serial: '66904772986', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000982', name: 'TECLADO - KEYBOARD', brand: 'ADVANCE', model: 'GT-KB08CM', serial: 'KB249000083', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895000953', name: 'TECLADO - KEYBOARD', brand: 'ADVANCE', model: 'GTK-B08CM', serial: 'KB249000026', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895000984', name: 'TECLADO - KEYBOARD', brand: 'ADVANCE', model: 'GT-KB08CM', serial: 'KB249730039', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895000943', name: 'TECLADO - KEYBOARD', brand: 'HP', model: 'KU-1469', serial: '', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895001007', name: 'TECLADO - KEYBOARD', brand: 'ADVANCE', model: 'ADV4022N', serial: 'ADV4022N', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895001087', name: 'TECLADO - KEYBOARD', brand: 'LOGITECH', model: 'YU0036', serial: '2404LQ30E188', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895001098', name: 'TECLADO - KEYBOARD', brand: 'LOGITECH', model: 'YU0036', serial: '2325MR130798', state: 'MALO', category: 'Hardware/TI' },
    { code: '952282870066', name: 'TELEFONO', brand: 'ALMER', model: 'AMBER', serial: 'BH2010TD028447', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000511', name: 'UNIDAD CENTRAL DE PROCESAMIENTO', brand: 'ALTRON', model: 'INTEL', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000563', name: 'UNIDAD CENTRAL DE PROCESAMIENTO', brand: 'ALTRON', model: 'INTEL', serial: '', state: 'REGULAR', category: 'Hardware/TI' },
    
    // PAGINA 4 (La Capilla)
    { code: '462200500009', name: 'ACUMULADOR DE ENERGIA', brand: 'EATON POWER', model: 'PN81302000TXL', serial: 'G52A40406', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '46220500022', name: 'ACUMULADOR DE ENERGIA', brand: '', model: '', serial: '10328918', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '462200500034', name: 'ACUMULADOR DE ENERGIA', brand: 'APC', model: 'SRT6KRMXLIQ', serial: 'AS2043274351', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740805000761', name: 'COMPUTADORA PERSONAL', brand: 'TOSHIBA', model: 'SATELLITE A505', serial: 'S/I', state: 'MALO', category: 'Hardware/TI' },
    { code: '746437120126', name: 'ESCRITORIO DE MADERA', brand: '', model: '4 GABETAS', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '462252150253', name: 'ESTABILIZADOR', brand: 'QUASAR', model: 'PLI 1200', serial: '1805PL12001372', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '462252150341', name: 'ESTABILIZADOR', brand: 'FORZA', model: '750W', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '462252150521', name: 'ESTABILIZADOR', brand: 'QUASAR', model: 'PLI1200', serial: '326BPLI12000057', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '746461340229', name: 'MODULO DE MELAMINA', brand: 'S/I', model: '2 PISOS', serial: '', state: 'MALO', category: 'Mobiliario' },
    { code: '740887000249', name: 'MONITOR A COLOR', brand: 'SAMSUNG', model: 'LS19B150MS/ZN', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '740881870381', name: 'MONITOR PLANO', brand: 'SAMSUNG', model: 'S20D300NH', serial: 'ZZCW14LG500', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740881870389', name: 'MONITOR PLANO', brand: 'SAMSUNG', model: 'S20D300NH', serial: 'ZZCW14LG500', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740889500020', name: 'RUTEADOR DE RED - ROUTER', brand: 'MIKROTIK', model: 'RV4011IGSRN', serial: '', state: 'REGULAR', category: 'Infraestructura de Red' },
    { code: '740882000010', name: 'SERVIDOR', brand: 'DELL EMC', model: 'R740', serial: '24891488319/BF', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740882000011', name: 'SERVIDOR', brand: 'DELL EMC', model: 'R750', serial: '24891301895/BF', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740882000012', name: 'SERVIDOR', brand: 'GRANDSTREAM', model: 'UCM6204', serial: '21AWMFTM304', state: 'MALO', category: 'Hardware/TI' },
    { code: '740894870014', name: 'SWITCH PARA RED', brand: 'D-LINK', model: 'DES1024A', serial: 'QB3T1B300C360', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '740894870015', name: 'SWITCH PARA RED', brand: 'ZATRA', model: 'SA-FS1024', serial: '11150700503', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '740894870016', name: 'SWITCH PARA RED', brand: 'ZATRA', model: 'SA-FS1024', serial: '11150700499', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '740894870025', name: 'SWITCH PARA RED', brand: 'TP-LINK', model: 'TL-SG1024D', serial: '50111H2000646', state: 'MALO', category: 'Infraestructura de Red' },
    { code: '740894870046', name: 'SWITCH PARA RED', brand: 'CISCO', model: 'CATALYST', serial: '', state: 'REGULAR', category: 'Infraestructura de Red' },
    { code: '740895000641', name: 'TECLADO - KEYBOARD', brand: 'GENIUS', model: 'GK 100015', serial: 'XEE807011732', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895000666', name: 'TECLADO - KEYBOARD', brand: 'ADVANCE', model: 'GTK080CM', serial: 'VA0315K0228', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000778', name: 'TECLADO - KEYBOARD', brand: 'ADVANCE', model: 'GT-KB08CM', serial: 'KB249000076', state: 'MALO', category: 'Hardware/TI' },
    
    // PAGINA 5 (La Capilla)
    { code: '740895000849', name: 'TECLADO - KEYBOARD', brand: 'HALION', model: 'JK 330', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000945', name: 'TECLADO - KEYBOARD', brand: 'BENQ', model: '', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '952282870076', name: 'TELEFONO', brand: 'GRANDSTREAM', model: 'GRP2601P', serial: '22MTDI3M43048', state: 'MALO', category: 'Hardware/TI' },
    { code: '952285830001', name: 'TELEVISOR LCD', brand: 'LG', model: 'LCD 32"', serial: '104RMSS84446', state: 'MALO', category: 'Hardware/TI' },
    { code: '952285830002', name: 'TELEVISOR LCD', brand: 'LG', model: 'LCD 32"', serial: '203KKRTO5062', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '952285830003', name: 'TELEVISOR LCD', brand: 'LG', model: 'LCD 32"', serial: '203KQED1092', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '952285830017', name: 'TELEVISOR LCD', brand: 'ROYAL', model: 'RY-240', serial: 'DM11001908051', state: 'MALO', category: 'Hardware/TI' },
    { code: '952285830018', name: 'TELEVISOR LCD', brand: 'ROYAL', model: 'RY-240', serial: 'DM11001908051', state: 'MALO', category: 'Hardware/TI' },
    { code: '952285830019', name: 'TELEVISOR LCD', brand: 'ROYAL', model: 'RY-240', serial: 'OM11001900051', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '462289500004', name: 'TRANSFORMADOR', brand: 'A&A', model: 'TRANSFORMA', serial: '2111240042TRF', state: 'REGULAR', category: 'Hardware/TI' },
    { code: '740895000323', name: 'UNIDAD CENTRAL DE PROCESO', brand: 'HALION', model: 'B41T-N7', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000346', name: 'UNIDAD CENTRAL DE PROCESO', brand: 'INTEL', model: 'CORE I5', serial: '', state: 'MALO', category: 'Hardware/TI' },
    { code: '740895000562', name: 'UNIDAD CENTRAL DE PROCESO', brand: 'ALTRON', model: 'INTEL(R)', serial: '', state: 'MALO', category: 'Hardware/TI' }
];

const seedData = async () => {
    try {
        console.log("Iniciando inserción de datos...");
        
        // Comprobar sede central y piso
        let sede = await dbGet("SELECT id FROM sedes WHERE id = 's-1'");
        let piso = await dbGet("SELECT id FROM pisos WHERE id = 'p-1'");
        
        // Create Oficina "OFI GENERAL DE TECNOLOGIA DE LA INFORMACION"
        const oficinaId = 'o-10';
        let oficina = await dbGet("SELECT id FROM oficinas WHERE id = ?", [oficinaId]);
        
        if (!oficina) {
            await dbRun("INSERT INTO oficinas (id, name, piso_id) VALUES (?, ?, ?)", [oficinaId, 'OFI GENERAL DE TECNOLOGIA DE LA INFORMACION', 'p-1']);
            console.log("Oficina creada con éxito.");
        }

        const location = JSON.stringify({
            sedeId: "s-1",
            pisoId: "p-1",
            oficinaId: "o-10",
            responsible: "LUTHER PEDRO VILCA MANSILLA" // Según el usuario asignado en las imágenes
        });

        let insertedCount = 0;

        for (const item of items) {
            const assetId = generateId('a');
            
            // Comprobar si ya existe por si acaso
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
        
        console.log(`Se han insertado ${insertedCount} activos correctamente.`);
    } catch (err) {
        console.error("Error al insertar:", err);
    }
};

seedData();
