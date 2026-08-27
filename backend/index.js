let sseClients = [];
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDb, dbRun, dbGet, dbAll } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Servir archivos estáticos del frontend en producción
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    console.log("[Backend] Sirviendo archivos estáticos del frontend desde:", frontendDist);
}

// Dedicated directory for documents in workspace root
const docsDir = path.join(__dirname, '..', 'documentos_tramite');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

// Helper to get MIME type from file extension
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.txt': 'text/plain',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return map[ext] || 'application/octet-stream';
}

// Serve documents from the database dynamically (with disk fallback)
app.get('/documentos/:filename', async (req, res) => {
    const { filename } = req.params;
    try {
        // 1. Search in SQLite database
        const fileRow = await dbGet("SELECT file_data, mime_type FROM document_files WHERE filename = ?", [filename]);
        if (fileRow) {
            res.setHeader('Content-Type', fileRow.mime_type || 'application/octet-stream');
            return res.send(fileRow.file_data);
        }

        // 2. Search on disk as fallback
        const filePath = path.join(docsDir, filename);
        if (fs.existsSync(filePath)) {
            const mimeType = getMimeType(filename);
            res.setHeader('Content-Type', mimeType);
            return res.sendFile(filePath);
        }

        res.status(404).send("Archivo no encontrado.");
    } catch (error) {
        console.error("Error al obtener el documento de la base de datos:", error);
        res.status(500).send("Error del servidor al recuperar el archivo.");
    }
});

// Helper to migrate files from disk to the SQLite database on startup
async function migrateDiskFilesToDb() {
    try {
        if (!fs.existsSync(docsDir)) {
            return;
        }
        const files = fs.readdirSync(docsDir);
        let count = 0;
        for (const file of files) {
            const filePath = path.join(docsDir, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                const existing = await dbGet("SELECT filename FROM document_files WHERE filename = ?", [file]);
                if (!existing) {
                    const fileBuffer = fs.readFileSync(filePath);
                    const mimeType = getMimeType(file);
                    await dbRun(
                        "INSERT INTO document_files (filename, file_data, mime_type) VALUES (?, ?, ?)",
                        [file, fileBuffer, mimeType]
                    );
                    count++;
                }
            }
        }
        if (count > 0) {
            console.log(`[PatriGest Migration] Migración completada. ${count} archivos locales guardados en la base de datos SQLite.`);
        } else {
            console.log("[PatriGest Migration] Todos los archivos locales ya se encuentran en SQLite.");
        }
    } catch (err) {
        console.error("[PatriGest Migration] Error al migrar archivos locales a la base de datos:", err);
    }
}

// Initialize SQLite database
initDb().then(async () => {
    console.log("[PatriGest Backend] Base de datos SQLite inicializada.");
    await migrateDiskFilesToDb();
}).catch(err => {
    console.error("[PatriGest Backend] Error al inicializar SQLite:", err);
});

// Helper to sanitize filenames
function sanitizeFilename(name) {
    return name
        .replace(/[^a-zA-Z0-9_\-]/g, '_')
        .replace(/_+/g, '_')
        .trim();
}

// Helper to find matching file in database or documentos_tramite (case insensitive match)
async function findDocumentFile(docType, docNro, prefix = '') {
    const baseName = sanitizeFilename(`${prefix}${docType}_${docNro}`).toLowerCase();
    
    // 1. Search database first
    try {
        const rows = await dbAll("SELECT filename FROM document_files");
        const match = rows.find(r => {
            const ext = path.extname(r.filename);
            const nameWithoutExt = path.basename(r.filename, ext);
            return nameWithoutExt.toLowerCase() === baseName;
        });
        if (match) {
            return `/documentos/${match.filename}`;
        }
    } catch (err) {
        console.error("Error al buscar archivo coincidente en SQLite:", err);
    }

    // 2. Search disk fallback
    if (fs.existsSync(docsDir)) {
        try {
            const files = fs.readdirSync(docsDir);
            const match = files.find(f => {
                const ext = path.extname(f);
                const nameWithoutExt = path.basename(f, ext);
                return nameWithoutExt.toLowerCase() === baseName;
            });
            return match ? `/documentos/${match}` : null;
        } catch (err) {
            console.error("Error reading documents directory:", err);
            return null;
        }
    }
    return null;
}


