/* ==========================================================================
   ActivoFlow - Main Orchestrator / Routing
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const AF = window.ActivoFlow;
    if (!AF) {
        console.error("ActivoFlow core state not loaded.");
        return;
    }

    // Modal Helpers
    AF.openModal = function(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add("active");
    };

    AF.closeModal = function(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove("active");
    };


    AF.initCategories();
    AF.initDashboard();
    AF.initAssets();
    AF.initLocations();
    AF.initReports();
    if (AF.initTramite) AF.initTramite();
    if (AF.initAuth) AF.initAuth();

    // Setup navigation tabs
    const menuButtons = document.querySelectorAll(".menu-item");
    const sections = document.querySelectorAll(".content-section");

    menuButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-target");
            
            // Toggle active menu button
            menuButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Toggle active section
            sections.forEach(sec => {
                if (sec.id === `section-${target}`) {
                    sec.classList.add("active");
                } else {
                    sec.classList.remove("active");
                }
            });

            // Refresh view targets
            if (target === "dashboard") {
                AF.renderDashboardMetrics();
                AF.renderCharts();
            } else if (target === "catalog") {
                AF.renderCatalogTable();
            } else if (target === "locations") {
                AF.renderLocationTree();
                AF.populateAssignmentSelects();
                AF.resetAssignmentForm();
            } else if (target === "reports") {
                if (AF.renderReportsList) AF.renderReportsList();
            } else if (target === "tramite") {
                if (AF.renderTramiteTable) AF.renderTramiteTable();
            } else if (target === "users") {
                if (AF.renderUsersTable) AF.renderUsersTable();
            }
        });
    });

    // Global Search Auto-complete (Header)
    const globalSearchInput = document.getElementById("global-search");
    const globalSearchDropdown = document.getElementById("global-search-dropdown");

    if (globalSearchInput && globalSearchDropdown) {
        globalSearchInput.addEventListener("input", (e) => {
            const val = e.target.value.toLowerCase().trim();
            globalSearchDropdown.innerHTML = "";
            globalSearchDropdown.classList.remove("active");

            if (val.length < 2) return;

            const matches = AF.state.assets.filter(a => {
                return a.code.toLowerCase().includes(val) || 
                       a.name.toLowerCase().includes(val) ||
                       (a.serial && a.serial.toLowerCase().includes(val));
            });

            if (matches.length === 0) return;

            matches.slice(0, 5).forEach(m => {
                const item = document.createElement("div");
                item.className = "search-result-item";
                item.innerHTML = `
                    <div class="item-title">${m.name}</div>
                    <div class="item-meta">Código: ${m.code} | Categoría: ${m.category} | Ubicación: ${AF.getFullLocationText(m.location)}</div>
                `;
                item.addEventListener("click", () => {
                    const btnNavReports = document.getElementById("btn-nav-reports");
                    if (btnNavReports) {
                        btnNavReports.click();
                        AF.loadReportDocument(m);
                        globalSearchInput.value = "";
                        globalSearchDropdown.innerHTML = "";
                        globalSearchDropdown.classList.remove("active");
                    }
                });
                globalSearchDropdown.appendChild(item);
            });
            globalSearchDropdown.classList.add("active");
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".search-input-wrapper")) {
                globalSearchDropdown.classList.remove("active");
            }
        });
    }

    // Modal background click registers to close
    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                AF.closeModal(modal.id);
            }
        });
    });

    // Delegated modal open and close actions
    document.addEventListener("click", (e) => {
        try {
            const openBtn = e.target.closest("[data-action]");
            if (openBtn) {
                const action = openBtn.getAttribute("data-action");
                if (action && action.startsWith("open-modal-")) {
                    const modalId = action.replace("open-modal-", "modal-");
                    AF.openModal(modalId);
                }
            }

            const closeBtn = e.target.closest("[data-close]");
            if (closeBtn) {
                const targetModal = closeBtn.getAttribute("data-close");
                AF.closeModal(targetModal);
            }
        } catch (error) {
            alert("Error en acción modal de main.js: " + error.message);
            console.error(error);
        }
    });

    // Initialize Supabase configuration modal UI handlers
    AF.initSupabaseConfigUI = function() {
        const btnConfig = document.getElementById("btn-supabase-config");
        if (btnConfig) {
            // Render icons inside the button
            if (window.lucide) window.lucide.createIcons();

            btnConfig.addEventListener("click", () => {
                const isConnected = !!AF.supabase;
                const btnExport = document.getElementById("btn-supabase-export");
                if (btnExport) {
                    btnExport.disabled = !isConnected;
                }

                AF.openModal("modal-supabase");
                if (window.lucide) window.lucide.createIcons();
            });
        }

        const btnExport = document.getElementById("btn-supabase-export");
        if (btnExport) {
            btnExport.addEventListener("click", async () => {
                if (!AF.supabase) return;
                if (confirm("¿Estás seguro de exportar los datos locales? Esto sobrescribirá todos los datos de Supabase.")) {
                    AF.showToast("Exportando datos locales a Supabase...", "info");
                    
                    const localData = localStorage.getItem("activoflow_state");
                    if (localData) {
                        try {
                            AF.state = JSON.parse(localData);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    
                    await AF.syncToSupabase();
                    AF.showToast("Datos locales exportados con éxito.", "success");
                    
                    AF.renderDashboardMetrics();
                    AF.renderCharts();
                    if (AF.renderCatalogTable) AF.renderCatalogTable();
                    if (AF.renderLocationTree) AF.renderLocationTree();
                }
            });
        }

        const btnCopySql = document.getElementById("btn-copy-sql");
        if (btnCopySql) {
            btnCopySql.addEventListener("click", () => {
                const textarea = document.getElementById("sql-code");
                textarea.select();
                document.execCommand("copy");
                AF.showToast("SQL copiado al portapapeles.", "success");
            });
        }
    };

    // Initialize all modular elements (async)
    AF.initStore().then(() => {
        // Render landing stats
        AF.renderDashboardMetrics();
        AF.renderCharts();
        
        // Initialize Supabase configuration modal and actions
        AF.initSupabaseConfigUI();
    });
});

