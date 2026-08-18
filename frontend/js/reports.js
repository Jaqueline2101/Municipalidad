/* ==========================================================================
   ActivoFlow - Technical Sheets Module
   ========================================================================== */

(function(AF) {
    let activeReportAsset = null;

    AF.loadReportDocument = function(asset) {
        activeReportAsset = asset;

        // Populate left-side editor form
        const repCode = document.getElementById("rep-code");
        const repFontSize = document.getElementById("rep-font-size");
        const repName = document.getElementById("rep-name");
        const repBrand = document.getElementById("rep-brand");
        const repModel = document.getElementById("rep-model");
        const repColor = document.getElementById("rep-color");
        const repSerial = document.getElementById("rep-serial");
        const repCarta = document.getElementById("rep-carta");
        const repPedidoNro = document.getElementById("rep-pedido-nro");
        const repPedidoFecha = document.getElementById("rep-pedido-fecha");
        const repOrdenNro = document.getElementById("rep-orden-nro");
        const repOrdenFecha = document.getElementById("rep-orden-fecha");
        const repRespCargo = document.getElementById("rep-resp-cargo");
        const repRespPhone = document.getElementById("rep-resp-phone");
        const repCategory = document.getElementById("rep-category");
        const repFeatures = document.getElementById("rep-features");
        const repDependencia = document.getElementById("rep-dependencia");
        const repPabellon = document.getElementById("rep-pabellon");
        const repRespEmail = document.getElementById("rep-resp-email");
        const repProvider = document.getElementById("rep-provider");
        const repProviderAddr = document.getElementById("rep-provider-addr");
        const repGuia = document.getElementById("rep-guia");
        const repGarantia = document.getElementById("rep-garantia");
        const repCosto = document.getElementById("rep-costo");
        const repObs = document.getElementById("rep-obs");

        if (repCode) repCode.value = asset.code || "";
        if (repFontSize) repFontSize.value = (asset.specs && asset.specs["font_size"]) || "11";

        const officialFicha = document.querySelector(".official-ficha");
        if (officialFicha) {
            const size = (asset.specs && asset.specs["font_size"]) || "11";
            officialFicha.style.setProperty('--ficha-font-size', `${size}px`);
        }
        if (repCategory) repCategory.value = asset.category || "MONITORES, IMPRESORAS Y PERIFÉRICOS";

        // Populate dropdown with registered unique equipment for cloning
        const repCloneAsset = document.getElementById("rep-clone-asset");
        if (repCloneAsset) {
            repCloneAsset.innerHTML = '<option value="">Copiar de equipo existente...</option>';
            const uniqueEquips = [];
            const seenKeys = new Set();
            (AF.state.assets || []).forEach(ast => {
                if (ast.id === asset.id) return;
                const brand = (ast.brand || "").trim();
                const model = (ast.model || "").trim();
                const name = (ast.name || "").trim();
                if (!name && !brand && !model) return;
                const key = `${name.toLowerCase()}||${brand.toLowerCase()}||${model.toLowerCase()}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueEquips.push({
                        id: ast.id,
                        name: name,
                        brand: brand,
                        model: model,
                        category: ast.category || "",
                        color: (ast.specs && ast.specs.color) || "NEGRO",
                        caracteristicas_lista: (ast.specs && ast.specs.caracteristicas_lista) ? ast.specs.caracteristicas_lista : []
                    });
                }
            });
            uniqueEquips.sort((a, b) => a.name.localeCompare(b.name));
            uniqueEquips.forEach(eq => {
                const opt = document.createElement("option");
                opt.value = JSON.stringify(eq);
                opt.textContent = `${eq.brand} ${eq.model} - ${eq.name}`;
                repCloneAsset.appendChild(opt);
            });
        }

        if (repFeatures) {
            let featuresVal = "";
            if (asset.specs && asset.specs["caracteristicas_lista"]) {
                featuresVal = asset.specs["caracteristicas_lista"].join("\n");
            } else {
                const list = [];
                if (asset.specs) {
                    const excluded = ["color", "observaciones", "costo", "valor", "cargo", 
                                      "telefono_responsable", "email_responsable", "dependencia", 
                                      "pabellon", "caracteristicas_lista", "ficha_fecha_hora", 
                                      "carta_recibido", "pedido_nro", "pedido_fecha", 
                                      "direccion_proveedor", "guia_nro", "tiempo_garantia", "font_size"];
                    Object.entries(asset.specs).forEach(([key, val]) => {
                        const lKey = key.toLowerCase();
                        if (!excluded.includes(lKey)) {
                            list.push(`${key.toUpperCase()}: ${val}`);
                        }
                    });
                }
                if (list.length === 0 && asset.name) {
                    list.push(`TIPO: ${asset.name}`);
                }
                featuresVal = list.join("\n");
            }
            repFeatures.value = featuresVal;
        }

        if (repDependencia) {
            let depVal = "";
            if (asset.specs && asset.specs["dependencia"]) {
                depVal = asset.specs["dependencia"];
            } else if (asset.location) {
                depVal = `${AF.getSedeName(asset.location.sedeId)} - ${AF.getOficinaName(asset.location.oficinaId)}`;
            } else {
                depVal = "ALMACÉN CENTRAL / INVENTARIO";
            }
            repDependencia.value = depVal;
        }

        if (repPabellon) {
            let pabVal = "";
            if (asset.specs && asset.specs["pabellon"]) {
                pabVal = asset.specs["pabellon"];
            } else if (asset.location) {
                pabVal = AF.getPisoName(asset.location.pisoId);
            } else {
                pabVal = "N/A";
            }
            repPabellon.value = pabVal;
        }

        if (repName) repName.value = asset.name || "";
        if (repBrand) repBrand.value = asset.brand || "";
        if (repModel) repModel.value = asset.model || "";
        if (repColor) {
            let colorVal = "NEGRO";
            if (asset.specs) {
                const colorKey = Object.keys(asset.specs).find(k => k.toLowerCase() === "color");
                if (colorKey) colorVal = asset.specs[colorKey];
            }
            repColor.value = colorVal;
        }
        if (repSerial) repSerial.value = asset.serial || "";
        if (repCarta) {
            let cartaVal = "CARTA Nº 50-2026-MPSR-J/OGA/OL/AC/WDB";
            if (asset.specs) {
                const cartaKey = Object.keys(asset.specs).find(k => k.toLowerCase().includes("carta"));
                if (cartaKey) cartaVal = asset.specs[cartaKey];
            }
            repCarta.value = cartaVal;
        }
        if (repPedidoNro) {
            let val = "001117";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase().includes("pedido_nro"));
                if (key) val = asset.specs[key];
            }
            repPedidoNro.value = val;
        }
        if (repPedidoFecha) {
            let val = "2026-02-27";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase().includes("pedido_fecha"));
                if (key) val = asset.specs[key];
            }
            repPedidoFecha.value = val;
        }
        if (repOrdenNro) repOrdenNro.value = asset.purchaseOrder || "0000687";
        if (repOrdenFecha) repOrdenFecha.value = asset.purchaseDate || "2026-03-25";

        if (repRespCargo) {
            let val = "OPERADOR / ENCARGADO";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase() === "cargo");
                if (key) val = asset.specs[key];
            }
            repRespCargo.value = val;
        }
        if (repRespPhone) {
            let val = "**";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase() === "telefono_responsable");
                if (key) val = asset.specs[key];
            }
            repRespPhone.value = val;
        }
        if (repRespEmail) {
            let val = "**";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase() === "email_responsable");
                if (key) val = asset.specs[key];
            }
            repRespEmail.value = val;
        }
        if (repProvider) repProvider.value = asset.provider || "HASEM BABUCH R&D S.A.C.";
        if (repProviderAddr) {
            let val = "JR. MILITARE NRO. 713 PUNO - SAN ROMAN - JULIACA";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase().includes("direccion_proveedor") || k.toLowerCase().includes("direccion proveedor"));
                if (key) val = asset.specs[key];
            }
            repProviderAddr.value = val;
        }
        if (repGuia) {
            let val = "EG07-00000010";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase().includes("guia_nro") || k.toLowerCase().includes("guia"));
                if (key) val = asset.specs[key];
            }
            repGuia.value = val;
        }
        if (repGarantia) {
            let val = "12 MESES";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase().includes("tiempo_garantia") || k.toLowerCase().includes("garantia"));
                if (key) val = asset.specs[key];
            }
            repGarantia.value = val;
        }
        if (repCosto) {
            let val = "1,900.00";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase() === "costo" || k.toLowerCase() === "valor");
                if (key) val = asset.specs[key];
            }
            repCosto.value = val;
        }
        if (repObs) {
            let val = "CONFORME - OPERATIVO EN SU TOTALIDAD";
            if (asset.specs) {
                const key = Object.keys(asset.specs).find(k => k.toLowerCase().includes("observacion"));
                if (key) val = asset.specs[key];
            }
            repObs.value = val;
        }

        const searchInput = document.getElementById("report-asset-search");
        if (searchInput) searchInput.value = `${asset.code} - ${asset.name}`;
        
        const dropdown = document.getElementById("report-asset-dropdown");
        if (dropdown) {
            dropdown.innerHTML = "";
            dropdown.classList.remove("active");
        }

        // 1. Populate header & Ficha number
        const categoryHeader = document.getElementById("doc-asset-category-header");
        if (categoryHeader) categoryHeader.textContent = asset.category ? asset.category.toUpperCase() : "MONITORES, IMPRESORAS Y PERIFÉRICOS";

        const docNumberDisplay = document.getElementById("doc-number-display");
        if (docNumberDisplay) {
            const lastPart = asset.code ? asset.code.split('-').pop() : "001";
            docNumberDisplay.textContent = `N° ${lastPart}-2026`;
        }

        // 2. Section 1: Datos Generales
        const descFull = document.getElementById("doc-description-full");
        if (descFull) descFull.textContent = asset.name ? asset.name.toUpperCase() : "EQUIPO PATRIMONIAL";

        const brandEl = document.getElementById("doc-brand");
        if (brandEl) brandEl.textContent = asset.brand || "—";

        const modelEl = document.getElementById("doc-model");
        if (modelEl) modelEl.textContent = asset.model || "—";

        const colorEl = document.getElementById("doc-color");
        if (colorEl) {
            // Find color in specs case-insensitively
            let colorVal = "NEGRO";
            if (asset.specs) {
                const colorKey = Object.keys(asset.specs).find(k => k.toLowerCase() === "color");
                if (colorKey) colorVal = asset.specs[colorKey];
            }
            colorEl.textContent = colorVal.toUpperCase();
        }

        const serialEl = document.getElementById("doc-serial");
        if (serialEl) serialEl.textContent = asset.serial || "S/N";

        // Specs bullets in characteristics
        const featuresList = document.getElementById("doc-features-list");
        if (featuresList) {
            featuresList.innerHTML = "";
            
            if (asset.specs && asset.specs["caracteristicas_lista"]) {
                asset.specs["caracteristicas_lista"].forEach(feat => {
                    const li = document.createElement("li");
                    let cleanFeat = feat.trim();
                    // Limpiar viñetas manuales si existen para no duplicar
                    if (cleanFeat.startsWith("•") || cleanFeat.startsWith("-") || cleanFeat.startsWith("*")) {
                        cleanFeat = cleanFeat.substring(1).trim();
                    }
                    if (cleanFeat.includes(":")) {
                        const idx = cleanFeat.indexOf(":");
                        const label = cleanFeat.substring(0, idx).trim();
                        const val = cleanFeat.substring(idx + 1).trim();
                        li.innerHTML = `<strong>${label.toUpperCase()}:</strong> ${val}`;
                    } else {
                        li.innerHTML = cleanFeat;
                    }
                    featuresList.appendChild(li);
                });
            } else {
                // First bullet
                const mainLi = document.createElement("li");
                mainLi.innerHTML = `<strong>TIPO:</strong> ${asset.name}`;
                featuresList.appendChild(mainLi);

                // Specs
                if (asset.specs) {
                    const excluded = ["color", "observaciones", "costo", "valor", "cargo", 
                                      "telefono_responsable", "email_responsable", "dependencia", 
                                      "pabellon", "caracteristicas_lista", "ficha_fecha_hora", 
                                      "carta_recibido", "pedido_nro", "pedido_fecha", 
                                      "direccion_proveedor", "guia_nro", "tiempo_garantia", "font_size"];
                    Object.entries(asset.specs).forEach(([key, val]) => {
                        const lKey = key.toLowerCase();
                        if (!excluded.includes(lKey)) {
                            const li = document.createElement("li");
                            li.innerHTML = `<strong>${key.toUpperCase()}:</strong> ${val}`;
                            featuresList.appendChild(li);
                        }
                    });
                }
                if (asset.controlType === "stock") {
                    const li = document.createElement("li");
                    li.innerHTML = `<strong>CANTIDAD AGRUPADA:</strong> ${asset.quantity} unidades`;
                    featuresList.appendChild(li);
                }
            }
        }

        // 3. Section 2: Datos Requerimiento
        const orderNro = asset.purchaseOrder || "0000687";
        const purchaseDateText = asset.purchaseDate ? AF.formatDate(asset.purchaseDate) : "25/03/2026";
        
        let pedidoNroVal = "";
        let pedidoFechaVal = "";
        if (asset.specs) {
            const keyNro = Object.keys(asset.specs).find(k => k.toLowerCase().includes("pedido_nro") || k.toLowerCase() === "pedido");
            if (keyNro) pedidoNroVal = asset.specs[keyNro];
            const keyFecha = Object.keys(asset.specs).find(k => k.toLowerCase().includes("pedido_fecha"));
            if (keyFecha) pedidoFechaVal = asset.specs[keyFecha];
        }
        document.getElementById("doc-pedido-nro").textContent = pedidoNroVal || "—";
        document.getElementById("doc-pedido-fecha").textContent = pedidoFechaVal ? AF.formatDate(pedidoFechaVal) : "—";
        document.getElementById("doc-orden-nro").textContent = orderNro;
        document.getElementById("doc-orden-fecha").textContent = purchaseDateText;

        const depEl = document.getElementById("doc-dependencia");
        const pabEl = document.getElementById("doc-pabellon");
        
        if (asset.specs && asset.specs["dependencia"]) {
            depEl.textContent = asset.specs["dependencia"].toUpperCase();
        } else if (asset.location) {
            depEl.textContent = `${AF.getSedeName(asset.location.sedeId)} - ${AF.getOficinaName(asset.location.oficinaId)}`.toUpperCase();
        } else {
            depEl.textContent = "ALMACÉN CENTRAL / INVENTARIO";
        }

        if (asset.specs && asset.specs["pabellon"]) {
            pabEl.textContent = asset.specs["pabellon"].toUpperCase();
        } else if (asset.location) {
            pabEl.textContent = AF.getPisoName(asset.location.pisoId).toUpperCase();
        } else {
            pabEl.textContent = "N/A";
        }

        // 4. Section 3: Datos del Responsable
        const respNameEl = document.getElementById("doc-responsible-name-s3");
        const respChargeEl = document.getElementById("doc-responsible-charge");
        const respPhoneEl = document.getElementById("doc-responsible-phone");
        const respEmailEl = document.getElementById("doc-responsible-email");

        if (asset.location) {
            respNameEl.textContent = asset.location.responsible ? asset.location.responsible.toUpperCase() : "—";
            
            // Cargo/Phone/Email from specs if any
            let charge = "OPERADOR / ENCARGADO";
            let phone = "**";
            let email = "**";
            if (asset.specs) {
                const chargeKey = Object.keys(asset.specs).find(k => k.toLowerCase() === "cargo");
                if (chargeKey) charge = asset.specs[chargeKey];

                const phoneKey = Object.keys(asset.specs).find(k => k.toLowerCase() === "telefono_responsable");
                if (phoneKey) phone = asset.specs[phoneKey];

                const emailKey = Object.keys(asset.specs).find(k => k.toLowerCase() === "email_responsable");
                if (emailKey) email = asset.specs[emailKey];
            }
            respChargeEl.textContent = charge.toUpperCase();
            respPhoneEl.textContent = phone;
            respEmailEl.textContent = email;
        } else {
            respNameEl.textContent = "ENCARGADO DE ALMACÉN CENTRAL";
            respChargeEl.textContent = "CONTROL DE INVENTARIO";
            respPhoneEl.textContent = "**";
            respEmailEl.textContent = "**";
        }

        document.getElementById("doc-provider-s3").textContent = asset.provider || "HASEM BABUCH R&D S.A.C.";
        
        let addressVal = "JR. MILITARE NRO. 713 PUNO - SAN ROMAN - JULIACA";
        if (asset.specs) {
            const addrKey = Object.keys(asset.specs).find(k => k.toLowerCase().includes("dirección") || k.toLowerCase().includes("direccion"));
            if (addrKey) addressVal = asset.specs[addrKey];
        }
        document.getElementById("doc-provider-address").textContent = addressVal.toUpperCase();
        document.getElementById("doc-orden-nro-s3").textContent = orderNro;

        let costVal = "S/ 1,900.00";
        if (asset.specs) {
            const costKey = Object.keys(asset.specs).find(k => k.toLowerCase() === "costo" || k.toLowerCase() === "valor");
            if (costKey) costVal = asset.specs[costKey];
        }
        document.getElementById("doc-cost-s3").textContent = costVal.startsWith("S/") ? costVal : `S/ ${costVal}`;

        document.getElementById("doc-purchase-date-s3").textContent = purchaseDateText;
        document.getElementById("doc-warranty-time").textContent = asset.warrantyEnd ? "12 MESES" : "SIN GARANTÍA";

        // Observaciones
        let obsVal = "CONFORME - OPERATIVO EN SU TOTALIDAD";
        if (asset.specs) {
            const obsKey = Object.keys(asset.specs).find(k => k.toLowerCase().includes("observacion"));
            if (obsKey) obsVal = asset.specs[obsKey];
        }
        document.getElementById("doc-observaciones").textContent = obsVal.toUpperCase();

        // 5. Signature Footer
        const elabByEl = document.getElementById("doc-elaborated-by");
        if (elabByEl) {
            elabByEl.textContent = "OPERADOR DE SISTEMA (ADMIN)";
        }

        // 6. Toggle visibility
        document.getElementById("report-empty-state").classList.add("hidden");
        const listContainer = document.getElementById("reports-list-container");
        if (listContainer) listContainer.classList.add("hidden");
        
        // Hide search card when editing
        const searchCard = document.querySelector(".search-card");
        if (searchCard) searchCard.classList.add("hidden");

        const headerBackBtn = document.getElementById("btn-reports-header-back");
        if (headerBackBtn) headerBackBtn.classList.remove("hidden");

        document.getElementById("report-document-wrapper").classList.remove("hidden");
        document.getElementById("btn-print-sheet").removeAttribute("disabled");
    };

    AF.initReports = function() {
        const reportAssetSearch = document.getElementById("report-asset-search");
        const reportAssetDropdown = document.getElementById("report-asset-dropdown");
        const btnPrintSheet = document.getElementById("btn-print-sheet");
        const repCloneAsset = document.getElementById("rep-clone-asset");

        if (repCloneAsset) {
            repCloneAsset.addEventListener("change", (e) => {
                const val = e.target.value;
                if (!val) return;
                try {
                    const eq = JSON.parse(val);
                    const repName = document.getElementById("rep-name");
                    const repBrand = document.getElementById("rep-brand");
                    const repModel = document.getElementById("rep-model");
                    const repColor = document.getElementById("rep-color");
                    const repCategory = document.getElementById("rep-category");
                    const repFeatures = document.getElementById("rep-features");
                    
                    if (repName) {
                        repName.value = eq.name;
                        repName.dispatchEvent(new Event('input'));
                    }
                    if (repBrand) {
                        repBrand.value = eq.brand;
                        repBrand.dispatchEvent(new Event('input'));
                    }
                    if (repModel) {
                        repModel.value = eq.model;
                        repModel.dispatchEvent(new Event('input'));
                    }
                    if (repColor) {
                        repColor.value = eq.color;
                        repColor.dispatchEvent(new Event('input'));
                    }
                    if (repCategory) {
                        repCategory.value = eq.category;
                        repCategory.dispatchEvent(new Event('input'));
                    }
                    if (repFeatures) {
                        repFeatures.value = eq.caracteristicas_lista.join("\n");
                        repFeatures.dispatchEvent(new Event('input'));
                    }
                    
                    AF.showToast("Datos de equipo autocompletados desde historial.", "success");
                    repCloneAsset.value = "";
                } catch (err) {
                    console.error("Error cloning equipment data:", err);
                }
            });
        }

        // Listeners para la barra de herramientas de formato de Características
        const repFeatures = document.getElementById("rep-features");
        document.querySelectorAll(".btn-format").forEach(btn => {
            btn.addEventListener("click", () => {
                if (!repFeatures) return;
                
                const cmd = btn.getAttribute("data-cmd");
                const start = repFeatures.selectionStart;
                const end = repFeatures.selectionEnd;
                const val = repFeatures.value;
                const selectedText = val.substring(start, end);
                
                let replacement = "";
                
                if (cmd === "bold") {
                    replacement = `<strong>${selectedText || "texto"}</strong>`;
                } else if (cmd === "italic") {
                    replacement = `<em>${selectedText || "texto"}</em>`;
                } else if (cmd === "underline") {
                    replacement = `<u>${selectedText || "texto"}</u>`;
                } else if (cmd === "bullet") {
                    if (start !== end) {
                        const beforeSelection = val.substring(0, start);
                        const selection = val.substring(start, end);
                        const afterSelection = val.substring(end);
                        
                        const lines = selection.split("\n");
                        const processedLines = lines.map(line => {
                            if (line.startsWith("• ")) return line.substring(2);
                            if (line.startsWith("•")) return line.substring(1);
                            return `• ${line}`;
                        });
                        
                        const newSelectionText = processedLines.join("\n");
                        repFeatures.value = beforeSelection + newSelectionText + afterSelection;
                        repFeatures.focus();
                        repFeatures.setSelectionRange(start, start + newSelectionText.length);
                    } else {
                        const lines = val.split("\n");
                        let charCount = 0;
                        let targetLineIdx = 0;
                        
                        for (let i = 0; i < lines.length; i++) {
                            const lineLength = lines[i].length + 1;
                            if (charCount <= start && start <= charCount + lineLength) {
                                targetLineIdx = i;
                                break;
                            }
                            charCount += lineLength;
                        }
                        
                        const lineText = lines[targetLineIdx];
                        let delta = 0;
                        if (lineText.startsWith("• ")) {
                            lines[targetLineIdx] = lineText.substring(2);
                            delta = -2;
                        } else if (lineText.startsWith("•")) {
                            lines[targetLineIdx] = lineText.substring(1);
                            delta = -1;
                        } else {
                            lines[targetLineIdx] = `• ${lineText}`;
                            delta = 2;
                        }
                        
                        repFeatures.value = lines.join("\n");
                        repFeatures.focus();
                        const newCursorPos = Math.max(0, start + delta);
                        repFeatures.setSelectionRange(newCursorPos, newCursorPos);
                    }
                    
                    repFeatures.dispatchEvent(new Event('input'));
                    return;
                } else if (cmd === "clear") {
                    replacement = selectedText.replace(/<\/?[^>]+(>|$)/g, "");
                }
                
                repFeatures.value = val.substring(0, start) + replacement + val.substring(end);
                repFeatures.focus();
                repFeatures.setSelectionRange(start, start + replacement.length);
                
                repFeatures.dispatchEvent(new Event('input'));
            });
        });

        // Autocompletado predictivo para el campo "Descripción del Equipo" basado en la categoría
        const repName = document.getElementById("rep-name");
        const repCategory = document.getElementById("rep-category");
        const repNameDropdown = document.getElementById("rep-name-dropdown");

        if (repName && repNameDropdown) {
            const showNameMatches = () => {
                const currentCategory = (repCategory ? repCategory.value : "").trim().toLowerCase();
                const currentName = repName.value.trim().toLowerCase();
                
                repNameDropdown.innerHTML = "";
                repNameDropdown.style.display = "none";

                // Filtrar bienes que coincidan
                const matches = [];
                const seenKeys = new Set();

                (AF.state.assets || []).forEach(ast => {
                    // Filtrar por categoría seleccionada si hay alguna escrita
                    if (currentCategory) {
                        const astCat = (ast.category || "").trim().toLowerCase();
                        if (astCat !== currentCategory) return;
                    }

                    const name = (ast.name || "").trim();
                    const brand = (ast.brand || "").trim();
                    const model = (ast.model || "").trim();
                    if (!name) return;

                    const key = `${name.toLowerCase()}||${brand.toLowerCase()}||${model.toLowerCase()}`;
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        matches.push(ast);
                    }
                });

                // Si el usuario escribió algo, filtrar también por ese texto
                let filtered = matches;
                if (currentName) {
                    filtered = matches.filter(ast => ast.name.toLowerCase().includes(currentName));
                }

                if (filtered.length === 0) return;

                filtered.forEach(ast => {
                    const item = document.createElement("div");
                    item.className = "autocomplete-item";
                    item.innerHTML = `
                        <div style="font-weight: 600; font-size: 12px; color: var(--text-primary);">${ast.name}</div>
                        <div style="font-size: 10px; color: var(--text-secondary);">Marca: ${ast.brand || '—'} | Modelo: ${ast.model || '—'} | Color: ${(ast.specs && ast.specs.color) || '—'}</div>
                    `;
                    
                    item.addEventListener("click", () => {
                        repName.value = ast.name || "";
                        
                        const repBrand = document.getElementById("rep-brand");
                        const repModel = document.getElementById("rep-model");
                        const repColor = document.getElementById("rep-color");
                        const repFeatures = document.getElementById("rep-features");

                        if (repBrand) repBrand.value = ast.brand || "";
                        if (repModel) repModel.value = ast.model || "";
                        if (repColor) repColor.value = (ast.specs && ast.specs.color) || "";
                        
                        if (repFeatures) {
                            if (ast.specs && ast.specs.caracteristicas_lista) {
                                repFeatures.value = ast.specs.caracteristicas_lista.join("\n");
                            } else {
                                const list = [];
                                const excluded = ["color", "observaciones", "costo", "valor", "cargo", 
                                                  "telefono_responsable", "email_responsable", "dependencia", 
                                                  "pabellon", "caracteristicas_lista", "ficha_fecha_hora", 
                                                  "carta_recibido", "pedido_nro", "pedido_fecha", 
                                                  "direccion_proveedor", "guia_nro", "tiempo_garantia", "font_size"];
                                Object.entries(ast.specs || {}).forEach(([key, val]) => {
                                    if (!excluded.includes(key.toLowerCase())) {
                                        list.push(`${key.toUpperCase()}: ${val}`);
                                    }
                                });
                                repFeatures.value = list.join("\n");
                            }
                        }

                        // Sincronizar eventos de input para actualizar vista previa instantánea
                        repName.dispatchEvent(new Event('input'));
                        if (repBrand) repBrand.dispatchEvent(new Event('input'));
                        if (repModel) repModel.dispatchEvent(new Event('input'));
                        if (repColor) repColor.dispatchEvent(new Event('input'));
                        if (repFeatures) repFeatures.dispatchEvent(new Event('input'));

                        repNameDropdown.innerHTML = "";
                        repNameDropdown.style.display = "none";
                    });

                    repNameDropdown.appendChild(item);
                });

                repNameDropdown.style.display = "block";
            };

            repName.addEventListener("input", showNameMatches);
            repName.addEventListener("focus", showNameMatches);
            repName.addEventListener("click", showNameMatches);

            // Cerrar menú al hacer clic afuera
            document.addEventListener("click", (e) => {
                if (!e.target.closest("#rep-name") && !e.target.closest("#rep-name-dropdown")) {
                    repNameDropdown.style.display = "none";
                }
            });

            if (repCategory) {
                repCategory.addEventListener("change", () => {
                    if (repNameDropdown.style.display === "block" || document.activeElement === repName) {
                        showNameMatches();
                    }
                });
            }
        }

        const triggerCreateNewFicha = () => {
            const newAsset = {
                id: `asset-${Date.now()}`,
                code: `PAT-2026-${String(AF.state.assets.length + 1).padStart(4, '0')}`,
                name: "",
                category: "MONITORES, IMPRESORAS Y PERIFÉRICOS",
                brand: "",
                model: "",
                serial: "",
                purchaseOrder: "",
                purchaseDate: "",
                provider: "",
                warrantyEnd: "",
                location: null,
                specs: {
                    color: "",
                    carta_recibido: "",
                    pedido_nro: "",
                    pedido_fecha: "",
                    cargo: "",
                    telefono_responsable: "",
                    email_responsable: "",
                    direccion_proveedor: "",
                    guia_nro: "",
                    tiempo_garantia: "",
                    costo: "",
                    observaciones: ""
                }
            };
            AF.loadReportDocument(newAsset);
            
            // Focus on code input
            const repCode = document.getElementById("rep-code");
            if (repCode) {
                setTimeout(() => {
                    repCode.focus();
                    repCode.select();
                }, 100);
            }
        };

        // Bind header button
        const btnNewReport = document.getElementById("btn-new-report");
        if (btnNewReport) {
            btnNewReport.addEventListener("click", triggerCreateNewFicha);
        }

        // Bind empty state button
        const btnEmptyCreateReport = document.getElementById("btn-empty-create-report");
        if (btnEmptyCreateReport) {
            btnEmptyCreateReport.addEventListener("click", triggerCreateNewFicha);
        }

        // Autocomplete search
        if (reportAssetSearch) {
            const showMatches = () => {
                const val = reportAssetSearch.value.toLowerCase().trim();
                reportAssetDropdown.innerHTML = "";
                reportAssetDropdown.classList.remove("active");

                const matches = AF.state.assets.filter(a => {
                    return a.code.toLowerCase().includes(val) || 
                           a.name.toLowerCase().includes(val) || 
                           (a.serial && a.serial.toLowerCase().includes(val));
                });

                if (matches.length === 0) {
                    const emptyDiv = document.createElement("div");
                    emptyDiv.className = "autocomplete-item text-muted";
                    emptyDiv.style.padding = "10px";
                    emptyDiv.innerHTML = `
                        <div style="margin-bottom: 6px; color: var(--text-secondary);">Ningún bien coincide con la búsqueda.</div>
                        <button type="button" class="btn btn-primary btn-xs" id="btn-create-not-found" style="width: 100%; justify-content: center; font-size: 11px; padding: 4px 8px;">
                            <i data-lucide="plus" style="width: 12px; height: 12px; margin-right: 4px;"></i> Crear Ficha Técnica
                        </button>
                    `;
                    reportAssetDropdown.appendChild(emptyDiv);
                    reportAssetDropdown.classList.add("active");
                    
                    if (window.lucide) window.lucide.createIcons();
                    
                    const btnCreateNotFound = document.getElementById("btn-create-not-found");
                    if (btnCreateNotFound) {
                        btnCreateNotFound.addEventListener("click", (ev) => {
                            ev.stopPropagation();
                            reportAssetDropdown.classList.remove("active");
                            triggerCreateNewFicha();
                        });
                    }
                    return;
                }

                matches.forEach(m => {
                    const item = document.createElement("div");
                    item.className = "autocomplete-item";
                    item.innerHTML = `
                        <span class="item-code">${m.code}</span>
                        <div class="item-desc">${m.name}</div>
                        <div class="item-sub">Marca: ${m.brand} | Serie: ${m.serial || 'N/A'}</div>
                    `;
                    item.addEventListener("click", () => {
                        AF.loadReportDocument(m);
                    });
                    reportAssetDropdown.appendChild(item);
                });
                reportAssetDropdown.classList.add("active");
            };

            reportAssetSearch.addEventListener("input", showMatches);
            reportAssetSearch.addEventListener("focus", showMatches);
            reportAssetSearch.addEventListener("click", showMatches);

            document.addEventListener("click", (e) => {
                if (!e.target.closest(".search-predictive-wrapper")) {
                    reportAssetDropdown.classList.remove("active");
                }
            });
        }

        // Save/Update report data form submit
        const formReportEditor = document.getElementById("form-report-editor");
        if (formReportEditor) {
            formReportEditor.addEventListener("submit", (e) => {
                e.preventDefault();
                if (!activeReportAsset) return;

                // Read all fields
                activeReportAsset.code = document.getElementById("rep-code").value.trim();
                activeReportAsset.category = document.getElementById("rep-category").value.trim();
                activeReportAsset.name = document.getElementById("rep-name").value.trim();
                activeReportAsset.brand = document.getElementById("rep-brand").value.trim();
                activeReportAsset.model = document.getElementById("rep-model").value.trim();
                activeReportAsset.serial = document.getElementById("rep-serial").value.trim();
                activeReportAsset.purchaseOrder = document.getElementById("rep-orden-nro").value.trim();
                activeReportAsset.purchaseDate = document.getElementById("rep-orden-fecha").value;
                activeReportAsset.provider = document.getElementById("rep-provider").value.trim();

                if (!activeReportAsset.specs) activeReportAsset.specs = {};
                activeReportAsset.specs["color"] = document.getElementById("rep-color").value.trim();
                activeReportAsset.specs["carta_recibido"] = document.getElementById("rep-carta").value.trim();
                activeReportAsset.specs["pedido_nro"] = document.getElementById("rep-pedido-nro").value.trim();
                activeReportAsset.specs["pedido_fecha"] = document.getElementById("rep-pedido-fecha").value;
                activeReportAsset.specs["cargo"] = document.getElementById("rep-resp-cargo").value.trim();
                activeReportAsset.specs["telefono_responsable"] = document.getElementById("rep-resp-phone").value.trim();
                activeReportAsset.specs["email_responsable"] = document.getElementById("rep-resp-email").value.trim();
                activeReportAsset.specs["direccion_proveedor"] = document.getElementById("rep-provider-addr").value.trim();
                activeReportAsset.specs["guia_nro"] = document.getElementById("rep-guia").value.trim();
                activeReportAsset.specs["tiempo_garantia"] = document.getElementById("rep-garantia").value.trim();
                activeReportAsset.specs["costo"] = document.getElementById("rep-costo").value.trim();
                activeReportAsset.specs["observaciones"] = document.getElementById("rep-obs").value.trim();

                activeReportAsset.specs["dependencia"] = document.getElementById("rep-dependencia").value.trim();
                activeReportAsset.specs["pabellon"] = document.getElementById("rep-pabellon").value.trim();
                activeReportAsset.specs["font_size"] = document.getElementById("rep-font-size").value;
                
                const rawFeatures = document.getElementById("rep-features").value;
                activeReportAsset.specs["caracteristicas_lista"] = rawFeatures.split("\n").map(l => l.trim()).filter(Boolean);

                // Date and Time tracking
                activeReportAsset.specs["ficha_fecha_hora"] = new Date().toLocaleString("es-PE");

                // Update or push to global state array
                const idx = AF.state.assets.findIndex(a => a.id === activeReportAsset.id);
                if (idx !== -1) {
                    AF.state.assets[idx] = activeReportAsset;
                } else {
                    AF.state.assets.push(activeReportAsset);
                }

                // Save to database & refresh catalog list
                AF.saveStore();
                
                // Return to table list view
                activeReportAsset = null;
                const wrapper = document.getElementById("report-document-wrapper");
                if (wrapper) wrapper.classList.add("hidden");
                
                const listContainer = document.getElementById("reports-list-container");
                if (listContainer) listContainer.classList.remove("hidden");
                
                const searchCard = document.querySelector(".search-card");
                if (searchCard) searchCard.classList.remove("hidden");

                const headerBackBtn = document.getElementById("btn-reports-header-back");
                if (headerBackBtn) headerBackBtn.classList.add("hidden");
                
                const btnPrint = document.getElementById("btn-print-sheet");
                if (btnPrint) btnPrint.setAttribute("disabled", "true");
                
                const searchInput = document.getElementById("report-asset-search");
                if (searchInput) searchInput.value = "";

                AF.renderReportsList();

                if (AF.renderCatalogTable) AF.renderCatalogTable();
                if (AF.renderDashboardMetrics) AF.renderDashboardMetrics();

                AF.showToast("Ficha técnica oficial guardada y actualizada en Supabase.", "success");
            });
        }

        // Live Font Size Preview adjustment
        const repFontSize = document.getElementById("rep-font-size");
        if (repFontSize) {
            repFontSize.addEventListener("change", (e) => {
                const officialFicha = document.querySelector(".official-ficha");
                if (officialFicha) {
                    officialFicha.style.setProperty('--ficha-font-size', `${e.target.value}px`);
                }
            });
        }

        // List View Renderer
        AF.renderReportsList = function() {
            const listBody = document.getElementById("table-reports-list-body");
            const countBadge = document.getElementById("reports-count-badge");
            
            if (!listBody) return;
            listBody.innerHTML = "";

            const assets = AF.state.assets || [];
            if (countBadge) countBadge.textContent = `${assets.length} Fichas`;

            if (assets.length === 0) {
                listBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 25px; color: var(--text-secondary);">No hay fichas técnicas registradas. Haz clic en 'Crear Ficha Técnica' para empezar.</td></tr>`;
                return;
            }

            assets.forEach(asset => {
                const tr = document.createElement("tr");
                
                let dateVal = "No registrada";
                if (asset.specs && asset.specs["ficha_fecha_hora"]) {
                    dateVal = asset.specs["ficha_fecha_hora"];
                }

                let respVal = "Almacén Central";
                if (asset.location && asset.location.responsible) {
                    respVal = asset.location.responsible;
                }

                tr.innerHTML = `
                    <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">${asset.code}</td>
                    <td style="padding: 12px 16px; color: var(--text-primary); border-bottom: 1px solid var(--border-color);">${asset.name}</td>
                    <td style="padding: 12px 16px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${asset.brand || '—'} / ${asset.model || '—'}</td>
                    <td style="padding: 12px 16px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${respVal}</td>
                    <td style="padding: 12px 16px; color: var(--text-secondary); border-bottom: 1px solid var(--border-color);">${dateVal}</td>
                    <td style="padding: 12px 16px; text-align: center; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; gap: 6px; justify-content: center;">
                            <button type="button" class="btn btn-xs btn-outline btn-edit-ficha" data-id="${asset.id}" style="padding: 4px 8px; font-size: 11px; height: auto;">
                                <i data-lucide="edit-2" style="width: 12px; height: 12px; margin-right: 4px;"></i> Editar
                            </button>
                            <button type="button" class="btn btn-xs btn-primary btn-print-ficha" data-id="${asset.id}" style="padding: 4px 8px; font-size: 11px; height: auto;">
                                <i data-lucide="printer" style="width: 12px; height: 12px; margin-right: 4px;"></i> Imprimir
                            </button>
                            <button type="button" class="btn btn-xs btn-danger btn-delete-ficha" data-id="${asset.id}" style="padding: 4px 8px; font-size: 11px; background: var(--danger); border-color: var(--danger); color: white; height: auto;">
                                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                            </button>
                        </div>
                    </td>
                `;
                listBody.appendChild(tr);
            });

            if (window.lucide) window.lucide.createIcons();

            // Bind list action buttons
            listBody.querySelectorAll(".btn-edit-ficha").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.getAttribute("data-id");
                    const ast = AF.state.assets.find(a => a.id === id);
                    if (ast) AF.loadReportDocument(ast);
                });
            });

            listBody.querySelectorAll(".btn-print-ficha").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.getAttribute("data-id");
                    const ast = AF.state.assets.find(a => a.id === id);
                    if (ast) {
                        AF.loadReportDocument(ast);
                        setTimeout(() => {
                            window.print();
                        }, 300);
                    }
                });
            });

            listBody.querySelectorAll(".btn-delete-ficha").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.getAttribute("data-id");
                    if (confirm("¿Estás seguro de que deseas eliminar este bien y su ficha técnica permanentemente?")) {
                        AF.state.assets = AF.state.assets.filter(a => a.id !== id);
                        AF.saveStore();
                        AF.renderReportsList();
                        if (AF.renderCatalogTable) AF.renderCatalogTable();
                        if (AF.renderDashboardMetrics) AF.renderDashboardMetrics();
                        AF.showToast("Ficha técnica y bien eliminados correctamente.", "success");
                    }
                });
            });
        };

        // Bind back buttons
        const goBackToList = () => {
            activeReportAsset = null;
            
            const wrapper = document.getElementById("report-document-wrapper");
            if (wrapper) wrapper.classList.add("hidden");
            
            const listContainer = document.getElementById("reports-list-container");
            if (listContainer) listContainer.classList.remove("hidden");
            
            const searchCard = document.querySelector(".search-card");
            if (searchCard) searchCard.classList.remove("hidden");

            const headerBackBtn = document.getElementById("btn-reports-header-back");
            if (headerBackBtn) headerBackBtn.classList.add("hidden");
            
            const btnPrint = document.getElementById("btn-print-sheet");
            if (btnPrint) btnPrint.setAttribute("disabled", "true");
            
            const searchInput = document.getElementById("report-asset-search");
            if (searchInput) searchInput.value = "";
            
            AF.renderReportsList();
        };

        const btnBackToReports = document.getElementById("btn-back-to-reports");
        if (btnBackToReports) {
            btnBackToReports.addEventListener("click", goBackToList);
        }

        const btnReportsHeaderBack = document.getElementById("btn-reports-header-back");
        if (btnReportsHeaderBack) {
            btnReportsHeaderBack.addEventListener("click", goBackToList);
        }

        // Render initially
        AF.renderReportsList();

        // Print Action
        if (btnPrintSheet) {
            btnPrintSheet.addEventListener("click", () => {
                if (activeReportAsset) {
                    window.print();
                }
            });
        }
    };

})(window.ActivoFlow);
