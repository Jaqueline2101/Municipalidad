/* ==========================================================================
   ActivoFlow - Categories & Specifications Module
   ========================================================================== */

(function(AF) {
    AF.renderDynamicSpecInputs = function(category, existingSpecs = null) {
        const specsContainer = document.getElementById("dynamic-specs-container");
        if (!specsContainer) return;
        
        specsContainer.innerHTML = "";
        
        let defaults = {};
        if (category === "Hardware/TI") {
            defaults = { "Memoria RAM": "", "Almacenamiento": "", "Procesador": "", "Sistema Operativo": "" };
        } else if (category === "Infraestructura de Red") {
            defaults = { "Puertos": "", "Categoría de Cable": "", "Velocidad": "", "Administrable": "" };
        } else if (category === "Mobiliario") {
            defaults = { "Material": "", "Dimensiones": "", "Color": "", "Ajustable": "" };
        }

        const dataToRender = existingSpecs || defaults;

        Object.entries(dataToRender).forEach(([key, val]) => {
            AF.addSpecRow(key, val);
        });
    };

    AF.addSpecRow = function(key = "", val = "") {
        const specsContainer = document.getElementById("dynamic-specs-container");
        if (!specsContainer) return;

        const row = document.createElement("div");
        row.className = "spec-item-row";
        row.innerHTML = `
            <div class="form-group mb-0">
                <label>Parámetro</label>
                <input type="text" class="spec-key" value="${key}" placeholder="Ej: RAM, Material...">
            </div>
            <div class="form-group mb-0">
                <label>Valor / Detalle</label>
                <input type="text" class="spec-value" value="${val}" placeholder="Ej: 16GB, Madera...">
            </div>
            <button type="button" class="btn btn-danger btn-xs btn-delete-spec-row" style="margin-bottom: 10px;">
                &times;
            </button>
        `;
        specsContainer.appendChild(row);
        
        row.querySelector(".btn-delete-spec-row").addEventListener("click", () => {
            row.remove();
        });
    };

    // Initialize module event listeners
    AF.initCategories = function() {
        const assetCategorySelect = document.getElementById("asset-category");
        const btnAddCustomSpec = document.getElementById("btn-add-custom-spec");

        if (assetCategorySelect) {
            assetCategorySelect.addEventListener("change", (e) => {
                AF.renderDynamicSpecInputs(e.target.value);
            });
        }

        if (btnAddCustomSpec) {
            btnAddCustomSpec.addEventListener("click", () => {
                AF.addSpecRow();
            });
        }
    };

})(window.ActivoFlow);