// Endpoint para SSE (Server-Sent Events) - Sincronización en tiempo real
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };
    sseClients.push(newClient);

    req.on('close', () => {
        sseClients = sseClients.filter(client => client.id !== clientId);
    });
});

// Endpoint para comprobar estado y obtener todo el estado inicial de base de datos
app.get('/api/state', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    try {
        const sedes = await dbAll("SELECT * FROM sedes");
        
        const pisosRaw = await dbAll("SELECT * FROM pisos");
        const pisos = pisosRaw.map(p => ({
            id: p.id,
            name: p.name,
            sedeId: p.sede_id
        }));

        const oficinasRaw = await dbAll("SELECT * FROM oficinas");
        const oficinas = oficinasRaw.map(o => ({
            id: o.id,
            name: o.name,
            pisoId: o.piso_id
        }));

        const assetsRaw = await dbAll("SELECT * FROM assets");
        const assets = assetsRaw.map(a => ({
            id: a.id,
            code: a.code,
            type: a.type,
            name: a.name,
            category: a.category,
            brand: a.brand,
            model: a.model,
            serial: a.serial,
            controlType: a.control_type,
            quantity: a.quantity,
            state: a.state,
            purchaseOrder: a.purchase_order,
            provider: a.provider,
            purchaseDate: a.purchase_date,
            warrantyEnd: a.warranty_end,
            location: a.location ? JSON.parse(a.location) : null,
            specs: a.specs ? JSON.parse(a.specs) : null
        }));

        const movementsRaw = await dbAll("SELECT * FROM movements ORDER BY id DESC");
        const movements = movementsRaw.map(m => ({
            timestamp: m.timestamp,
            assetCode: m.asset_code,
            assetName: m.asset_name,
            origin: m.origin,
            destination: m.destination,
            responsible: m.responsible,
            operator: m.operator
        }));
        const documentsRaw = await dbAll("SELECT * FROM documents ORDER BY id ASC");
        const documents = [];
        for (const d of documentsRaw) {
            const responseObj = d.response ? JSON.parse(d.response) : null;
            if (responseObj) {
                responseObj.filePath = responseObj.filePath || await findDocumentFile(responseObj.docType, responseObj.docNro, 'RESP_');
            }
            
            const reentryObj = d.reentry ? JSON.parse(d.reentry) : null;
            if (reentryObj) {
                reentryObj.filePath = reentryObj.filePath || await findDocumentFile(d.doc_type, d.doc_nro, 'REIN_');
            }
            
            const filePath = d.file_path || await findDocumentFile(d.doc_type, d.doc_nro);
            
            documents.push({
                id: d.id,
                regNro: d.reg_nro,
                dateRec: d.date_rec,
                docType: d.doc_type,
                docNro: d.doc_nro,
                sender: d.sender,
                recipient: d.recipient,
                subject: d.subject,
                folios: d.folios,
                response: responseObj,
                reentry: reentryObj,
                filePath: filePath
            });
        }
        const usuarios = await dbAll("SELECT id, email, name, role, password, active, created_at FROM usuarios ORDER BY created_at DESC");

        res.json({
            success: true,
            data: {
                locations: {
                    sedes,
                    pisos,
                    oficinas
                },
                assets,
                movements,
                documents,
                usuarios
            }
        });
    } catch (error) {
        console.error("Error general en backend al obtener estado SQLite:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para sincronizar el estado completo desde el cliente hacia la base de datos local SQLite
app.post('/api/sync', async (req, res) => {
    const { locations, assets, movements, documents } = req.body;
    try {
        // Ejecutamos limpieza e inserciones
        await dbRun("DELETE FROM oficinas");
        await dbRun("DELETE FROM pisos");
        await dbRun("DELETE FROM sedes");
        await dbRun("DELETE FROM assets");
        await dbRun("DELETE FROM movements");
        await dbRun("DELETE FROM documents");

        // A. Sincronizar Sedes
        for (const s of locations?.sedes || []) {
            await dbRun("INSERT INTO sedes (id, name) VALUES (?, ?)", [s.id, s.name]);
        }

        // B. Sincronizar Pisos
        for (const p of locations?.pisos || []) {
            await dbRun("INSERT INTO pisos (id, name, sede_id) VALUES (?, ?, ?)", [p.id, p.name, p.sedeId]);
        }

        // C. Sincronizar Oficinas
        for (const o of locations?.oficinas || []) {
            await dbRun("INSERT INTO oficinas (id, name, piso_id) VALUES (?, ?, ?)", [o.id, o.name, o.pisoId]);
        }

        // D. Sincronizar Assets
        for (const a of assets || []) {
            await dbRun(
                `INSERT INTO assets (id, code, type, name, category, brand, model, serial, control_type, quantity, state, purchase_order, provider, purchase_date, warranty_end, location, specs)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    a.id, a.code, a.type || null, a.name, a.category, a.brand, a.model, a.serial,
                    a.controlType, a.quantity, a.state || 'Bueno', a.purchaseOrder,
                    a.provider, a.purchaseDate, a.warrantyEnd,
                    a.location ? JSON.stringify(a.location) : null,
                    a.specs ? JSON.stringify(a.specs) : null
                ]
            );
        }

        // E. Sincronizar Movements
        for (const m of movements || []) {
            await dbRun(
                `INSERT INTO movements (timestamp, asset_code, asset_name, origin, destination, responsible, operator)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [m.timestamp, m.assetCode, m.assetName, m.origin, m.destination, m.responsible, m.operator]
            );
        }
        // F. Sincronizar Documents
        for (const d of documents || []) {
            await dbRun(
                `INSERT INTO documents (id, reg_nro, date_rec, doc_type, doc_nro, sender, recipient, subject, folios, response, file_path, reentry)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    d.id, d.regNro, d.dateRec, d.docType, d.docNro, d.sender,
                    d.recipient, d.subject, d.folios,
                    d.response ? JSON.stringify(d.response) : null,
                    d.filePath || null,
                    d.reentry ? JSON.stringify(d.reentry) : null
                ]
            );
        }
        res.json({ success: true, message: "Sincronización completada con éxito en SQLite local." });
    } catch (error) {
        console.error("Error al sincronizar datos en SQLite local:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener configuración (para compatibilidad de frontend)
app.get('/api/config', (req, res) => {
    res.json({
        local: true
    });
});

// Endpoint para subir archivos localmente
app.post('/api/upload', async (req, res) => {
    const { filename, fileData, docType, docNro, isResponse, isReentry } = req.body;
    if (!filename || !fileData || !docType || !docNro) {
        return res.status(400).json({ error: "Nombre de archivo, datos, tipo y número de documento son requeridos." });
    }
    try {
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }

        // Obtener el MIME type de los datos Base64, o usar el helper como plan B
        const mimeType = fileData.match(/^data:(.*?);base64,/)?.[1] || getMimeType(filename);

        // Remover prefijos Base64 data:URL si están presentes
        const base64Data = fileData.replace(/^data:.*?;base64,/, "");

        // Extraer extensión del archivo y formatear el nombre final estructurado
        const ext = path.extname(filename) || '.pdf';
        const prefix = isResponse ? 'RESP_' : (isReentry ? 'REIN_' : '');
        const cleanFilename = `${sanitizeFilename(prefix + docType + '_' + docNro)}${ext}`;

        // Convertir a buffer para guardar como BLOB
        const fileBuffer = Buffer.from(base64Data, 'base64');

        // 1. Guardar en la base de datos (SQLite)
        await dbRun(
            "INSERT OR REPLACE INTO document_files (filename, file_data, mime_type) VALUES (?, ?, ?)",
            [cleanFilename, fileBuffer, mimeType]
        );
        console.log(`[Backend] Archivo de trámite guardado en base de datos: ${cleanFilename}`);

        // 2. Guardar archivo decodificado en disco
        const filePath = path.join(docsDir, cleanFilename);
        fs.writeFileSync(filePath, base64Data, 'base64');
        console.log(`[Backend] Archivo de trámite guardado en disco: ${filePath}`);

        res.json({
            success: true,
            filepath: `/documentos/${cleanFilename}`
        });
    } catch (error) {
        console.error("Error al subir archivo en backend:", error);
        res.status(500).json({ error: "Error interno al guardar el archivo." });
    }
});

// --- Endpoints de Autenticación Local ---

// Login Local
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Correo/Usuario y contraseña son requeridos." });
    }
    try {
        const user = await dbGet(
            "SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)",
            [email, email]
        );
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }
        if (user.active === 0) {
            return res.status(403).json({ error: "El usuario está desactivado y no puede acceder al sistema." });
        }
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                active: user.active,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error("Error en login local:", error);
        res.status(500).json({ error: "Error en el servidor durante la autenticación." });
    }
});

// Registro Local de Usuario
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: "Nombre, Correo y Contraseña son requeridos." });
    }
    try {
        const existing = await dbGet("SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?)", [email]);
        if (existing) {
            return res.status(400).json({ error: "Este correo electrónico ya está registrado." });
        }
        
        const newId = "local_" + Date.now();
        const created_at = new Date().toISOString();
        const userRole = role || 'Administrador';

        await dbRun(
            "INSERT INTO usuarios (id, email, name, role, password, created_at, active) VALUES (?, ?, ?, ?, ?, ?, 1)",
            [newId, email, name, userRole, password, created_at]
        );

        res.json({
            success: true,
            user: {
                id: newId,
                email,
                name,
                role: userRole,
                active: 1,
                created_at
            }
        });
    } catch (error) {
        console.error("Error en registro local:", error);
        res.status(500).json({ error: "Error en el servidor durante el registro." });
    }
});

// Obtener todos los usuarios de la base de datos
app.get('/api/auth/users', async (req, res) => {
    try {
        const users = await dbAll("SELECT id, email, name, role, password, active, created_at FROM usuarios ORDER BY created_at DESC");
        res.json({ success: true, data: users });
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: "Error en el servidor al obtener usuarios." });
    }
});

// Cambiar estado de activación del usuario (Activar/Desactivar)
app.post('/api/auth/users/toggle-status', async (req, res) => {
    const { userId, active } = req.body;
    if (!userId || active === undefined) {
        return res.status(400).json({ error: "ID de usuario y estado 'active' son requeridos." });
    }
    try {
        if (userId === 'local_default') {
            return res.status(400).json({ error: "No se puede desactivar al usuario administrador principal de desarrollo." });
        }

        await dbRun("UPDATE usuarios SET active = ? WHERE id = ?", [active ? 1 : 0, userId]);
        console.log(`[Backend] Estado de usuario ${userId} actualizado a active = ${active}`);
        res.json({ success: true, message: `Usuario ${active ? 'activado' : 'desactivado'} con éxito.` });
    } catch (error) {
        console.error("Error al cambiar estado de usuario:", error);
        res.status(500).json({ error: "Error en el servidor al cambiar estado de usuario." });
    }
});

// Actualizar rol de usuario (Administrador / Operador)
app.post('/api/auth/users/update-role', async (req, res) => {
    const { userId, role } = req.body;
    if (!userId || !role) {
        return res.status(400).json({ error: "ID de usuario y rol son requeridos." });
    }
    try {
        await dbRun("UPDATE usuarios SET role = ? WHERE id = ?", [role, userId]);
        console.log(`[Backend] Rol de usuario ${userId} actualizado a ${role}`);
        res.json({ success: true, message: "Rol de usuario actualizado con éxito." });
    } catch (error) {
        console.error("Error al actualizar rol de usuario:", error);
        res.status(500).json({ error: "Error en el servidor al actualizar rol de usuario." });
    }
});

// Eliminar un usuario
app.post('/api/auth/users/delete', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "ID de usuario es requerido." });
    }
    try {
        await dbRun("DELETE FROM usuarios WHERE id = ?", [userId]);
        console.log(`[Backend] Usuario ${userId} eliminado.`);
        res.json({ success: true, message: "Usuario eliminado con éxito." });
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ error: "Error en el servidor al eliminar usuario." });
    }
});

// Redirigir cualquier otra petición al index.html del frontend en producción
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/documentos')) {
        return next();
    }
    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send("Servidor Backend activo. El frontend aún no ha sido compilado (corre 'npm run build').");
    }
});

app.listen(PORT, () => {
    console.log(`[PatriGest Backend] Servidor ejecutándose en http://localhost:${PORT}`);
});

