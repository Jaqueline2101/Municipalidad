/* ==========================================================================
   ActivoFlow - Trámite Documentario (Registry and Response Logging)
   ========================================================================== */
(function(AF) {
    let activeDocIdForResponse = null;
    let activeDocIdForReentry = null;
    let editingDocId = null;

    // Helper to read file as Base64 Data URL
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // Helper to upload file to backend server or return base64 if offline
    async function uploadFileIfNeeded(fileInputId, docType, docNro, isResponse = false, isReentry = false) {
        const fileInput = document.getElementById(fileInputId);
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return null;
        }

        const file = fileInput.files[0];
        try {
            const base64Data = await readFileAsBase64(file);
            if (AF.useBackend) {
                // Upload to server SQLite backend with doc metadata for customized naming
                const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        fileData: base64Data,
                        docType: docType,
                        docNro: docNro,
                        isResponse: isResponse,
                        isReentry: isReentry
                    })
                });
                if (res.ok) {
                    const result = await res.json();
                    return result.filepath; // e.g. /documentos/CARTA_N_023_2026.pdf
                } else {
                    const err = await res.json();
                    throw new Error(err.error || "Error al guardar el archivo en el servidor.");
                }
            } else {
                // Standalone local mode: store data URL directly in local state
                return base64Data;
            }
        } catch (e) {
            console.error("Error al procesar/subir archivo:", e);
            AF.showToast("Error al subir archivo: " + e.message, "danger");
            throw e;
        }
    }

    AF.initTramite = function() {
        const formRegistry = document.getElementById("form-document-registry");
        const formResponse = document.getElementById("form-document-response");

        const searchInput = document.getElementById("tramite-search");
        const filterType = document.getElementById("tramite-filter-type");
        const filterState = document.getElementById("tramite-filter-state");

        // Initialize empty documents array if not exists
        if (!AF.state.documents) {
            AF.state.documents = [];
        }

        // Clean sample mock data specifically if they exist in local cache
        if (AF.state.documents && AF.state.documents.some(d => ['doc-1', 'doc-2', 'doc-3', 'doc-4'].includes(d.id))) {
            AF.state.documents = AF.state.documents.filter(d => !['doc-1', 'doc-2', 'doc-3', 'doc-4'].includes(d.id));
            AF.saveStore();
        }

        // Attach filter listeners
        [searchInput, filterType, filterState].forEach(el => {
            if (el) el.addEventListener("input", AF.renderTramiteTable);
        });

        // Submit Registry Form
        if (formRegistry) {
            formRegistry.addEventListener("submit", async (e) => {
                e.preventDefault();

                const regNro = document.getElementById("doc-reg-nro").value.trim();
                const dateRec = document.getElementById("doc-date-rec").value;
                const docType = document.getElementById("doc-type").value;
                const docNro = document.getElementById("doc-nro").value.trim();
                const sender = document.getElementById("doc-sender").value.trim();
                const recipient = document.getElementById("doc-recipient").value.trim();
                const subject = document.getElementById("doc-subject").value.trim();
                const folios = parseInt(document.getElementById("doc-folios").value) || 1;

                try {
                    AF.showToast("Procesando documento...", "info");
                    // Pass docType and docNro to generate appropriate structured filename
                    const uploadedFilePath = await uploadFileIfNeeded("doc-file-input", docType, docNro, false);

                    if (editingDocId) {
                        // Update mode
                        const idx = AF.state.documents.findIndex(d => d.id === editingDocId);
                        if (idx !== -1) {
                            const updatedDoc = {
                                ...AF.state.documents[idx],
                                regNro, dateRec, docType, docNro, sender, recipient, subject, folios
                            };
                            if (uploadedFilePath) {
                                updatedDoc.filePath = uploadedFilePath;
                            }
                            AF.state.documents[idx] = updatedDoc;
                            AF.showToast("Documento actualizado correctamente.", "success");
                        }
                        editingDocId = null;
                    } else {
                        // Create mode
                        const newDoc = {
                            id: `doc-${Date.now()}`,
                            regNro, dateRec, docType, docNro, sender, recipient, subject, folios,
                            response: null,
                            filePath: uploadedFilePath || null
                        };
                        AF.state.documents.push(newDoc);
                        AF.showToast("Documento registrado en el libro de trámite.", "success");
                    }

                    await AF.saveStore();
                    AF.closeModal("modal-document-registry");
                    
                    // Si estamos conectados, volvemos a cargar del backend para activar detección automática al instante
                    if (AF.useBackend && AF.initStore) {
                        await AF.initStore();
                    }
                    AF.renderTramiteTable();
                } catch (err) {
                    console.error("Error al guardar trámite:", err);
                }
            });
        }

        // Submit Response Form
        if (formResponse) {
            formResponse.addEventListener("submit", async (e) => {
                e.preventDefault();
                if (!activeDocIdForResponse) return;

                const docType = document.getElementById("resp-doc-type").value;
                const docNro = document.getElementById("resp-doc-nro").value.trim();
                const recipient = document.getElementById("resp-recipient").value.trim();
                const dateRetorno = document.getElementById("resp-date").value;
                const folios = parseInt(document.getElementById("resp-folios").value) || 1;

                try {
                    AF.showToast("Subiendo cargo de respuesta...", "info");
                    // Pass response docType and docNro to generate RESP_[docType]_[docNro] filename
                    const uploadedFilePath = await uploadFileIfNeeded("resp-file-input", docType, docNro, true);

                    const idx = AF.state.documents.findIndex(d => d.id === activeDocIdForResponse);
                    if (idx !== -1) {
                        const existingResponse = AF.state.documents[idx].response || {};
                        const responseObj = {
                            docType, docNro, recipient, dateRetorno, folios
                        };
                        if (uploadedFilePath) {
                            responseObj.filePath = uploadedFilePath;
                        } else if (existingResponse.filePath) {
                            responseObj.filePath = existingResponse.filePath;
                        }

                        AF.state.documents[idx].response = responseObj;
                        AF.showToast("Respuesta (retorno) registrada con éxito.", "success");
                    }

                    activeDocIdForResponse = null;
                    await AF.saveStore();
                    AF.closeModal("modal-document-response");

                    if (AF.useBackend && AF.initStore) {
                        await AF.initStore();
                    }
                    AF.renderTramiteTable();
                } catch (err) {
                    console.error("Error al guardar respuesta:", err);
                }
            });
        }

        // Submit Reentry Form
        const formReentry = document.getElementById("form-document-reentry");
        if (formReentry) {
            formReentry.addEventListener("submit", async (e) => {
                e.preventDefault();
                if (!activeDocIdForReentry) return;

                const dateReentry = document.getElementById("reentry-date").value;
                const folios = parseInt(document.getElementById("reentry-folios").value) || 1;
                const obs = document.getElementById("reentry-obs").value.trim();

                try {
                    AF.showToast("Subiendo cargo de reingreso...", "info");
                    
                    const doc = AF.state.documents.find(d => d.id === activeDocIdForReentry);
                    const docType = doc ? doc.docType : "DOC";
                    const docNro = doc ? doc.docNro : "REIN";

                    const uploadedFilePath = await uploadFileIfNeeded("reentry-file-input", docType, docNro, false, true);

                    const idx = AF.state.documents.findIndex(d => d.id === activeDocIdForReentry);
                    if (idx !== -1) {
                        const existingReentry = AF.state.documents[idx].reentry || {};
                        const reentryObj = {
                            dateReentry, folios, obs
                        };
                        if (uploadedFilePath) {
                            reentryObj.filePath = uploadedFilePath;
                        } else if (existingReentry.filePath) {
                            reentryObj.filePath = existingReentry.filePath;
                        }

                        AF.state.documents[idx].reentry = reentryObj;
                        AF.showToast("Reingreso registrado correctamente.", "success");
                    }

                    activeDocIdForReentry = null;
                    await AF.saveStore();
                    AF.closeModal("modal-document-reentry");

                    if (AF.useBackend && AF.initStore) {
                        await AF.initStore();
                    }
                    AF.renderTramiteTable();
                } catch (err) {
                    console.error("Error al guardar reingreso:", err);
                }
            });
        }

        // Render inicialmente
        AF.renderTramiteTable();
    };

    AF.renderTramiteTable = function() {
        const tableBody = document.getElementById("table-tramite-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";

        const query = document.getElementById("tramite-search") ? document.getElementById("tramite-search").value.toLowerCase().trim() : "";
        const typeFilter = document.getElementById("tramite-filter-type") ? document.getElementById("tramite-filter-type").value : "all";
        const stateFilter = document.getElementById("tramite-filter-state") ? document.getElementById("tramite-filter-state").value : "all";

        const docs = AF.state.documents || [];

        const filtered = docs.filter(d => {
            const matchesText = d.regNro.includes(query) ||
                                d.docNro.toLowerCase().includes(query) ||
                                d.sender.toLowerCase().includes(query) ||
                                d.recipient.toLowerCase().includes(query) ||
                                d.subject.toLowerCase().includes(query) ||
                                (d.response && d.response.docNro.toLowerCase().includes(query));

            const matchesType = (typeFilter === "all") || (d.docType === typeFilter);
            const matchesState = (stateFilter === "all") ||
                                 (stateFilter === "pending" && !d.response) ||
                                 (stateFilter === "responded" && d.response);

            return matchesText && matchesType && matchesState;
        });

        // Update indicators
        const totalBadge = document.getElementById("tramite-total-docs");
        const pendingBadge = document.getElementById("tramite-pending-docs");
        const respondedBadge = document.getElementById("tramite-responded-docs");

        if (totalBadge) totalBadge.textContent = docs.length;
        if (pendingBadge) pendingBadge.textContent = docs.filter(d => !d.response).length;
        if (respondedBadge) respondedBadge.textContent = docs.filter(d => d.response).length;

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 30px; color: var(--text-secondary);">No se encontraron documentos en el libro de trámite.</td></tr>`;
            return;
        }

        // Sort primarily by dateRec (descending) and secondarily by regNro (descending)
        filtered.sort((a, b) => {
            const dateA = new Date(a.dateRec).getTime();
            const dateB = new Date(b.dateRec).getTime();
            if (dateA !== dateB) {
                return dateB - dateA;
            }
            return (parseInt(b.regNro) || 0) - (parseInt(a.regNro) || 0);
        });

        filtered.forEach(d => {
            const tr = document.createElement("tr");

            // Format vertical date looking neat
            const dateParts = d.dateRec.split("-");
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : d.dateRec;

            // Link visual for original document
            let fileLinkHtml = "";
            if (d.filePath) {
                fileLinkHtml = `
                    <button type="button" class="btn btn-outline btn-xs btn-view-doc-inline" data-filepath="${d.filePath}" data-title="${d.docType} ${d.docNro}" style="margin-left: 6px; padding: 2px 5px; font-size: 9.5px; display: inline-flex; align-items: center; gap: 3px; height: auto;" title="Visualizar Documento">
                        <i data-lucide="eye" style="width: 10px; height: 10px;"></i> Ver Doc
                    </button>
                `;
            }

            // Link visual for response/cargo document
            let respFileLinkHtml = "";
            if (d.response && d.response.filePath) {
                respFileLinkHtml = `
                    <button type="button" class="btn btn-xs btn-outline btn-view-doc-inline" data-filepath="${d.response.filePath}" data-title="Cargo R con ${d.response.docType} ${d.response.docNro}" style="padding: 2px 4px; font-size: 9px; height: auto; display: inline-flex; align-items: center; gap: 2px; color: #34d399; border-color: rgba(52, 211, 153, 0.3);" title="Visualizar Cargo Adjunto">
                        <i data-lucide="file-text" style="width: 10px; height: 10px;"></i> Cargo
                    </button>
                `;
            }
            let responseSnippet = "";
            if (d.response) {
                responseSnippet = `
                    <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 8px 10px; border-radius: var(--radius-sm); font-size: 11px; margin-top: 4px; box-shadow: var(--shadow-sm);">
                        <strong style="color: #34d399;">R con ${d.response.docType} N° ${d.response.docNro}</strong><br>
                        <span class="text-secondary">A: ${d.response.recipient}</span><br>
                        <span class="text-secondary">Fecha: ${d.response.dateRetorno.split("-").reverse().join("/")} | Folios: ${d.response.folios}</span>
                        <div style="display: flex; gap: 6px; margin-top: 6px; justify-content: flex-end;">
                            ${respFileLinkHtml}
                            <button type="button" class="btn btn-xs btn-outline btn-edit-response" data-id="${d.id}" style="padding: 2px 4px; font-size: 9px; height: auto;">Editar R</button>
                            <button type="button" class="btn btn-xs btn-danger btn-delete-response" data-id="${d.id}" style="padding: 2px 4px; font-size: 9px; height: auto; background: var(--danger); border-color: var(--danger); color: white;">Eliminar R</button>
                        </div>
                    </div>
                `;
            } else {
                responseSnippet = `
                    <div style="text-align: center; padding: 4px 0;">
                        <span class="badge badge-warning" style="margin-bottom: 6px; font-size: 10px;">Respuesta Pendiente</span><br>
                        <button type="button" class="btn btn-xs btn-primary btn-add-response" data-id="${d.id}" style="font-size: 10px; padding: 4px 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="corner-down-right" style="width: 10px; height: 10px;"></i> Responder
                        </button>
                    </div>
                `;
            }

            // B. Reentry Section
            let reentrySnippet = "";
            let reentryFileLinkHtml = "";
            if (d.reentry && d.reentry.filePath) {
                reentryFileLinkHtml = `
                    <button type="button" class="btn btn-xs btn-outline btn-view-doc-inline" data-filepath="${d.reentry.filePath}" data-title="Cargo de Reingreso" style="padding: 2px 4px; font-size: 9px; height: auto; display: inline-flex; align-items: center; gap: 2px; color: #60a5fa; border-color: rgba(96, 165, 250, 0.3);" title="Visualizar Cargo de Reingreso">
                        <i data-lucide="file-check" style="width: 10px; height: 10px;"></i> Cargo
                    </button>
                `;
            }

            if (d.reentry) {
                reentrySnippet = `
                    <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); padding: 8px 10px; border-radius: var(--radius-sm); font-size: 11px; margin-top: 8px; box-shadow: var(--shadow-sm);">
                        <strong style="color: #60a5fa;">REINGRESO REGISTRADO</strong><br>
                        <span class="text-secondary">Fecha: ${d.reentry.dateReentry.split("-").reverse().join("/")} | Folios: ${d.reentry.folios}</span><br>
                        ${d.reentry.obs ? `<span class="text-secondary" style="font-style: italic;">Obs: ${d.reentry.obs}</span><br>` : ""}
                        <div style="display: flex; gap: 6px; margin-top: 6px; justify-content: flex-end;">
                            ${reentryFileLinkHtml}
                            <button type="button" class="btn btn-xs btn-outline btn-edit-reentry" data-id="${d.id}" style="padding: 2px 4px; font-size: 9px; height: auto;">Editar Rein</button>
                            <button type="button" class="btn btn-xs btn-danger btn-delete-reentry" data-id="${d.id}" style="padding: 2px 4px; font-size: 9px; height: auto; background: var(--danger); border-color: var(--danger); color: white;">Eliminar Rein</button>
                        </div>
                    </div>
                `;
            } else {
                reentrySnippet = `
                    <div style="text-align: center; padding: 4px 0; margin-top: 4px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                        <button type="button" class="btn btn-xs btn-outline btn-add-reentry" data-id="${d.id}" style="font-size: 10px; padding: 4px 8px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; color: #60a5fa; border-color: rgba(96, 165, 250, 0.4);">
                            <i data-lucide="arrow-down-left" style="width: 10px; height: 10px;"></i> Registrar Reingreso
                        </button>
                    </div>
                `;
            }

            // Check for linked Ficha Técnica
            const linkedAsset = (AF.state.assets || []).find(a => {
                const carta = a.specs && a.specs.carta_recibido ? a.specs.carta_recibido.toLowerCase() : "";
                return carta && (carta.includes(d.docNro.toLowerCase()) || d.docNro.toLowerCase().includes(carta));
            });

            let fichaBtnHtml = "";
            if (linkedAsset) {
                fichaBtnHtml = `
                    <button type="button" class="btn btn-xs btn-view-linked-ficha" data-asset-id="${linkedAsset.id}" title="Ver Ficha Técnica Vinculada" style="padding: 5px; height: auto; background: #2563eb; border-color: #2563eb; color: white;">
                        <i data-lucide="file-check" style="width: 12px; height: 12px;"></i>
                    </button>
                `;
            } else {
                fichaBtnHtml = `
                    <button type="button" class="btn btn-xs btn-create-linked-ficha" data-doc-nro="${d.docNro}" data-doc-type="${d.docType}" data-sender="${d.sender}" title="Crear Ficha Técnica con los datos de esta Carta" style="padding: 5px; height: auto; background: var(--accent); border-color: var(--accent); color: white;">
                        <i data-lucide="file-plus" style="width: 12px; height: 12px;"></i>
                    </button>
                `;
            }

            responseSnippet += reentrySnippet;
            tr.innerHTML = `
                <td style="padding: 12px 10px; text-align: center; border-bottom: 1px solid var(--border-color); font-weight: bold; color: var(--accent); font-size: 13px; width: 60px;">${d.regNro}</td>
                <td style="padding: 12px 10px; text-align: center; border-bottom: 1px solid var(--border-color); font-size: 11px; width: 85px;">
                    <div style="font-weight: 600; color: var(--text-primary);">${formattedDate}</div>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid var(--border-color); font-size: 11.5px; width: 220px;">
                    <span class="badge badge-secondary" style="font-size: 9px; font-weight: 700; margin-bottom: 4px;">${d.docType}</span>${fileLinkHtml}<br>
                    <strong style="color: var(--text-primary); word-break: break-all;">${d.docNro}</strong>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid var(--border-color); font-size: 11px;">
                    <div style="font-weight: 600; color: var(--text-primary);">${d.sender}</div>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid var(--border-color); font-size: 11px; max-width: 250px;">
                    <div style="color: var(--text-secondary); line-height: 1.4; white-space: normal; word-break: break-word;">${d.subject}</div>
                </td>
                <td style="padding: 12px 10px; text-align: center; border-bottom: 1px solid var(--border-color); font-size: 11px; font-weight: bold; color: var(--text-primary); width: 60px;">${d.folios} f.</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid var(--border-color); font-size: 11px; width: 140px;">
                    <div style="font-weight: 600; color: var(--text-primary);">${d.recipient}</div>
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid var(--border-color); width: 240px; vertical-align: top;">
                    ${responseSnippet}
                </td>
                <td style="padding: 12px 10px; text-align: center; border-bottom: 1px solid var(--border-color); width: 100px;">
                    <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
                        ${fichaBtnHtml}
                        <button type="button" class="btn btn-outline btn-xs btn-edit-doc" data-id="${d.id}" title="Editar Documento" style="padding: 5px; height: auto;">
                            <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-xs btn-delete-doc" data-id="${d.id}" title="Eliminar Documento" style="padding: 5px; height: auto; background: var(--danger); border-color: var(--danger); color: white;">
                            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Attach event listeners to buttons dynamically
        tableBody.querySelectorAll(".btn-create-linked-ficha").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const docNro = e.currentTarget.dataset.docNro;
                const docType = e.currentTarget.dataset.docType;
                const sender = e.currentTarget.dataset.sender;

                if (window.AF && window.AF.switchTab) {
                    window.AF.switchTab("fichas");
                }
                
                if (window.AF && window.AF.triggerCreateNewFicha) {
                    const cartaStr = `${docType} ${docNro}`;
                    window.AF.triggerCreateNewFicha('new_arrival', {
                        carta_recibido: cartaStr,
                        dependencia: sender
                    });
                }
            });
        });

        // Ficha Tecnica Link Listeners
        tableBody.querySelectorAll(".btn-view-linked-ficha").forEach(btn => {
            btn.addEventListener("click", () => {
                const assetId = btn.getAttribute("data-asset-id");
                const asset = (AF.state.assets || []).find(a => a.id === assetId);
                if (asset && typeof AF.loadReportDocument === "function") {
                    AF.loadReportDocument(asset);
                    const btnReports = document.getElementById("btn-reports");
                    if (btnReports) btnReports.click();
                    AF.showToast("Mostrando Ficha Técnica vinculada.", "success");
                }
            });
        });

        // Bind Action Listeners
        tableBody.querySelectorAll(".btn-add-response").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                AF.openResponseModal(id);
            });
        });

        tableBody.querySelectorAll(".btn-edit-response").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                AF.openResponseModal(id, true);
            });
        });

        tableBody.querySelectorAll(".btn-delete-response").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                if (confirm("¿Estás seguro de que deseas eliminar la respuesta a este documento?")) {
                    const idx = AF.state.documents.findIndex(d => d.id === id);
                    if (idx !== -1) {
                        AF.state.documents[idx].response = null;
                        await AF.saveStore();
                        if (AF.useBackend && AF.initStore) {
                            await AF.initStore();
                        }
                        AF.renderTramiteTable();
                        AF.showToast("Respuesta eliminada del registro.", "success");
                    }
                }
            });
        });

        tableBody.querySelectorAll(".btn-add-reentry").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                AF.openReentryModal(id);
            });
        });

        tableBody.querySelectorAll(".btn-edit-reentry").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                AF.openReentryModal(id, true);
            });
        });

        tableBody.querySelectorAll(".btn-delete-reentry").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                if (confirm("¿Estás seguro de que deseas eliminar el registro de reingreso de este documento?")) {
                    const idx = AF.state.documents.findIndex(d => d.id === id);
                    if (idx !== -1) {
                        AF.state.documents[idx].reentry = null;
                        await AF.saveStore();
                        if (AF.useBackend && AF.initStore) {
                            await AF.initStore();
                        }
                        AF.renderTramiteTable();
                        AF.showToast("Registro de reingreso eliminado.", "success");
                    }
                }
            });
        });

        tableBody.querySelectorAll(".btn-edit-doc").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                AF.openDocRegistryModal(id);
            });
        });

        tableBody.querySelectorAll(".btn-delete-doc").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.getAttribute("data-id");
                if (confirm("¿Estás seguro de que deseas eliminar este registro de trámite de forma permanente?")) {
                    AF.state.documents = AF.state.documents.filter(d => d.id !== id);
                    await AF.saveStore();
                    if (AF.useBackend && AF.initStore) {
                        await AF.initStore();
                    }
                    AF.renderTramiteTable();
                    AF.showToast("Documento de trámite eliminado correctamente.", "danger");
                }
            });
        });

        tableBody.querySelectorAll(".btn-view-doc-inline").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const filePath = btn.getAttribute("data-filepath");
                const docTitle = btn.getAttribute("data-title");
                AF.viewDocument(filePath, docTitle);
            });
        });
    };

    AF.openDocRegistryModal = function(id = null) {
        const form = document.getElementById("form-document-registry");
        if (!form) return;

        form.reset();
        document.getElementById("modal-doc-title").textContent = "Registrar Documento Recibido";
        editingDocId = null;

        // Auto-increment Reg Number starting from 0001 (padded to 4 digits)
        const docs = AF.state.documents || [];
        let nextNro = 1;
        if (docs.length > 0) {
            const numbers = docs.map(d => parseInt(d.regNro) || 0);
            nextNro = Math.max(...numbers) + 1;
        }
        const nextRegNro = String(nextNro).padStart(4, '0');
        document.getElementById("doc-reg-nro").value = nextRegNro;
        document.getElementById("doc-date-rec").value = new Date().toISOString().split("T")[0];

        if (id) {
            // Edit Mode
            const doc = docs.find(d => d.id === id);
            if (doc) {
                editingDocId = id;
                document.getElementById("modal-doc-title").textContent = "Editar Registro de Documento";
                document.getElementById("doc-reg-nro").value = doc.regNro;
                document.getElementById("doc-date-rec").value = doc.dateRec;
                document.getElementById("doc-type").value = doc.docType;
                document.getElementById("doc-nro").value = doc.docNro;
                document.getElementById("doc-sender").value = doc.sender;
                document.getElementById("doc-recipient").value = doc.recipient;
                document.getElementById("doc-subject").value = doc.subject;
                document.getElementById("doc-folios").value = doc.folios;
            }
        }

        AF.openModal("modal-document-registry");
    };

    AF.openResponseModal = function(id, isEdit = false) {
        const form = document.getElementById("form-document-response");
        if (!form) return;

        form.reset();
        activeDocIdForResponse = id;

        const doc = AF.state.documents.find(d => d.id === id);
        if (!doc) return;

        document.getElementById("resp-modal-context").textContent = `${doc.docType} N° ${doc.docNro}`;
        document.getElementById("resp-date").value = new Date().toISOString().split("T")[0];

        // Prepopulate default destination
        document.getElementById("resp-recipient").value = doc.sender.split("-")[0].trim();
        document.getElementById("resp-folios").value = doc.folios;

        if (isEdit && doc.response) {
            document.getElementById("resp-doc-type").value = doc.response.docType;
            document.getElementById("resp-doc-nro").value = doc.response.docNro;
            document.getElementById("resp-recipient").value = doc.response.recipient;
            document.getElementById("resp-date").value = doc.response.dateRetorno;
            document.getElementById("resp-folios").value = doc.response.folios;
        }

        AF.openModal("modal-document-response");
    };

    AF.openReentryModal = function(id, isEdit = false) {
        const form = document.getElementById("form-document-reentry");
        if (!form) return;

        form.reset();
        activeDocIdForReentry = id;

        const doc = AF.state.documents.find(d => d.id === id);
        if (!doc) return;

        document.getElementById("reentry-modal-context").textContent = `${doc.docType} N° ${doc.docNro}`;
        document.getElementById("reentry-date").value = new Date().toISOString().split("T")[0];
        document.getElementById("reentry-folios").value = doc.folios;
        document.getElementById("reentry-obs").value = "";

        if (isEdit && doc.reentry) {
            document.getElementById("reentry-date").value = doc.reentry.dateReentry;
            document.getElementById("reentry-folios").value = doc.reentry.folios;
            document.getElementById("reentry-obs").value = doc.reentry.obs || "";
        }

        AF.openModal("modal-document-reentry");
    };

    AF.viewDocument = function(filePath, docTitle) {
        const modal = document.getElementById("modal-view-document");
        const titleEl = document.getElementById("view-doc-title");
        const bodyEl = document.getElementById("view-doc-body");
        const newTabBtn = document.getElementById("btn-open-doc-new-tab");

        if (!modal || !bodyEl) return;

        titleEl.textContent = docTitle || "Visualizar Documento";
        newTabBtn.href = filePath;

        bodyEl.innerHTML = "";

        // Check if the file is a PDF (or base64 pdf)
        const isPdf = filePath.toLowerCase().endsWith(".pdf") || filePath.startsWith("data:application/pdf");
        
        if (isPdf) {
            bodyEl.innerHTML = `
                <iframe src="${filePath}" style="width: 100%; height: 100%; min-height: 70vh; border: none;" allowfullscreen></iframe>
            `;
        } else {
            // Assume image
            bodyEl.innerHTML = `
                <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; overflow: auto; width: 100%;">
                    <img src="${filePath}" style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: var(--radius-sm); box-shadow: var(--shadow-lg);">
                </div>
            `;
        }

        AF.openModal("modal-view-document");
    };

})(window.ActivoFlow);
