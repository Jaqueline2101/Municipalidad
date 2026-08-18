/* ==========================================================================
   ActivoFlow - Locations & Assignment Module
   ========================================================================== */

(function(AF) {

    AF.renderLocationTree = function() {
        const treeContainer = document.getElementById("organizational-tree");
        if (!treeContainer) return;

        treeContainer.innerHTML = "";

        if (AF.state.locations.sedes.length === 0) {
            treeContainer.innerHTML = `<span class="text-muted">Ninguna sede registrada.</span>`;
            return;
        }

        AF.state.locations.sedes.forEach(sede => {
            const nodeSede = document.createElement("div");
            nodeSede.className = "tree-node-sede";
            
            const pisosInSede = AF.state.locations.pisos.filter(p => p.sedeId === sede.id);
            const childrenHtml = [];

            pisosInSede.forEach(piso => {
                const oficinasInPiso = AF.state.locations.oficinas.filter(o => o.pisoId === piso.id);
                const ofisHtml = [];

                oficinasInPiso.forEach(ofi => {
                    const assetsInOfi = AF.state.assets.filter(a => a.location && a.location.oficinaId === ofi.id);
                    const assetCount = assetsInOfi.length;
                    const countBadge = assetCount > 0 ? `<span class="badge badge-purple" style="font-size: 9px; padding:2px 5px; margin-left: 6px;">${assetCount} bienes</span>` : '';

                    let assetsHtml = '';
                    if (assetCount > 0) {
                        assetsHtml = assetsInOfi.map(a => `
                            <div class="tree-node-asset" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; margin-left: 10px; font-size: 11px; color: var(--text-secondary); background-color: rgba(0, 0, 0, 0.02); border-radius: var(--radius-sm); margin-top: 4px;">
                                <span>
                                    <i data-lucide="package" style="width:10px;height:10px;margin-right:6px;vertical-align:middle;color: var(--text-muted);"></i>
                                    <strong>${a.code}</strong> - ${a.name}
                                </span>
                                <button type="button" class="tree-node-action btn-unassign-asset-inline" data-asset-id="${a.id}" title="Desasignar Bien (devolver a almacén)">
                                    <i data-lucide="log-out" style="width:9px;height:9px;color: var(--danger);"></i>
                                </button>
                            </div>
                        `).join('');
                    } else {
                        assetsHtml = `<span class="text-muted" style="font-size: 10.5px; padding-left: 20px; display: block; margin-top: 4px;">Sin bienes asignados</span>`;
                    }

                    ofisHtml.push(`
                        <div class="tree-node-oficina-wrapper" style="width: 100%; display: flex; flex-direction: column;">
                            <div class="tree-node-oficina">
                                <span class="text-primary tree-oficina-click" data-id="${ofi.id}" title="Haz clic para ver bienes asignados" style="cursor: pointer;">
                                    <i data-lucide="folder" style="width:12px;height:12px;display:inline;margin-right:6px;vertical-align:middle;"></i>
                                    ${ofi.name}${countBadge}
                                </span>
                                <div class="tree-header-actions">
                                    <button type="button" class="tree-node-action btn-assign-asset-inline" data-oficina-id="${ofi.id}" data-piso-id="${piso.id}" data-sede-id="${sede.id}" title="Asignar Bien a esta Oficina/Ambiente">
                                        <i data-lucide="link" style="width:10px;height:10px;"></i>
                                    </button>
                                    <button type="button" class="tree-node-action btn-edit-oficina-inline" data-id="${ofi.id}" data-name="${ofi.name}" title="Editar Oficina / Ambiente">
                                        <i data-lucide="pencil" style="width:10px;height:10px;"></i>
                                    </button>
                                    <button type="button" class="tree-node-action btn-delete-oficina" data-id="${ofi.id}" title="Eliminar Oficina/Ambiente">
                                        <i data-lucide="x" style="width:10px;height:10px;"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="tree-oficina-assets hidden" id="assets-list-${ofi.id}" style="padding-left: 10px; margin-bottom: 8px; border-left: 1px dashed var(--border-color); display: flex; flex-direction: column; gap: 2px;">
                                ${assetsHtml}
                            </div>
                        </div>
                    `);
                });

                childrenHtml.push(`
                    <div class="tree-node-piso">
                        <div class="tree-header">
                            <span class="tree-title-group tree-piso-click" data-id="${piso.id}" style="cursor:pointer;"><i data-lucide="layers"></i>${piso.name}</span>
                            <div class="tree-header-actions">
                                <button type="button" class="tree-node-action btn-add-oficina-inline" data-piso-id="${piso.id}" title="Añadir Oficina / Ambiente">
                                    <i data-lucide="plus" style="width:10px;height:10px;"></i>
                                </button>
                                <button type="button" class="tree-node-action btn-edit-piso-inline" data-id="${piso.id}" data-name="${piso.name}" title="Editar Piso">
                                    <i data-lucide="pencil" style="width:10px;height:10px;"></i>
                                </button>
                                <button type="button" class="tree-node-action btn-delete-piso" data-id="${piso.id}" title="Eliminar Piso">
                                    <i data-lucide="x" style="width:10px;height:10px;"></i>
                                </button>
                            </div>
                        </div>
                        <div class="tree-children">
                            ${ofisHtml.join("") || '<span class="text-muted" style="padding-left:14px;font-size:11px;">Sin oficinas / ambientes</span>'}
                        </div>
                    </div>
                `);
            });

            nodeSede.innerHTML = `
                <div class="tree-header">
                    <span class="tree-title-group tree-sede-click" data-id="${sede.id}" style="cursor:pointer;"><i data-lucide="landmark"></i>${sede.name}</span>
                    <div class="tree-header-actions">
                        <button type="button" class="tree-node-action btn-add-piso-inline" data-sede-id="${sede.id}" title="Añadir Piso">
                            <i data-lucide="plus" style="width:10px;height:10px;"></i>
                        </button>
                        <button type="button" class="tree-node-action btn-edit-sede-inline" data-id="${sede.id}" data-name="${sede.name}" title="Editar Sede">
                            <i data-lucide="pencil" style="width:10px;height:10px;"></i>
                        </button>
                        <button type="button" class="tree-node-action btn-delete-sede" data-id="${sede.id}" title="Eliminar Sede">
                            <i data-lucide="x" style="width:12px;height:12px;"></i>
                        </button>
                    </div>
                </div>
                <div class="tree-children">
                    ${childrenHtml.join("") || '<span class="text-muted" style="padding-left:14px;font-size:11px;">Sin pisos</span>'}
                </div>
            `;
            treeContainer.appendChild(nodeSede);
        });

        if (window.lucide) window.lucide.createIcons();
        AF.attachTreeActionListeners();
    };

    AF.attachTreeActionListeners = function() {
        // Click Sede Node
        document.querySelectorAll(".tree-sede-click").forEach(el => {
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = el.getAttribute("data-id");
                AF.selectLocationNode("sede", id);
            });
        });

        // Click Piso Node
        document.querySelectorAll(".tree-piso-click").forEach(el => {
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = el.getAttribute("data-id");
                AF.selectLocationNode("piso", id);
            });
        });

        // Delete Sede
        document.querySelectorAll(".btn-delete-sede").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                if (confirm("Al eliminar la Sede se perderán los pisos y oficinas dependientes. ¿Confirmar?")) {
                    AF.state.locations.sedes = AF.state.locations.sedes.filter(x => x.id !== id);
                    const deletedPisos = AF.state.locations.pisos.filter(p => p.sedeId === id).map(p => p.id);
                    AF.state.locations.pisos = AF.state.locations.pisos.filter(p => p.sedeId !== id);
                    AF.state.locations.oficinas = AF.state.locations.oficinas.filter(o => !deletedPisos.includes(o.pisoId));
                    AF.saveStore();
                    AF.renderLocationTree();
                    AF.populateAssignmentSelects();
                }
            });
        });

        // Delete Piso
        document.querySelectorAll(".btn-delete-piso").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                if (confirm("Al eliminar este piso se perderán las oficinas asociadas. ¿Confirmar?")) {
                    AF.state.locations.pisos = AF.state.locations.pisos.filter(x => x.id !== id);
                    AF.state.locations.oficinas = AF.state.locations.oficinas.filter(o => o.pisoId !== id);
                    AF.saveStore();
                    AF.renderLocationTree();
                    AF.populateAssignmentSelects();
                }
            });
        });

        // Delete Oficina
        document.querySelectorAll(".btn-delete-oficina").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                if (confirm("¿Desea eliminar esta oficina?")) {
                    AF.state.locations.oficinas = AF.state.locations.oficinas.filter(x => x.id !== id);
                    // Reassign assets
                    AF.state.assets.forEach(a => {
                        if (a.location && a.location.oficinaId === id) {
                            a.location = null;
                        }
                    });
                    AF.saveStore();
                    AF.renderLocationTree();
                    AF.populateAssignmentSelects();
                }
            });
        });

        // Add Piso Inline
        document.querySelectorAll(".btn-add-piso-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const sedeId = btn.getAttribute("data-sede-id");
                
                const locLevelSelect = document.getElementById("location-level");
                locLevelSelect.value = "piso";
                locLevelSelect.dispatchEvent(new Event("change"));
                
                const parentSedeSelect = document.getElementById("parent-sede-id");
                parentSedeSelect.value = sedeId;
                
                AF.openModal("modal-sede");
            });
        });

        // Add Oficina Inline
        document.querySelectorAll(".btn-add-oficina-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const pisoId = btn.getAttribute("data-piso-id");
                
                const locLevelSelect = document.getElementById("location-level");
                locLevelSelect.value = "oficina";
                locLevelSelect.dispatchEvent(new Event("change"));
                
                const parentPisoSelect = document.getElementById("parent-piso-id");
                parentPisoSelect.value = pisoId;
                
                AF.openModal("modal-sede");
            });
        });

        // Edit Sede Inline
        document.querySelectorAll(".btn-edit-sede-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                const currentName = btn.getAttribute("data-name");
                const newName = prompt("Editar nombre de la Sede:", currentName);
                if (newName && newName.trim() && newName.trim() !== currentName) {
                    const idx = AF.state.locations.sedes.findIndex(s => s.id === id);
                    if (idx !== -1) {
                        AF.state.locations.sedes[idx].name = newName.trim();
                        AF.saveStore();
                        AF.renderLocationTree();
                        AF.populateAssignmentSelects();
                        AF.showToast("Sede renombrada con éxito.", "success");
                    }
                }
            });
        });

        // Edit Piso Inline
        document.querySelectorAll(".btn-edit-piso-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                const currentName = btn.getAttribute("data-name");
                const newName = prompt("Editar nombre del Piso/Nivel:", currentName);
                if (newName && newName.trim() && newName.trim() !== currentName) {
                    const idx = AF.state.locations.pisos.findIndex(p => p.id === id);
                    if (idx !== -1) {
                        AF.state.locations.pisos[idx].name = newName.trim();
                        AF.saveStore();
                        AF.renderLocationTree();
                        AF.populateAssignmentSelects();
                        AF.showToast("Piso renombrado con éxito.", "success");
                    }
                }
            });
        });

        // Edit Oficina Inline
        document.querySelectorAll(".btn-edit-oficina-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                const currentName = btn.getAttribute("data-name");
                const newName = prompt("Editar nombre de la Oficina/Ambiente:", currentName);
                if (newName && newName.trim() && newName.trim() !== currentName) {
                    const idx = AF.state.locations.oficinas.findIndex(o => o.id === id);
                    if (idx !== -1) {
                        AF.state.locations.oficinas[idx].name = newName.trim();
                        AF.saveStore();
                        AF.renderLocationTree();
                        AF.populateAssignmentSelects();
                        AF.showToast("Oficina/Ambiente renombrado con éxito.", "success");
                    }
                }
            });
        });

        // Toggle assets list inline & show details
        document.querySelectorAll(".tree-oficina-click").forEach(el => {
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                const oficinaId = el.getAttribute("data-id");
                const list = document.getElementById(`assets-list-${oficinaId}`);
                if (list) {
                    list.classList.toggle("hidden");
                }
                AF.selectLocationNode("oficina", oficinaId);
            });
        });

        // Assign Asset Inline Button
        document.querySelectorAll(".btn-assign-asset-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const SedeId = btn.getAttribute("data-sede-id");
                const PisoId = btn.getAttribute("data-piso-id");
                const OficinaId = btn.getAttribute("data-oficina-id");

                const formAssignment = document.getElementById("form-asset-assignment");
                if (formAssignment) formAssignment.reset();
                document.getElementById("assign-asset-preview").classList.add("hidden");
                document.getElementById("assign-quantity-container").classList.add("hidden");

                const assignSede = document.getElementById("assign-sede");
                const assignPiso = document.getElementById("assign-piso");
                const assignOficina = document.getElementById("assign-oficina");

                if (assignSede) {
                    assignSede.value = SedeId;
                    assignSede.dispatchEvent(new Event("change"));
                    
                    setTimeout(() => {
                        if (assignPiso) {
                            assignPiso.value = PisoId;
                            assignPiso.dispatchEvent(new Event("change"));
                            
                            setTimeout(() => {
                                if (assignOficina) {
                                    assignOficina.value = OficinaId;
                                }
                            }, 50);
                        }
                    }, 50);
                }

                AF.openModal("modal-assign-asset");

                const searchInput = document.getElementById("assign-asset-search");
                if (searchInput) {
                    setTimeout(() => {
                        searchInput.focus();
                    }, 100);
                }
            });
        });

        // Unassign Asset Inline Button
        document.querySelectorAll(".btn-unassign-asset-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const assetId = btn.getAttribute("data-asset-id");
                const asset = AF.state.assets.find(a => a.id === assetId);
                if (asset && confirm(`¿Estás seguro de desasignar el bien "${asset.name}" de esta oficina y devolverlo al Almacén Central?`)) {
                    const originText = AF.getFullLocationText(asset.location);
                    
                    asset.location = null;
                    
                    AF.state.movements.push({
                        timestamp: new Date().toLocaleString(),
                        assetCode: asset.code,
                        assetName: asset.name,
                        origin: originText,
                        destination: "Almacén Central",
                        responsible: "Ninguno",
                        operator: document.getElementById("display-user-name")?.textContent || "Administrador"
                    });

                    AF.saveStore();
                    AF.renderLocationTree();
                    AF.populateAssignmentSelects();
                    AF.showToast(`El bien "${asset.name}" ha sido desasignado y devuelto a Almacén Central.`, "success");
                }
            });
        });
    };

    AF.populateAssignmentSelects = function() {
        const assignSede = document.getElementById("assign-sede");
        const assignPiso = document.getElementById("assign-piso");
        const assignOficina = document.getElementById("assign-oficina");
        if (!assignSede) return;

        assignSede.innerHTML = '<option value="" disabled selected>Sede...</option>';
        AF.state.locations.sedes.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.name;
            assignSede.appendChild(opt);
        });
        
        assignPiso.innerHTML = '<option value="" disabled selected>Piso...</option>';
        assignOficina.innerHTML = '<option value="" disabled selected>Oficina / Ambiente...</option>';
        assignPiso.setAttribute("disabled", "true");
        assignOficina.setAttribute("disabled", "true");
    };

    AF.selectAssetForAssignment = function(asset) {
        const assignAssetId = document.getElementById("assign-asset-id");
        const assignAssetSearch = document.getElementById("assign-asset-search");
        const assignAssetDropdown = document.getElementById("assign-asset-dropdown");
        const assignAssetPreview = document.getElementById("assign-asset-preview");
        const assignQuantityContainer = document.getElementById("assign-quantity-container");
        const assignQuantity = document.getElementById("assign-quantity");
        const assignQuantityMaxHelp = document.getElementById("assign-quantity-max-help");

        if (!assignAssetId) return;

        assignAssetId.value = asset.id;
        assignAssetSearch.value = `${asset.code} - ${asset.name}`;
        if (assignAssetDropdown) {
            assignAssetDropdown.innerHTML = "";
            assignAssetDropdown.classList.remove("active");
        }

        // Quick Preview
        document.getElementById("preview-code").textContent = asset.code;
        document.getElementById("preview-model").textContent = `${asset.brand} / ${asset.model}`;
        document.getElementById("preview-category").textContent = asset.category;
        document.getElementById("preview-current-loc").textContent = AF.getFullLocationText(asset.location);
        
        assignAssetPreview.classList.remove("hidden");

        // Control stock fields
        if (asset.controlType === "stock") {
            assignQuantityContainer.classList.remove("hidden");
            assignQuantity.setAttribute("max", asset.quantity);
            assignQuantity.value = 1;
            assignQuantityMaxHelp.textContent = `Cantidad máxima disponible: ${asset.quantity}`;
        } else {
            assignQuantityContainer.classList.add("hidden");
            assignQuantity.value = 1;
        }
    };

    AF.resetAssignmentForm = function() {
        const formAssignment = document.getElementById("form-asset-assignment");
        if (formAssignment) formAssignment.reset();
        
        const assignAssetId = document.getElementById("assign-asset-id");
        const assignAssetPreview = document.getElementById("assign-asset-preview");
        const assignQuantityContainer = document.getElementById("assign-quantity-container");

        if (assignAssetId) assignAssetId.value = "";
        if (assignAssetPreview) assignAssetPreview.classList.add("hidden");
        if (assignQuantityContainer) assignQuantityContainer.classList.add("hidden");
        
        AF.populateAssignmentSelects();
    };

    AF.initLocations = function() {
        const formSede = document.getElementById("form-sede");
        const locLevelSelect = document.getElementById("location-level");
        const groupParentSede = document.getElementById("group-select-parent-sede");
        const groupParentPiso = document.getElementById("group-select-parent-piso");
        const parentSedeIdSelect = document.getElementById("parent-sede-id");
        const parentPisoIdSelect = document.getElementById("parent-piso-id");

        const assignSede = document.getElementById("assign-sede");
        const assignPiso = document.getElementById("assign-piso");
        const assignOficina = document.getElementById("assign-oficina");

        const assignAssetSearch = document.getElementById("assign-asset-search");
        const assignAssetId = document.getElementById("assign-asset-id");
        const assignAssetDropdown = document.getElementById("assign-asset-dropdown");
        const formAssignment = document.getElementById("form-asset-assignment");

        // 1. Structure modal dependent triggers
        if (locLevelSelect) {
            locLevelSelect.addEventListener("change", (e) => {
                const val = e.target.value;
                groupParentSede.classList.add("hidden");
                groupParentPiso.classList.add("hidden");
                parentSedeIdSelect.removeAttribute("required");
                parentPisoIdSelect.removeAttribute("required");

                if (val === "piso") {
                    groupParentSede.classList.remove("hidden");
                    parentSedeIdSelect.setAttribute("required", "true");
                    
                    // Populate sedes
                    parentSedeIdSelect.innerHTML = '<option value="" disabled selected>Seleccione Sede...</option>';
                    AF.state.locations.sedes.forEach(s => {
                        const opt = document.createElement("option");
                        opt.value = s.id;
                        opt.textContent = s.name;
                        parentSedeIdSelect.appendChild(opt);
                    });
                } else if (val === "oficina") {
                    groupParentPiso.classList.remove("hidden");
                    parentPisoIdSelect.setAttribute("required", "true");
                    
                    // Populate pisos
                    parentPisoIdSelect.innerHTML = '<option value="" disabled selected>Seleccione Piso...</option>';
                    AF.state.locations.pisos.forEach(p => {
                        const sede = AF.state.locations.sedes.find(s => s.id === p.sedeId);
                        const opt = document.createElement("option");
                        opt.value = p.id;
                        opt.textContent = `${p.name} - (${sede ? sede.name : 'Sede?'})`;
                        parentPisoIdSelect.appendChild(opt);
                    });
                }
            });
        }

        // Save structure node
        if (formSede) {
            formSede.addEventListener("submit", (e) => {
                e.preventDefault();
                const level = locLevelSelect.value;
                const name = document.getElementById("location-name").value.trim();
                const id = `loc-${Date.now()}`;

                if (level === "sede") {
                    AF.state.locations.sedes.push({ id, name });
                    AF.showToast(`Sede "${name}" creada.`, "success");
                } else if (level === "piso") {
                    const sedeId = parentSedeIdSelect.value;
                    AF.state.locations.pisos.push({ id, name, sedeId });
                    AF.showToast(`Piso "${name}" registrado en la Sede.`, "success");
                } else if (level === "oficina") {
                    const pisoId = parentPisoIdSelect.value;
                    AF.state.locations.oficinas.push({ id, name, pisoId });
                    AF.showToast(`Oficina "${name}" registrada con éxito.`, "success");
                }

                AF.saveStore();
                AF.closeModal("modal-sede");
                AF.renderLocationTree();
                AF.populateAssignmentSelects();
            });
        }

        // Open structure modal
        document.querySelectorAll("[data-action='open-modal-sede']").forEach(btn => {
            btn.addEventListener("click", () => {
                formSede.reset();
                locLevelSelect.dispatchEvent(new Event("change"));
                AF.openModal("modal-sede");
            });
        });

        // Open assign asset modal
        document.addEventListener("click", (e) => {
            try {
                const btn = e.target.closest("[data-action='open-modal-assign-asset']");
                if (!btn) return;

                const formAssignment = document.getElementById("form-asset-assignment");
                if (formAssignment) formAssignment.reset();
                
                const assignAssetSearch = document.getElementById("assign-asset-search");
                const assignAssetId = document.getElementById("assign-asset-id");
                const assignAssetDropdown = document.getElementById("assign-asset-dropdown");
                if (assignAssetSearch) assignAssetSearch.value = "";
                if (assignAssetId) assignAssetId.value = "";
                if (assignAssetDropdown) {
                    assignAssetDropdown.innerHTML = "";
                    assignAssetDropdown.classList.remove("active");
                }
                const previewEl = document.getElementById("assign-asset-preview");
                if (previewEl) previewEl.classList.add("hidden");
                const qtyContainer = document.getElementById("assign-quantity-container");
                if (qtyContainer) qtyContainer.classList.add("hidden");

                if (AF.selectedLocationNode) {
                    const { type, id } = AF.selectedLocationNode;
                    const assignSede = document.getElementById("assign-sede");
                    const assignPiso = document.getElementById("assign-piso");
                    const assignOficina = document.getElementById("assign-oficina");

                    if (type === "sede") {
                        if (assignSede) {
                            assignSede.value = id;
                            assignSede.dispatchEvent(new Event("change"));
                        }
                    } else if (type === "piso") {
                        const pisoObj = AF.state.locations.pisos.find(p => p.id === id);
                        if (pisoObj && assignSede) {
                            assignSede.value = pisoObj.sedeId;
                            assignSede.dispatchEvent(new Event("change"));
                            setTimeout(() => {
                                if (assignPiso) {
                                    assignPiso.value = id;
                                    assignPiso.dispatchEvent(new Event("change"));
                                }
                            }, 50);
                        }
                    } else if (type === "oficina") {
                        const ofiObj = AF.state.locations.oficinas.find(o => o.id === id);
                        if (ofiObj) {
                            const pisoObj = AF.state.locations.pisos.find(p => p.id === ofiObj.pisoId);
                            if (pisoObj && assignSede) {
                                assignSede.value = pisoObj.sedeId;
                                assignSede.dispatchEvent(new Event("change"));
                                setTimeout(() => {
                                    if (assignPiso) {
                                        assignPiso.value = pisoObj.id;
                                        assignPiso.dispatchEvent(new Event("change"));
                                        setTimeout(() => {
                                            if (assignOficina) {
                                                assignOficina.value = id;
                                            }
                                        }, 50);
                                    }
                                }, 50);
                            }
                        }
                    }
                }
                
                AF.openModal("modal-assign-asset");
            } catch (error) {
                alert("Error al abrir modal de asignación: " + error.message);
                console.error(error);
            }
        });

        // 2. Assignment selects dependency
        if (assignSede) {
            assignSede.addEventListener("change", () => {
                const sedeId = assignSede.value;
                assignPiso.innerHTML = '<option value="" disabled selected>Piso...</option>';
                assignOficina.innerHTML = '<option value="" disabled selected>Oficina / Ambiente...</option>';
                assignOficina.setAttribute("disabled", "true");

                const filteredPisos = AF.state.locations.pisos.filter(p => p.sedeId === sedeId);
                if (filteredPisos.length > 0) {
                    assignPiso.removeAttribute("disabled");
                    filteredPisos.forEach(p => {
                        const opt = document.createElement("option");
                        opt.value = p.id;
                        opt.textContent = p.name;
                        assignPiso.appendChild(opt);
                    });
                } else {
                    assignPiso.setAttribute("disabled", "true");
                }
            });
        }

        if (assignPiso) {
            assignPiso.addEventListener("change", () => {
                const pisoId = assignPiso.value;
                assignOficina.innerHTML = '<option value="" disabled selected>Oficina / Ambiente...</option>';

                const filteredOficinas = AF.state.locations.oficinas.filter(o => o.pisoId === pisoId);
                if (filteredOficinas.length > 0) {
                    assignOficina.removeAttribute("disabled");
                    filteredOficinas.forEach(o => {
                        const opt = document.createElement("option");
                        opt.value = o.id;
                        opt.textContent = o.name;
                        assignOficina.appendChild(opt);
                    });
                } else {
                    assignOficina.setAttribute("disabled", "true");
                }
            });
        }

        // 3. Autocomplete search in assignment
        if (assignAssetSearch) {
            const showAssetSuggestions = (val = "") => {
                assignAssetDropdown.innerHTML = "";
                assignAssetDropdown.classList.remove("active");

                const matches = AF.state.assets.filter(a => {
                    if (!val) return true;
                    return a.code.toLowerCase().includes(val) || 
                           a.name.toLowerCase().includes(val) || 
                           (a.serial && a.serial.toLowerCase().includes(val));
                });

                if (matches.length === 0) {
                    const emptyDiv = document.createElement("div");
                    emptyDiv.className = "autocomplete-item text-muted";
                    emptyDiv.textContent = "No se encontraron bienes disponibles.";
                    assignAssetDropdown.appendChild(emptyDiv);
                    assignAssetDropdown.classList.add("active");
                    return;
                }

                matches.forEach(m => {
                    const item = document.createElement("div");
                    item.className = "autocomplete-item";
                    
                    const locText = AF.getFullLocationText(m.location);
                    const typeText = m.controlType === "unique" ? "Serie única" : `Stock: ${m.quantity} u. disponibles`;

                    item.innerHTML = `
                        <span class="item-code">${m.code}</span>
                        <div class="item-desc">${m.name}</div>
                        <div class="item-sub">${typeText} | Ubicación: ${locText}</div>
                    `;
                    
                    item.addEventListener("click", () => {
                        AF.selectAssetForAssignment(m);
                    });
                    assignAssetDropdown.appendChild(item);
                });
                assignAssetDropdown.classList.add("active");
            };

            assignAssetSearch.addEventListener("input", (e) => {
                const val = e.target.value.toLowerCase().trim();
                assignAssetId.value = "";
                document.getElementById("assign-asset-preview").classList.add("hidden");
                document.getElementById("assign-quantity-container").classList.add("hidden");

                showAssetSuggestions(val);
            });

            assignAssetSearch.addEventListener("focus", () => {
                const val = assignAssetSearch.value.toLowerCase().trim();
                showAssetSuggestions(val);
            });

            assignAssetSearch.addEventListener("click", (e) => {
                e.stopPropagation();
                const val = assignAssetSearch.value.toLowerCase().trim();
                showAssetSuggestions(val);
            });

            document.addEventListener("click", (e) => {
                if (!e.target.closest(".autocomplete-wrapper")) {
                    assignAssetDropdown.classList.remove("active");
                }
            });
        }

        // Submit Assignment Form
        if (formAssignment) {
            formAssignment.addEventListener("submit", (e) => {
                e.preventDefault();

                const assetId = assignAssetId.value;
                const targetSede = assignSede.value;
                const targetPiso = assignPiso.value;
                const targetOficina = assignOficina.value;
                const responsible = document.getElementById("assign-responsible").value.trim();
                const qtyToMove = parseInt(document.getElementById("assign-quantity").value) || 1;

                if (!assetId) {
                    AF.showToast("Por favor, seleccione un bien de la lista predictiva.", "warning");
                    return;
                }

                const asset = AF.state.assets.find(x => x.id === assetId);
                if (!asset) return;

                const originText = AF.getFullLocationText(asset.location);
                const destinationText = `${AF.getOficinaName(targetOficina)} (${AF.getSedeName(targetSede)} - ${AF.getPisoName(targetPiso)})`;
                const timestamp = new Date().toISOString();

                if (asset.controlType === "unique") {
                    asset.location = {
                        sedeId: targetSede,
                        pisoId: targetPiso,
                        oficinaId: targetOficina,
                        responsible
                    };
                    
                    AF.state.movements.push({
                        timestamp,
                        assetCode: asset.code,
                        assetName: asset.name,
                        origin: originText,
                        destination: destinationText,
                        responsible,
                        operator: "Juan Delgado (ADMIN)"
                    });
                    AF.showToast(`Bien ${asset.code} asignado correctamente a ${destinationText}.`, "success");
                } else {
                    if (qtyToMove > asset.quantity) {
                        AF.showToast(`No puede asignar más del stock disponible (${asset.quantity}).`, "danger");
                        return;
                    }

                    if (qtyToMove === asset.quantity && !asset.location) {
                        asset.location = {
                            sedeId: targetSede,
                            pisoId: targetPiso,
                            oficinaId: targetOficina,
                            responsible
                        };
                        
                        AF.state.movements.push({
                            timestamp,
                            assetCode: asset.code,
                            assetName: `${asset.name} (${qtyToMove} u.)`,
                            origin: originText,
                            destination: destinationText,
                            responsible,
                            operator: "Juan Delgado (ADMIN)"
                        });
                    } else {
                        asset.quantity -= qtyToMove;
                        
                        const subAsset = {
                            id: `a-sub-${Date.now()}`,
                            code: asset.code,
                            name: asset.name,
                            category: asset.category,
                            brand: asset.brand,
                            model: asset.model,
                            serial: "",
                            controlType: "stock",
                            quantity: qtyToMove,
                            state: asset.state,
                            purchaseOrder: asset.purchaseOrder,
                            provider: asset.provider,
                            purchaseDate: asset.purchaseDate,
                            warrantyEnd: asset.warrantyEnd,
                            location: {
                                sedeId: targetSede,
                                pisoId: targetPiso,
                                oficinaId: targetOficina,
                                responsible
                            },
                            specs: { ...asset.specs }
                        };
                        
                        if (asset.quantity <= 0) {
                            AF.state.assets = AF.state.assets.filter(x => x.id !== asset.id);
                        }

                        AF.state.assets.push(subAsset);

                        AF.state.movements.push({
                            timestamp,
                            assetCode: asset.code,
                            assetName: `${asset.name} (${qtyToMove} u.)`,
                            origin: originText,
                            destination: destinationText,
                            responsible,
                            operator: "Juan Delgado (ADMIN)"
                        });
                    }
                    AF.showToast(`Se asignaron ${qtyToMove} unidades de ${asset.name} con éxito.`, "success");
                }

                AF.saveStore();
                AF.closeModal("modal-assign-asset");
                AF.resetAssignmentForm();
                AF.renderLocationTree();
                if (AF.selectedLocationNode) {
                    AF.selectLocationNode(AF.selectedLocationNode.type, AF.selectedLocationNode.id);
                }
            });
        }
    };

    AF.selectedLocationNode = null;

    AF.selectLocationNode = function(type, id) {
        this.selectedLocationNode = { type, id };
        
        // Highlight selected node in tree
        document.querySelectorAll(".tree-title-group, .tree-oficina-click").forEach(el => {
            el.classList.remove("selected-tree-node");
        });
        const clickedEl = document.querySelector(`.tree-${type}-click[data-id="${id}"]`);
        if (clickedEl) {
            clickedEl.classList.add("selected-tree-node");
        }

        // Show "Asignar Bien" button in the header
        const btnOpenAssign = document.getElementById("btn-open-assign-modal");
        if (btnOpenAssign) {
            btnOpenAssign.classList.remove("hidden");
        }

        const titleEl = document.getElementById("detail-title");
        const subtitleEl = document.getElementById("detail-subtitle");
        const bodyContainer = document.getElementById("detail-body-container");

        if (!bodyContainer) return;

        let titleText = "";
        let subtitleText = "";
        let htmlContent = "";

        if (type === "sede") {
            const sede = this.state.locations.sedes.find(s => s.id === id);
            if (!sede) return;

            const floors = this.state.locations.pisos.filter(p => p.sedeId === id);
            const floorIds = floors.map(p => p.id);
            const offices = this.state.locations.oficinas.filter(o => floorIds.includes(o.pisoId));
            const officeIds = offices.map(o => o.id);
            const assets = this.state.assets.filter(a => a.location && officeIds.includes(a.location.oficinaId));

            titleText = sede.name;
            subtitleText = "Sede Principal";

            htmlContent = `
                <div class="stats-grid mb-20" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                    <div class="stat-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-app); text-align: center;">
                        <span class="stat-value" style="font-size: 20px; font-weight: 700; color: var(--accent);">${floors.length}</span>
                        <span class="stat-label" style="display: block; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Pisos / Niveles</span>
                    </div>
                    <div class="stat-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-app); text-align: center;">
                        <span class="stat-value" style="font-size: 20px; font-weight: 700; color: var(--accent);">${offices.length}</span>
                        <span class="stat-label" style="display: block; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Oficinas / Ambientes</span>
                    </div>
                    <div class="stat-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-app); text-align: center;">
                        <span class="stat-value" style="font-size: 20px; font-weight: 700; color: var(--accent);">${assets.length}</span>
                        <span class="stat-label" style="display: block; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Bienes Asignados</span>
                    </div>
                </div>
                ${this.renderAssetsTableHelper(assets)}
            `;

        } else if (type === "piso") {
            const piso = this.state.locations.pisos.find(p => p.id === id);
            if (!piso) return;
            const sede = this.state.locations.sedes.find(s => s.id === piso.sedeId);
            const offices = this.state.locations.oficinas.filter(o => o.pisoId === id);
            const officeIds = offices.map(o => o.id);
            const assets = this.state.assets.filter(a => a.location && officeIds.includes(a.location.oficinaId));

            titleText = piso.name;
            subtitleText = `Piso de la Sede: ${sede ? sede.name : 'Desconocida'}`;

            htmlContent = `
                <div class="stats-grid mb-20" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div class="stat-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-app); text-align: center;">
                        <span class="stat-value" style="font-size: 20px; font-weight: 700; color: var(--accent);">${offices.length}</span>
                        <span class="stat-label" style="display: block; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Oficinas / Ambientes</span>
                    </div>
                    <div class="stat-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-app); text-align: center;">
                        <span class="stat-value" style="font-size: 20px; font-weight: 700; color: var(--accent);">${assets.length}</span>
                        <span class="stat-label" style="display: block; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Bienes Asignados</span>
                    </div>
                </div>
                ${this.renderAssetsTableHelper(assets)}
            `;

        } else if (type === "oficina") {
            const ofi = this.state.locations.oficinas.find(o => o.id === id);
            if (!ofi) return;
            const piso = this.state.locations.pisos.find(p => p.id === ofi.pisoId);
            const sede = piso ? this.state.locations.sedes.find(s => s.id === piso.sedeId) : null;
            const assets = this.state.assets.filter(a => a.location && a.location.oficinaId === id);

            titleText = ofi.name;
            subtitleText = `Oficina / Ambiente en: ${sede ? sede.name : ''} - ${piso ? piso.name : ''}`;

            htmlContent = `
                <div class="stats-grid mb-20" style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                    <div class="stat-card" style="padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-app); text-align: center;">
                        <span class="stat-value" style="font-size: 20px; font-weight: 700; color: var(--accent);">${assets.length}</span>
                        <span class="stat-label" style="display: block; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">Bienes Asignados en esta Oficina/Ambiente</span>
                    </div>
                </div>
                ${this.renderAssetsTableHelper(assets)}
            `;
        }

        if (titleEl) titleEl.textContent = titleText;
        if (subtitleEl) subtitleEl.textContent = subtitleText;
        bodyContainer.innerHTML = htmlContent;

        if (window.lucide) window.lucide.createIcons();
        this.attachDetailActionListeners();
    };

    AF.renderAssetsTableHelper = function(assets) {
        if (assets.length === 0) {
            return `
                <div style="text-align: center; padding: 30px; border: 1px dashed var(--border-color); border-radius: var(--radius-md); color: var(--text-secondary);">
                    <i data-lucide="package" style="width: 24px; height: 24px; opacity: 0.5; margin-bottom: 8px;"></i>
                    <p style="font-size: 12.5px;">No hay bienes registrados en esta ubicación.</p>
                </div>
            `;
        }

        const rows = assets.map(a => `
            <tr style="border-bottom: 1px solid var(--border-color); height: 44px;">
                <td style="padding: 8px 12px; font-size: 12px;"><strong>${a.code}</strong></td>
                <td style="padding: 8px 12px; font-size: 12px;">${a.name}</td>
                <td style="padding: 8px 12px; font-size: 12px;"><span class="badge badge-purple">${a.category || '-'}</span></td>
                <td style="padding: 8px 12px; font-size: 12px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${a.location.responsible || '-'}</td>
                <td style="padding: 8px 12px; text-align: right;">
                    <button class="btn btn-outline btn-xs btn-unassign-detail-inline" data-asset-id="${a.id}" style="padding: 4px; border: none; color: var(--danger); font-size: 11px; display: inline-flex; align-items: center; justify-content: center; background: transparent; cursor: pointer;" title="Desasignar Bien">
                        <i data-lucide="log-out" style="width: 12px; height: 12px;"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        return `
            <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card);">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.02); height: 36px;">
                            <th style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: var(--text-secondary);">Código</th>
                            <th style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: var(--text-secondary);">Bien</th>
                            <th style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: var(--text-secondary);">Categoría</th>
                            <th style="padding: 8px 12px; font-size: 11px; font-weight: 600; color: var(--text-secondary);">Responsable</th>
                            <th style="padding: 8px 12px; text-align: right; font-size: 11px; font-weight: 600; color: var(--text-secondary);">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;
    };

    AF.attachDetailActionListeners = function() {
        document.querySelectorAll(".btn-unassign-detail-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const assetId = btn.getAttribute("data-asset-id");
                const asset = AF.state.assets.find(a => a.id === assetId);
                if (asset && confirm(`¿Estás seguro de desasignar el bien "${asset.name}" y devolverlo al Almacén Central?`)) {
                    const originText = AF.getFullLocationText(asset.location);
                    
                    asset.location = null;
                    
                    AF.state.movements.push({
                        timestamp: new Date().toLocaleString(),
                        assetCode: asset.code,
                        assetName: asset.name,
                        origin: originText,
                        destination: "Almacén Central",
                        responsible: "Ninguno",
                        operator: document.getElementById("display-user-name")?.textContent || "Administrador"
                    });

                    AF.saveStore();
                    AF.renderLocationTree();
                    AF.populateAssignmentSelects();
                    
                    if (AF.selectedLocationNode) {
                        AF.selectLocationNode(AF.selectedLocationNode.type, AF.selectedLocationNode.id);
                    }
                    
                    AF.showToast(`El bien "${asset.name}" ha sido desasignado y devuelto a Almacén Central.`, "success");
                }
            });
        });
    };

})(window.ActivoFlow);
