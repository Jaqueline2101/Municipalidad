/* ==========================================================================
   ActivoFlow - Assets Catalog Module
   ========================================================================== */

(function(AF) {
    
    AF.renderCatalogTable = function() {
        const tableBody = document.getElementById("table-catalog-body");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        const query = document.getElementById("catalog-search").value.toLowerCase().trim();
        const catFilter = document.getElementById("catalog-filter-category").value;
        const stateFilter = document.getElementById("catalog-filter-state").value;
        const typeFilter = document.getElementById("catalog-filter-type").value;

        const filtered = AF.state.assets.filter(a => {
            const matchesText = a.code.toLowerCase().includes(query) || 
                                a.name.toLowerCase().includes(query) || 
                                a.brand.toLowerCase().includes(query) || 
                                a.model.toLowerCase().includes(query) ||
                                (a.serial && a.serial.toLowerCase().includes(query));
            
            const matchesCategory = (catFilter === "all") || (a.category === catFilter);
            const matchesState = (stateFilter === "all") || (a.state === stateFilter);
            const matchesType = (typeFilter === "all") || 
                                (typeFilter === "unique" && a.controlType === "unique") || 
                                (typeFilter === "stock" && a.controlType === "stock");

            return matchesText && matchesCategory && matchesState && matchesType;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;" class="text-muted">No se encontraron bienes.</td></tr>`;
            return;
        }

        filtered.forEach(a => {
            const row = document.createElement("tr");
            
            let badgeClass = "badge-secondary";
            if (a.state === "Nuevo") badgeClass = "badge-info";
            if (a.state === "Bueno") badgeClass = "badge-success";
            if (a.state === "Regular") badgeClass = "badge-warning";
            if (a.state === "Malo" || a.state === "De baja") badgeClass = "badge-danger";

            const typeLabel = a.controlType === "unique" ? "Único" : "Stock";
            const qtyText = a.controlType === "unique" ? "1 u." : `${a.quantity} u.`;
            const serialText = a.serial ? a.serial : '<span class="text-muted">—</span>';
            const locationText = AF.getFullLocationText(a.location);

            let specsSnippet = "";
            if (a.specs) {
                specsSnippet = Object.entries(a.specs)
                    .map(([k, v]) => `${k}: ${v}`)
                    .slice(0, 2)
                    .join(", ");
                if (Object.keys(a.specs).length > 2) specsSnippet += "...";
            }

            row.innerHTML = `
                <td><strong class="text-indigo">${a.code}</strong></td>
                <td><strong>${a.name}</strong><br><small class="text-secondary">${typeLabel}</small></td>
                <td><span class="badge badge-purple">${a.category}</span></td>
                <td>${a.brand}<br><small class="text-muted">${a.model}</small></td>
                <td>
                    <span class="text-muted" style="font-size: 11px;">Serie: ${serialText}</span><br>
                    <small class="text-secondary" style="font-size: 11px;">${specsSnippet || 'Sin specs'}</small>
                </td>
                <td><span class="badge ${badgeClass}">${a.state}</span></td>
                <td>${qtyText}</td>
                <td><small>${locationText}</small>${a.location ? `<br><small class="text-muted">Resp: ${a.location.responsible}</small>` : ''}</td>
                <td class="actions-column">
                    <div class="table-actions-group">
                        <button class="btn btn-outline btn-xs btn-report-asset" data-id="${a.id}" title="Ver Ficha Técnica" style="border-color: rgba(99, 102, 241, 0.4); color: #a5b4fc;">
                            <i data-lucide="file-text" style="width:12px;height:12px;"></i>
                        </button>
                        <button class="btn btn-outline btn-xs btn-edit-asset" data-id="${a.id}" title="Editar Bien">
                            <i data-lucide="edit-3" style="width:12px;height:12px;"></i>
                        </button>
                        <button class="btn btn-danger btn-xs btn-delete-asset" data-id="${a.id}" title="Eliminar/Dar de Baja">
                            <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        if (window.lucide) window.lucide.createIcons();
        AF.attachCatalogActionListeners();
    };

    AF.attachCatalogActionListeners = function() {
        // Direct technical report preview from Catalog
        document.querySelectorAll(".btn-report-asset").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const asset = AF.state.assets.find(x => x.id === id);
                if (!asset) return;

                // Navigate to reports tab & load asset sheet
                const btnNavReports = document.getElementById("btn-nav-reports");
                if (btnNavReports) {
                    btnNavReports.click();
                    AF.loadReportDocument(asset);
                }
            });
        });

        document.querySelectorAll(".btn-edit-asset").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                AF.openAssetFormModal(id);
            });
        });

        document.querySelectorAll(".btn-delete-asset").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const asset = AF.state.assets.find(x => x.id === id);
                if (!asset) return;

                if (confirm(`¿Está seguro de que desea eliminar el bien "${asset.name}" (${asset.code}) de forma permanente?`)) {
                    AF.state.assets = AF.state.assets.filter(a => a.id !== id);
                    AF.saveStore();
                    AF.renderCatalogTable();
                    AF.renderDashboardMetrics();
                    AF.showToast(`Bien ${asset.code} eliminado correctamente.`, "danger");
                }
            });
        });
    };

    AF.openAssetFormModal = function(id = null) {
        const formAsset = document.getElementById("form-asset");
        if (!formAsset) return;

        formAsset.reset();
        document.getElementById("asset-form-id").value = "";
        
        const controlUniqueRadio = document.getElementById("control-unique");
        const controlStockRadio = document.getElementById("control-stock");
        
        controlUniqueRadio.checked = true;
        AF.toggleControlTypeFields();

        if (id) {
            // Edit mode
            const asset = AF.state.assets.find(x => x.id === id);
            if (!asset) return;

            document.getElementById("modal-asset-title").textContent = "Editar Ficha Técnica";
            document.getElementById("asset-form-id").value = asset.id;
            document.getElementById("asset-category").value = asset.category;
            
            if (asset.controlType === "stock") {
                controlStockRadio.checked = true;
                AF.toggleControlTypeFields();
                document.getElementById("asset-qty").value = asset.quantity;
            } else {
                controlUniqueRadio.checked = true;
                AF.toggleControlTypeFields();
                document.getElementById("asset-serial").value = asset.serial || "";
            }

            document.getElementById("asset-code").value = asset.code;
            document.getElementById("asset-name").value = asset.name;
            document.getElementById("asset-brand").value = asset.brand;
            document.getElementById("asset-model").value = asset.model;
            document.getElementById("asset-state").value = asset.state;
            
            document.getElementById("asset-order-purchase").value = asset.purchaseOrder || "";
            document.getElementById("asset-provider").value = asset.provider || "";
            document.getElementById("asset-purchase-date").value = asset.purchaseDate || "";
            document.getElementById("asset-warranty-end").value = asset.warrantyEnd || "";

            AF.renderDynamicSpecInputs(asset.category, asset.specs);
        } else {
            // Creation mode
            document.getElementById("modal-asset-title").textContent = "Nuevo Registro de Ficha Técnica";
            const nextIdx = AF.state.assets.length + 1;
            document.getElementById("asset-code").value = `PAT-2026-${String(nextIdx).padStart(4, '0')}`;
            AF.renderDynamicSpecInputs("");
        }

        AF.openModal("modal-asset");
    };

    AF.toggleControlTypeFields = function() {
        const controlUniqueRadio = document.getElementById("control-unique");
        const groupSerial = document.getElementById("group-serial");
        const groupQty = document.getElementById("group-qty");
        const assetSerialInput = document.getElementById("asset-serial");
        const assetQtyInput = document.getElementById("asset-qty");

        if (controlUniqueRadio && controlUniqueRadio.checked) {
            if (groupSerial) groupSerial.classList.remove("hidden");
            if (assetSerialInput) assetSerialInput.setAttribute("required", "true");
            if (groupQty) groupQty.classList.add("hidden");
            if (assetQtyInput) assetQtyInput.removeAttribute("required");
            if (assetQtyInput) assetQtyInput.value = 1;
        } else {
            if (groupSerial) groupSerial.classList.add("hidden");
            if (assetSerialInput) assetSerialInput.removeAttribute("required");
            if (assetSerialInput) assetSerialInput.value = "";
            if (groupQty) groupQty.classList.remove("hidden");
            if (assetQtyInput) assetQtyInput.setAttribute("required", "true");
        }
    };

    AF.initAssets = function() {
        const formAsset = document.getElementById("form-asset");
        const controlUniqueRadio = document.getElementById("control-unique");
        const controlStockRadio = document.getElementById("control-stock");

        const catalogSearch = document.getElementById("catalog-search");
        const catalogFilterCategory = document.getElementById("catalog-filter-category");
        const catalogFilterState = document.getElementById("catalog-filter-state");
        const catalogFilterType = document.getElementById("catalog-filter-type");

        // Attach filters
        [catalogSearch, catalogFilterCategory, catalogFilterState, catalogFilterType].forEach(el => {
            if (el) el.addEventListener("input", AF.renderCatalogTable);
        });

        // Radios
        if (controlUniqueRadio) controlUniqueRadio.addEventListener("change", AF.toggleControlTypeFields);
        if (controlStockRadio) controlStockRadio.addEventListener("change", AF.toggleControlTypeFields);

        // Save Submit
        if (formAsset) {
            formAsset.addEventListener("submit", (e) => {
                e.preventDefault();

                const id = document.getElementById("asset-form-id").value;
                const code = document.getElementById("asset-code").value.trim();
                const category = document.getElementById("asset-category").value;
                const name = document.getElementById("asset-name").value.trim();
                const brand = document.getElementById("asset-brand").value.trim();
                const model = document.getElementById("asset-model").value.trim();
                const stateVal = document.getElementById("asset-state").value;
                const purchaseOrder = document.getElementById("asset-order-purchase").value.trim();
                const provider = document.getElementById("asset-provider").value.trim();
                const purchaseDate = document.getElementById("asset-purchase-date").value;
                const warrantyEnd = document.getElementById("asset-warranty-end").value;
                
                const controlType = controlUniqueRadio.checked ? "unique" : "stock";
                const serial = controlType === "unique" ? document.getElementById("asset-serial").value.trim() : "";
                const quantity = controlType === "stock" ? parseInt(document.getElementById("asset-qty").value) || 1 : 1;

                // Code uniqueness validation
                const codeExists = AF.state.assets.some(a => a.code === code && a.id !== id);
                if (codeExists) {
                    AF.showToast(`El número de ficha técnica ${code} ya está registrado en el sistema.`, "danger");
                    return;
                }

                // Gather spec parameters
                const specs = {};
                const specsContainer = document.getElementById("dynamic-specs-container");
                if (specsContainer) {
                    specsContainer.querySelectorAll(".spec-item-row").forEach(row => {
                        const key = row.querySelector(".spec-key").value.trim();
                        const val = row.querySelector(".spec-value").value.trim();
                        if (key && val) {
                            specs[key] = val;
                        }
                    });
                }

                if (id) {
                    // Update
                    const idx = AF.state.assets.findIndex(x => x.id === id);
                    if (idx !== -1) {
                        AF.state.assets[idx] = {
                            ...AF.state.assets[idx],
                            code, category, name, brand, model, state: stateVal,
                            purchaseOrder, provider, purchaseDate, warrantyEnd,
                            controlType, serial, quantity, specs
                        };
                        AF.showToast(`Bien ${code} actualizado con éxito.`, "success");
                    }
                } else {
                    // Insert
                    const newAsset = {
                        id: `a-${Date.now()}`,
                        code, category, name, brand, model, state: stateVal,
                        purchaseOrder, provider, purchaseDate, warrantyEnd,
                        controlType, serial, quantity, specs,
                        location: null
                    };
                    AF.state.assets.push(newAsset);
                    AF.showToast(`Bien ${code} registrado con éxito.`, "success");
                }

                AF.saveStore();
                AF.closeModal("modal-asset");
                AF.renderCatalogTable();
            });
        }

        // Open creation modal
        document.querySelectorAll("[data-action='open-modal-asset']").forEach(btn => {
            btn.addEventListener("click", () => {
                AF.openAssetFormModal();
            });
        });
    };

})(window.ActivoFlow);
