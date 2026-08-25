/* ==========================================================================
   ActivoFlow - Dashboard & Analytics Module
   ========================================================================== */

(function(AF) {
    let chartStatesInstance = null;
    let chartCategoriesInstance = null;

    AF.renderDashboardMetrics = function() {
        const total = AF.state.assets.length;
        const good = AF.state.assets.filter(a => a.state === "Nuevo" || a.state === "Bueno").length;
        const damaged = AF.state.assets.filter(a => a.state === "Malo" || a.state === "Regular").length;
        const unassigned = AF.state.assets.filter(a => !a.location).length;

        // Animate counter displays
        AF.animateCounter("metric-total-assets", total);
        AF.animateCounter("metric-good-assets", good);
        AF.animateCounter("metric-damaged-assets", damaged);
        AF.animateCounter("metric-unassigned-assets", unassigned);

        // Percentages calculation
        document.getElementById("metric-good-pct").textContent = total > 0 ? `${Math.round((good / total) * 100)}%` : "0%";
        document.getElementById("metric-damaged-pct").textContent = total > 0 ? `${Math.round((damaged / total) * 100)}%` : "0%";
        document.getElementById("metric-unassigned-pct").textContent = total > 0 ? `${Math.round((unassigned / total) * 100)}%` : "0%";

        // Render Recent History Table
        const historyBody = document.getElementById("table-recent-history-body");
        if (!historyBody) return;
        
        historyBody.innerHTML = "";
        
        // Sort history by date descending
        const sortedMovements = [...AF.state.movements].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

        if (sortedMovements.length === 0) {
            historyBody.innerHTML = `<tr><td colspan="6" style="text-align:center;" class="text-muted">No hay movimientos registrados.</td></tr>`;
            return;
        }

        sortedMovements.forEach(m => {
            const row = document.createElement("tr");
            const dateFormatted = new Date(m.timestamp).toLocaleString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
            row.innerHTML = `
                <td><span class="text-muted">${dateFormatted}</span></td>
                <td><strong class="text-indigo">${m.assetCode}</strong><br><small>${m.assetName}</small></td>
                <td><span class="badge badge-secondary">${m.origin}</span></td>
                <td><span class="badge badge-info">${m.destination}</span></td>
                <td><span class="font-bold">${m.responsible}</span></td>
                <td><small class="text-muted">${m.operator}</small></td>
            `;
            historyBody.appendChild(row);
        });
    };

    AF.animateCounter = function(id, targetValue) {
        const el = document.getElementById(id);
        if (!el) return;
        
        let start = 0;
        const duration = 800; // ms
        const startTime = new Date().getTime();
        
        if (targetValue === 0) {
            el.textContent = "0";
            return;
        }

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const elapsed = now - startTime;
            const progress = elapsed / duration;
            
            if (progress >= 1) {
                el.textContent = targetValue;
                clearInterval(timer);
            } else {
                const current = Math.floor(targetValue * progress);
                el.textContent = current;
            }
        }, 16);
    };

    AF.renderCharts = function() {
        const ctxStates = document.getElementById("chart-states");
        const ctxCategories = document.getElementById("chart-categories");
        if (!ctxStates || !ctxCategories) return;

        // Calculate chart stats
        const statesData = { "Nuevo": 0, "Bueno": 0, "Regular": 0, "Malo": 0, "De baja": 0 };
        const categoriesData = { "Hardware/TI": 0, "Infraestructura de Red": 0, "Mobiliario": 0 };

        AF.state.assets.forEach(a => {
            if (statesData[a.state] !== undefined) statesData[a.state]++;
            if (categoriesData[a.category] !== undefined) categoriesData[a.category]++;
        });

        // 1. States Distribution (Doughnut)
        if (chartStatesInstance) chartStatesInstance.destroy();
        chartStatesInstance = new Chart(ctxStates, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statesData),
                datasets: [{
                    data: Object.values(statesData),
                    backgroundColor: [
                        '#0284c7', // Nuevo (Celeste)
                        '#10b981', // Bueno (Emerald)
                        '#f59e0b', // Regular (Amber)
                        '#ef4444', // Malo (Red)
                        '#64748b'  // De baja (Slate)
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#475569', font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });

        // 2. Categories Distribution (Bar)
        if (chartCategoriesInstance) chartCategoriesInstance.destroy();
        chartCategoriesInstance = new Chart(ctxCategories, {
            type: 'bar',
            data: {
                labels: Object.keys(categoriesData),
                datasets: [{
                    label: 'Cantidad de Activos',
                    data: Object.values(categoriesData),
                    backgroundColor: [
                        'rgba(14, 165, 233, 0.75)',
                        'rgba(79, 70, 229, 0.75)',
                        'rgba(16, 185, 129, 0.75)'
                    ],
                    borderColor: [
                        '#0ea5e9',
                        '#4f46e5',
                        '#10b981'
                    ],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: '#64748b', stepSize: 1 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    };

    // Initialize module event listeners
    AF.initDashboard = function() {
        const btnClearHistory = document.getElementById("btn-clear-history");
        if (btnClearHistory) {
            btnClearHistory.addEventListener("click", () => {
                if (confirm("¿Está seguro de que desea limpiar todo el historial de movimientos? Esta acción no se puede deshacer.")) {
                    AF.state.movements = [];
                    AF.saveStore();
                    AF.renderDashboardMetrics();
                    AF.showToast("Historial de movimientos vaciado.", "warning");
                }
            });
        }
    };

})(window.ActivoFlow);
