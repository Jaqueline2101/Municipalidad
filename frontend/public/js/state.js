/* ==========================================================================
   ActivoFlow - Global State & Data Store
   ========================================================================== */

// Initialize global namespace
window.ActivoFlow = {
    state: {
        assets: [],
        locations: {
            sedes: [],
            pisos: [],
            oficinas: []
        },
        movements: []
    },

    // Backend integration variables
    useBackend: false,

    // Initialize Connection with Backend
    initSupabaseClient: async function() {
        try {
            const res = await fetch("/api/state");
            if (res.ok) {
                this.useBackend = true;
                console.log("Conectado al backend local SQLite.");
                return true;
            }
        } catch (e) {
            console.error("No se pudo conectar al backend de PatriGest:", e);
        }
        this.useBackend = false;
        return false;
    },

    // Load state from LocalStorage or initialize with seed data, or sync from SQLite via backend
    initStore: async function() {
        // First load from localStorage as fallback
        const storedData = localStorage.getItem("activoflow_state");
        if (storedData) {
            try {
                this.state = JSON.parse(storedData);
                // Validate structure
                if (!this.state.assets) this.state.assets = [];
                if (!this.state.locations) this.state.locations = { sedes: [], pisos: [], oficinas: [] };
                if (!this.state.movements) this.state.movements = [];
                if (!this.state.documents) this.state.documents = [];
                if (!this.state.usuarios) this.state.usuarios = [];
            } catch (e) {
                console.error("Error al cargar localStorage, usando datos semilla", e);
                this.seedDatabase();
            }
        } else {
            this.seedDatabase();
        }

        // Try to initialize connection to backend
        const backendConnected = await this.initSupabaseClient();

        if (backendConnected) {
            try {
                const res = await fetch("/api/state");
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Error en la respuesta del backend");
                }
                const result = await res.json();
                if (result.success && result.data) {
                    const remoteData = result.data;
                    const hasRemoteData = (remoteData.locations?.sedes?.length > 0) || 
                                           (remoteData.assets?.length > 0);

                    if (!hasRemoteData && storedData) {
                        console.log("Base de datos SQLite vacía. Subiendo datos locales...");
                        await this.syncToSupabase();
                    } else {
                        this.state = remoteData;
                        if (!this.state.documents) this.state.documents = [];
                        if (!this.state.usuarios) this.state.usuarios = [];
                        localStorage.setItem("activoflow_state", JSON.stringify(this.state));
                        console.log("Datos cargados desde base de datos SQLite con éxito.");
                    }
                    this.updateSupabaseBadge(true);
                } else {
                    this.showToast("Conectado al backend, pero faltan tablas en la base de datos local.", "warning");
                    this.updateSupabaseBadge(false, "Tablas faltantes");
                }
            } catch (e) {
                console.error("Fallo al conectar con backend para cargar datos:", e);
                this.showToast("Error de red con backend. Usando caché local.", "warning");
                this.updateSupabaseBadge(false, "Error de red");
            }
        } else {
            this.updateSupabaseBadge(false);
        }

        // Validate active session status (Logout if deactivated)
        if (typeof AF !== 'undefined' && AF.checkActiveSessionStatus) {
            AF.checkActiveSessionStatus();
        }
    },

    // Sync state with LocalStorage and Supabase
    saveStore: async function() {
        localStorage.setItem("activoflow_state", JSON.stringify(this.state));
        if (this.useBackend) {
            await this.syncToSupabase();
        }
    },

    // Sync state to Supabase in the background via backend
    syncToSupabase: async function() {
        try {
            const res = await fetch("/api/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(this.state)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Error al sincronizar con el backend");
            }

            const result = await res.json();
            if (result.success) {
                console.log("Cambios locales sincronizados con Supabase via Backend.");
                this.updateSupabaseBadge(true);
            } else {
                throw new Error(result.error || "Error desconocido");
            }
        } catch (e) {
            console.error("Error al sincronizar datos en backend:", e);
            this.updateSupabaseBadge(false, "Sinc falló");
        }
    },

    // Update connection indicator badge
    updateSupabaseBadge: function(isConnected, label = null) {
        const btn = document.getElementById("btn-supabase-config");
        const text = document.getElementById("supabase-status-text");
        if (!btn || !text) return;

        if (isConnected) {
            btn.classList.add("connected");
            btn.classList.remove("error");
            text.textContent = label ? `BD: ${label}` : "BD: SQLite (Conectado)";
        } else {
            btn.classList.remove("connected");
            if (label) {
                btn.classList.add("error");
                text.textContent = `BD: ${label}`;
            } else {
                btn.classList.remove("error");
                text.textContent = "BD: Local (Navegador)";
            }
        }
    },


    // Default Seed Data
    seedDatabase: function() {
        this.state.locations = {
            sedes: [
                { id: "s-1", name: "Sede Central (Palacio Municipal)" },
                { id: "s-2", name: "Sede Sur (Seguridad y Obras)" }
            ],
            pisos: [
                { id: "p-1", name: "Piso 1", sedeId: "s-1" },
                { id: "p-2", name: "Piso 2", sedeId: "s-1" },
                { id: "p-3", name: "Piso 1", sedeId: "s-2" }
            ],
            oficinas: [
                { id: "o-1", name: "Oficina de Mesa de Partes", pisoId: "p-1" },
                { id: "o-2", name: "Oficina de Presupuesto", pisoId: "p-1" },
                { id: "o-3", name: "Oficina de Contabilidad", pisoId: "p-2" },
                { id: "o-4", name: "Oficina de Recursos Humanos", pisoId: "p-2" },
                { id: "o-5", name: "Oficina de Seguridad Ciudadana", pisoId: "p-3" }
            ]
        };

        this.state.assets = [
            {
                id: "a-1",
                code: "PAT-2026-0001",
                name: "Computadora HP EliteDesk 800 G6",
                category: "Hardware/TI",
                brand: "HP",
                model: "EliteDesk 800 G6",
                serial: "5CG2019XYZ",
                controlType: "unique",
                quantity: 1,
                state: "Bueno",
                purchaseOrder: "OC-2025-0012",
                provider: "Tecnología Integrada SAC",
                purchaseDate: "2025-02-15",
                warrantyEnd: "2028-02-15",
                location: {
                    sedeId: "s-1",
                    pisoId: "p-2",
                    oficinaId: "o-3",
                    responsible: "Luis Ramirez"
                },
                specs: {
                    "Procesador": "Intel Core i7 10ma Gen",
                    "Memoria RAM": "16 GB DDR4",
                    "Almacenamiento": "512 GB SSD NVMe"
                }
            },
            {
                id: "a-2",
                code: "PAT-2026-0002",
                name: "Impresora Láser HP LaserJet Pro M404dw",
                category: "Hardware/TI",
                brand: "HP",
                model: "LaserJet Pro M404dw",
                serial: "CNB2912ABC",
                controlType: "unique",
                quantity: 1,
                state: "Regular",
                purchaseOrder: "OC-2025-0155",
                provider: "Ofimática del Sur",
                purchaseDate: "2025-05-10",
                warrantyEnd: "2026-05-10",
                location: {
                    sedeId: "s-1",
                    pisoId: "p-1",
                    oficinaId: "o-2",
                    responsible: "Ana Gomez"
                },
                specs: {
                    "Tipo": "Láser Monocromático",
                    "Conectividad": "Wi-Fi & Red Ethernet",
                    "Velocidad de Impresión": "40 ppm"
                }
            },
            {
                id: "a-3",
                code: "PAT-2026-0003",
                name: "Switch Cisco Catalyst 2960-L",
                category: "Infraestructura de Red",
                brand: "Cisco Systems",
                model: "Catalyst 2960-L (24 Ports)",
                serial: "FOC1234X56",
                controlType: "unique",
                quantity: 1,
                state: "Nuevo",
                purchaseOrder: "OC-2025-0210",
                provider: "Redes y Telecomunicaciones Perú",
                purchaseDate: "2025-11-20",
                warrantyEnd: "2027-11-20",
                location: {
                    sedeId: "s-1",
                    pisoId: "p-2",
                    oficinaId: "o-3",
                    responsible: "Luis Ramirez"
                },
                specs: {
                    "Puertos": "24 Puertos Gigabit PoE+",
                    "Capacidad de Switch": "56 Gbps",
                    "Administrable": "Sí, Capa 2"
                }
            },
            {
                id: "a-4",
                code: "PAT-2026-0004",
                name: "Bobina de Cable UTP Cat 6A Azul",
                category: "Infraestructura de Red",
                brand: "Panduit",
                model: "Cat 6A F/UTP",
                serial: "",
                controlType: "stock",
                quantity: 8,
                state: "Bueno",
                purchaseOrder: "OC-2026-0005",
                provider: "Suministros Redes SAC",
                purchaseDate: "2026-01-08",
                warrantyEnd: "",
                location: null,
                specs: {
                    "Categoría": "Cat 6A",
                    "Longitud": "305 metros por bobina",
                    "Blindaje": "F/UTP"
                }
            },
            {
                id: "a-5",
                code: "PAT-2026-0005",
                name: "Escritorio de Madera Estilo Gerente",
                category: "Mobiliario",
                brand: "Muebles D'Kora",
                model: "Gerencial Roble",
                serial: "",
                controlType: "stock",
                quantity: 15,
                state: "Bueno",
                purchaseOrder: "OC-2025-0901",
                provider: "Maderera del Centro",
                purchaseDate: "2025-09-12",
                warrantyEnd: "",
                location: null,
                specs: {
                    "Material": "Madera Roble / Metal",
                    "Dimensiones": "160cm x 80cm x 75cm"
                }
            },
            {
                id: "a-6",
                code: "PAT-2026-0006",
                name: "Silla Ergonómica Pro con Ajuste Lumbar",
                category: "Mobiliario",
                brand: "ErgoChair",
                model: "Pro Series V2",
                serial: "SIL-00129",
                controlType: "unique",
                quantity: 1,
                state: "Bueno",
                purchaseOrder: "OC-2025-1044",
                provider: "OfiExpress Perú",
                purchaseDate: "2025-10-02",
                warrantyEnd: "2026-10-02",
                location: {
                    sedeId: "s-1",
                    pisoId: "p-1",
                    oficinaId: "o-1",
                    responsible: "Carlos Vega"
                },
                specs: {
                    "Ajuste Lumbar": "Regulable en altura",
                    "Material de Asiento": "Malla Antitranspirante",
                    "Apoyabrazos": "Ajuste 3D"
                }
            }
        ];

        const now = new Date();
        this.state.movements = [
            {
                timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 3).toISOString(),
                assetCode: "PAT-2026-0001",
                assetName: "Computadora HP EliteDesk 800 G6",
                origin: "Almacén Central",
                destination: "Oficina de Contabilidad (Sede Central)",
                responsible: "Luis Ramirez",
                operator: "Juan Delgado (ADMIN)"
            },
            {
                timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000 * 2).toISOString(),
                assetCode: "PAT-2026-0002",
                assetName: "Impresora Láser HP LaserJet Pro M404dw",
                origin: "Almacén Central",
                destination: "Oficina de Presupuesto (Sede Central)",
                responsible: "Ana Gomez",
                operator: "Juan Delgado (ADMIN)"
            },
            {
                timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
                assetCode: "PAT-2026-0006",
                assetName: "Silla Ergonómica Pro con Ajuste Lumbar",
                origin: "Almacén Central",
                destination: "Oficina de Mesa de Partes (Sede Central)",
                responsible: "Carlos Vega",
                operator: "Juan Delgado (ADMIN)"
            }
        ];
        this.saveStore();
    },

    // Location query helpers
    getSedeName: function(id) {
        const item = this.state.locations.sedes.find(x => x.id === id);
        return item ? item.name : "Desconocida";
    },

    getPisoName: function(id) {
        const item = this.state.locations.pisos.find(x => x.id === id);
        return item ? item.name : "Desconocida";
    },

    getOficinaName: function(id) {
        const item = this.state.locations.oficinas.find(x => x.id === id);
        return item ? item.name : "Desconocida";
    },

    getFullLocationText: function(loc) {
        if (!loc) return "Almacén Central (Sin asignar)";
        const oName = this.getOficinaName(loc.oficinaId);
        const pName = this.getPisoName(loc.pisoId);
        const sName = this.getSedeName(loc.sedeId);
        return `${oName} (${sName} - ${pName})`;
    },

    // Date formatting helper
    formatDate: function(dateStr) {
        if (!dateStr) return "";
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
    },

    // Global toast notifier helper
    showToast: function(message, type = "success") {
        const container = document.getElementById("toast-container");
        if (!container) return;
        
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        let icon = "check-circle";
        if (type === "warning") icon = "alert-triangle";
        if (type === "danger") icon = "x-circle";
        
        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <div class="toast-message">${message}</div>
            <button class="toast-close">&times;</button>
        `;
        
        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();
        
        const timeout = setTimeout(() => {
            this.removeToast(toast);
        }, 4000);

        toast.querySelector(".toast-close").addEventListener("click", () => {
            clearTimeout(timeout);
            this.removeToast(toast);
        });
    },

    removeToast: function(toast) {
        toast.style.animation = "slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse forwards";
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};
