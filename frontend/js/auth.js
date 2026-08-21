/* ==========================================================================
   ActivoFlow - Authentication and User Registry Management
   ========================================================================== */

(function(AF) {
    AF.currentUser = null;

    AF.initAuth = async function() {
        const authOverlay = document.getElementById("auth-overlay");
        const formLogin = document.getElementById("form-login");
        const formRegister = document.getElementById("form-register");
        const btnGoogleLogin = document.getElementById("btn-google-login-juliaca");
        const panelLogin = document.getElementById("panel-login");
        const panelRegister = document.getElementById("panel-register");
        const linkGotoLogin = document.getElementById("link-goto-login-juliaca");
        const btnGotoRegisterJuliaca = document.getElementById("btn-goto-register-juliaca");
        const btnCancelRegisterJuliaca = document.getElementById("btn-cancel-register-juliaca");

        // Prevent default form submissions immediately
        if (formLogin) {
            formLogin.addEventListener("submit", (e) => e.preventDefault());
        }
        if (formRegister) {
            formRegister.addEventListener("submit", (e) => e.preventDefault());
        }

        // Panel Switch Navigation
        if (btnGotoRegisterJuliaca) {
            btnGotoRegisterJuliaca.addEventListener("click", (e) => {
                e.preventDefault();
                panelLogin.classList.add("hidden");
                panelRegister.classList.remove("hidden");
                const errBanner = document.getElementById("juliaca-error-banner");
                if (errBanner) errBanner.classList.add("hidden");
            });
        }

        if (btnCancelRegisterJuliaca) {
            btnCancelRegisterJuliaca.addEventListener("click", (e) => {
                e.preventDefault();
                panelLogin.classList.remove("hidden");
                panelRegister.classList.add("hidden");
                const errBanner = document.getElementById("juliaca-error-banner");
                if (errBanner) errBanner.classList.add("hidden");
            });
        }

        if (linkGotoLogin) {
            linkGotoLogin.addEventListener("click", (e) => {
                e.preventDefault();
                panelLogin.classList.remove("hidden");
                panelRegister.classList.add("hidden");
                
                // Hide any visible error banner
                const errBanner = document.getElementById("juliaca-error-banner");
                if (errBanner) errBanner.classList.add("hidden");
            });
        }

        // Initialize state's local usuarios list if not populated
        if (!AF.state) AF.state = {};
        if (!AF.state.usuarios) AF.state.usuarios = [];

        // Check if there is already an offline active user session in localStorage
        const localSession = localStorage.getItem("activoflow_local_session");
        if (localSession) {
            try {
                const user = JSON.parse(localSession);
                handleUserSignIn(user);
            } catch (e) {
                console.error("Local session corrupted:", e);
            }
        }

        // Check for Backend connection initialization
        let checkCount = 0;
        const checkBackendInterval = setInterval(() => {
            if (AF.useBackend) {
                clearInterval(checkBackendInterval);
                setupServerAuth();
            } else {
                checkCount++;
                if (checkCount > 10) {
                    clearInterval(checkBackendInterval);
                    console.log("Servidor backend no responde o modo offline. Operando en modo Local/Offline.");
                    setupLocalAuth();
                }
            }
        }, 300);

        // Helper to check if a user is already registered online/offline
        async function checkIfUserExists(email) {
            // First check local list
            const localExists = AF.state.usuarios.some(u => 
                u.email.toLowerCase() === email.toLowerCase() || 
                (u.name && u.name.toLowerCase() === email.toLowerCase())
            );
            if (localExists) return true;

            // Check default developer credentials
            if (email.toLowerCase() === "vaidrollteam") return true;

            return false;
        }


        // Unify the submit event listener so it's bound immediately
        if (formLogin) {
            formLogin.addEventListener("submit", async (e) => {
                e.preventDefault();
                const email = document.getElementById("login-email").value.trim();
                const password = document.getElementById("login-password").value;
                const errBanner = document.getElementById("juliaca-error-banner");
                if (errBanner) errBanner.classList.add("hidden");

                AF.showToast("Validando usuario...", "info");

                // Check user existence
                const userExists = await checkIfUserExists(email);
                if (!userExists) {
                    AF.showToast("El usuario no existe. Redirigiendo a registro...", "warning");
                    setTimeout(() => {
                        const regEmail = document.getElementById("reg-email");
                        if (regEmail) regEmail.value = email;
                        
                        panelLogin.classList.add("hidden");
                        panelRegister.classList.remove("hidden");
                    }, 1200);
                    return;
                }

                // If backend is supported and we're not falling back to offline yet
                if (AF.useBackend) {
                    try {
                        const res = await fetch("/api/auth/login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email, password })
                        });
                        if (res.ok) {
                            const result = await res.json();
                            AF.showToast("Acceso correcto.", "success");
                            localStorage.setItem("activoflow_local_session", JSON.stringify(result.user));
                            handleUserSignIn(result.user);
                        } else {
                            const errData = await res.json();
                            if (errBanner) errBanner.classList.remove("hidden");
                            AF.showToast(errData.error || "Contraseña incorrecta", "danger");
                        }
                    } catch (err) {
                        console.error("Error logging in via server:", err);
                        AF.showToast("Error de servidor. Intentando acceso local...", "warning");
                        // Fallback to offline login if server fetch failed
                        const success = tryOfflineLogin(email, password);
                        if (!success) {
                            if (errBanner) errBanner.classList.remove("hidden");
                            AF.showToast("Usuario o contraseña incorrectos.", "danger");
                        }
                    }
                } else {
                    // Local offline login
                    const success = tryOfflineLogin(email, password);
                    if (!success) {
                        if (errBanner) errBanner.classList.remove("hidden");
                        AF.showToast("Usuario o contraseña incorrectos.", "danger");
                    }
                }
            });
        }

        // Server Backend Local Auth Handlers
        function setupServerAuth() {
            // Check active session
            if (localSession) {
                try {
                    const user = JSON.parse(localSession);
                    handleUserSignIn(user);
                } catch (e) {
                    console.error("Local session corrupted:", e);
                }
            } else {
                if (authOverlay) authOverlay.classList.remove("hidden");
            }

            // Google OAuth Sign In is not supported locally
            if (btnGoogleLogin) {
                btnGoogleLogin.addEventListener("click", (e) => {
                    e.preventDefault();
                    AF.showToast("El inicio de sesión de Google no está disponible en el servidor local.", "warning");
                });
            }
        }

        // Local Auth Handlers (Offline fallback)
        function setupLocalAuth() {
            // Google Login is not supported in Local/Offline mode
            if (btnGoogleLogin) {
                btnGoogleLogin.addEventListener("click", (e) => {
                    e.preventDefault();
                    AF.showToast("El inicio de sesión de Google requiere conexión a Internet.", "warning");
                });
            }
        }

        if (formRegister) {
            formRegister.addEventListener("submit", async (e) => {
                e.preventDefault();
                const name = document.getElementById("reg-name").value.trim();
                const email = document.getElementById("reg-email").value.trim();
                const password = document.getElementById("reg-password").value;
                const role = document.getElementById("reg-role").value;

                // Ensure user is not already registered in local cache
                const exists = AF.state.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (exists || email.toLowerCase() === "vaidrollteam") {
                    AF.showToast("Este usuario ya está registrado.", "danger");
                    return;
                }

                AF.showToast("Registrando usuario...", "info");

                if (AF.useBackend) {
                    try {
                        const res = await fetch("/api/auth/register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name, email, password, role })
                        });

                        if (res.ok) {
                            AF.showToast("Cuenta de usuario registrada.", "success");
                            // Recargar usuarios desde el servidor
                            const stateRes = await fetch("/api/state");
                            if (stateRes.ok) {
                                const stateResult = await stateRes.json();
                                if (stateResult.success && stateResult.data) {
                                    AF.state = stateResult.data;
                                    localStorage.setItem("activoflow_state", JSON.stringify(AF.state));
                                }
                            }
                            if (linkGotoLogin) linkGotoLogin.click();
                        } else {
                            const errData = await res.json();
                            AF.showToast("Error de registro: " + errData.error, "danger");
                        }
                    } catch (err) {
                        console.error("Error registering user via server:", err);
                        AF.showToast("Error de conexión. Registrando localmente...", "warning");
                        registerLocally(name, email, password, role);
                    }
                } else {
                    registerLocally(name, email, password, role);
                }
            });
        }

        function registerLocally(name, email, password, role) {
            const newUser = {
                id: "local_" + Date.now(),
                email: email,
                name: name,
                role: role,
                password: password,
                created_at: new Date().toISOString(),
                active: 1
            };

            AF.state.usuarios.push(newUser);
            localStorage.setItem("activoflow_state", JSON.stringify(AF.state));
            AF.showToast("Cuenta registrada con éxito localmente.", "success");
            
            // Switch to login form
            if (linkGotoLogin) linkGotoLogin.click();
        }

        // Helper to validate offline credentials
        function tryOfflineLogin(email, password) {
            // Check default user credentials requested: VaidrollTeam / 123
            const isDefaultUser = (email.toLowerCase() === "vaidrollteam" && password === "123");
            const localUser = AF.state.usuarios.find(u => 
                (u.email.toLowerCase() === email.toLowerCase() || u.name.toLowerCase() === email.toLowerCase()) && 
                u.password === password
            );

            if (localUser && localUser.active === 0) {
                AF.showToast("El usuario está desactivado y no puede acceder al sistema.", "danger");
                return false;
            }

            if (isDefaultUser || localUser) {
                const sessionUser = localUser || {
                    id: "local_default",
                    email: "vaidrollteam@munisanroman.gob.pe",
                    name: "VaidrollTeam",
                    role: "Administrador",
                    created_at: new Date().toISOString(),
                    active: 1
                };
                
                // Save offline session in localStorage
                localStorage.setItem("activoflow_local_session", JSON.stringify(sessionUser));
                
                // Add to local usuarios array if missing (so they appear on users list)
                const alreadyRegistered = AF.state.usuarios.some(u => u.id === sessionUser.id);
                if (!alreadyRegistered) {
                    AF.state.usuarios.push(sessionUser);
                    localStorage.setItem("activoflow_state", JSON.stringify(AF.state));
                }

                handleUserSignIn(sessionUser);
                return true;
            }
            return false;
        }

        // Common handler to update UI upon successful sign-in
        async function handleUserSignIn(user) {
            AF.currentUser = user;
            let profileName = user.name || "Administrador";

            // Hide auth overlay
            if (authOverlay) authOverlay.classList.add("hidden");

            // Update user details in header panel
            const avatar = document.getElementById("user-avatar-img");
            const nameEl = document.getElementById("display-user-name");
            const roleEl = document.getElementById("display-user-role");

            if (nameEl) nameEl.textContent = profileName;
            if (roleEl) roleEl.textContent = user.role || "Administrador";
            if (avatar) {
                const initials = profileName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
                avatar.textContent = initials || "AD";
            }

            // Refresh user tables & indicators
            if (AF.renderUsersTable) AF.renderUsersTable();

            // Redirect to dashboard by default
            const btnNavDashboard = document.querySelector('.menu-item[data-target="dashboard"]');
            if (btnNavDashboard) {
                btnNavDashboard.click();
            }
        }
    };

    // Check if the current user session is still active
    AF.checkActiveSessionStatus = function() {
        const localSession = localStorage.getItem("activoflow_local_session");
        if (localSession) {
            try {
                const user = JSON.parse(localSession);
                if (AF.state && AF.state.usuarios) {
                    const dbUser = AF.state.usuarios.find(u => u.id === user.id);
                    if (dbUser && dbUser.active === 0) {
                        AF.showToast("Tu cuenta ha sido desactivada por un administrador.", "danger");
                        setTimeout(() => {
                            localStorage.removeItem("activoflow_local_session");
                            window.location.reload();
                        }, 1500);
                    }
                }
            } catch (e) {
                console.error("Error validating session status:", e);
            }
        }
    };

    // Logout Helper
    AF.logout = async function() {
        AF.showToast("Cerrando sesión...", "info");
        // Force clean local storage sessions and tokens
        localStorage.removeItem("activoflow_local_session");
        window.location.reload();
    };

    // Render registered users inside section-users
    AF.renderUsersTable = async function() {
        const tableBody = document.getElementById("table-users-body");
        if (!tableBody) return;
        tableBody.innerHTML = "";

        let users = [];

        // Check if we have users loaded in state (either from SQLite or local storage)
        if (AF.state && AF.state.usuarios) {
            users = AF.state.usuarios;
        }

        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 25px; color: var(--text-secondary);">No hay usuarios registrados.</td></tr>`;
            return;
        }

        // Determine if current user is maximum administrator
        const currentIsAdmin = AF.currentUser && AF.currentUser.role && AF.currentUser.role.toLowerCase() === 'administrador';

        users.forEach(u => {
            const tr = document.createElement("tr");
            const dateVal = u.created_at ? new Date(u.created_at).toLocaleString("es-PE") : "No disponible";
            const initials = u.name ? u.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "US";

            const isActive = (u.active !== 0);
            const statusBadge = isActive 
                ? `<span class="badge" style="font-weight: 700; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 8px; border-radius: 4px; font-size: 11px;">Activo</span>`
                : `<span class="badge" style="font-weight: 700; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 8px; border-radius: 4px; font-size: 11px;">Desactivado</span>`;

            // Mask password and only show the eye toggle to the main administrator
            let passwordHtml = "";
            if (currentIsAdmin) {
                passwordHtml = `
                    <div style="display: inline-flex; align-items: center; gap: 6px;">
                        <span class="password-text" data-password="${u.password || ''}" data-revealed="false" style="font-family: monospace;">••••••</span>
                        <button type="button" class="btn-toggle-password" style="background: none; border: none; padding: 2px; margin-left: 2px; cursor: pointer; color: var(--text-secondary); display: inline-flex; align-items: center;" title="Mostrar/Ocultar contraseña">
                            <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                `;
            } else {
                passwordHtml = `<span style="font-family: monospace;">••••••</span>`;
            }

            let actionBtnHtml = "";
            const isCurrentUser = (AF.currentUser && AF.currentUser.id === u.id);
            const isDefaultAdmin = (u.id === 'local_default');

            // Render Role dropdown for admins for ALL users
            let roleHtml = "";
            if (currentIsAdmin) {
                roleHtml = `
                    <div style="width: 120px;">
                        <select class="select-user-role" data-id="${u.id}" data-original-val="${u.role || 'Administrador'}" style="width: 100%; padding: 4px 8px; font-size: 12px; border: 1px solid var(--border-color); background: var(--bg-app); color: var(--text-primary); border-radius: var(--radius-sm); cursor: pointer; outline: none;">
                            <option value="Operador" ${u.role === 'Operador' ? 'selected' : ''}>Operador</option>
                            <option value="Administrador" ${u.role === 'Administrador' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                `;
            } else {
                roleHtml = `<span class="badge badge-primary" style="font-weight: 700;">${u.role || 'Administrador'}</span>`;
            }

            if (isCurrentUser) {
                actionBtnHtml = `<span style="font-size: 11px; color: var(--text-secondary); font-style: italic;">Sesión Activa</span>`;
            } else if (isDefaultAdmin) {
                actionBtnHtml = `<span style="font-size: 11px; color: var(--text-secondary); font-style: italic;">Sistema</span>`;
            } else {
                const btnColor = isActive ? '#ef4444' : '#10b981';
                const btnText = isActive ? 'Desactivar' : 'Activar';
                const btnClass = isActive ? 'btn-deactivate-user' : 'btn-activate-user';
                actionBtnHtml = `
                    <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                        <button type="button" class="btn btn-outline btn-xs ${btnClass}" data-id="${u.id}" data-active="${isActive ? 'false' : 'true'}" style="padding: 4px 8px; font-size: 11px; height: auto; color: ${btnColor}; border-color: ${btnColor}40; background: transparent; cursor: pointer;">
                            ${btnText}
                        </button>
                        <button type="button" class="btn btn-outline btn-xs btn-delete-user" data-id="${u.id}" style="padding: 4px 8px; font-size: 11px; height: auto; color: #f43f5e; border-color: #f43f5e40; background: transparent; cursor: pointer;">
                            Eliminar
                        </button>
                    </div>
                `;
            }

            tr.innerHTML = `
                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="user-avatar" style="width: 32px; height: 32px; font-size: 11px; font-weight:700; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${initials}</div>
                        <div>
                            <strong style="color: var(--text-primary); font-size: 13px;">${u.name}</strong>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 13px;">${u.email}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 13px;">${passwordHtml}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-size: 12px;">
                    ${roleHtml}
                </td>
                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); font-size: 12px;">
                    ${statusBadge}
                </td>
                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); font-size: 12px;">${dateVal}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: center;">
                    ${actionBtnHtml}
                </td>
            `;

            tableBody.appendChild(tr);
        });

        // Initialize Lucide icons on render
        if (window.lucide) window.lucide.createIcons();

        // Bind click actions to toggle password visibility
        if (currentIsAdmin) {
            tableBody.querySelectorAll(".btn-toggle-password").forEach(btn => {
                btn.addEventListener("click", () => {
                    const textEl = btn.previousElementSibling;
                    if (!textEl) return;
                    
                    const isRevealed = textEl.getAttribute("data-revealed") === "true";
                    const realPassword = textEl.getAttribute("data-password");
                    const iconEl = btn.querySelector("i");
                    
                    if (isRevealed) {
                        textEl.textContent = "••••••";
                        textEl.setAttribute("data-revealed", "false");
                        if (iconEl) {
                            iconEl.setAttribute("data-lucide", "eye");
                        }
                    } else {
                        textEl.textContent = realPassword || '---';
                        textEl.setAttribute("data-revealed", "true");
                        if (iconEl) {
                            iconEl.setAttribute("data-lucide", "eye-off");
                        }
                    }
                    if (window.lucide) window.lucide.createIcons();
                });
            });
        }

        // Bind change action for user role select
        if (currentIsAdmin) {
            tableBody.querySelectorAll(".select-user-role").forEach(select => {
                select.addEventListener("change", async () => {
                    const userId = select.getAttribute("data-id");
                    const newRole = select.value;
                    const originalRole = select.getAttribute("data-original-val");

                    try {
                        if (AF.useBackend) {
                            const res = await fetch("/api/auth/users/update-role", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ userId, role: newRole })
                            });

                            if (res.ok) {
                                AF.showToast(`Rol de usuario actualizado a ${newRole} correctamente.`, "success");
                                if (AF.initStore) {
                                    await AF.initStore();
                                }
                                AF.renderUsersTable();
                            } else {
                                const err = await res.json();
                                AF.showToast(err.error || "Error al cambiar rol del usuario.", "danger");
                                select.value = originalRole; // rollback
                            }
                        } else {
                            // Local/offline fallback
                            const idx = AF.state.usuarios.findIndex(user => user.id === userId);
                            if (idx !== -1) {
                                AF.state.usuarios[idx].role = newRole;
                                localStorage.setItem("activoflow_state", JSON.stringify(AF.state));
                                AF.showToast(`Rol de usuario actualizado a ${newRole} localmente.`, "success");
                                AF.renderUsersTable();
                            }
                        }
                    } catch (err) {
                        console.error("Error updating user role:", err);
                        AF.showToast("Error de conexión al actualizar rol.", "danger");
                        select.value = originalRole; // rollback
                    }
                });
            });
        }

        // Bind click actions to toggle status
        tableBody.querySelectorAll(".btn-deactivate-user, .btn-activate-user").forEach(btn => {
            btn.addEventListener("click", async () => {
                const userId = btn.getAttribute("data-id");
                const newActiveState = btn.getAttribute("data-active") === "true";
                const actionText = newActiveState ? "activar" : "desactivar";

                if (confirm(`¿Estás seguro de que deseas ${actionText} a este usuario?`)) {
                    try {
                        if (AF.useBackend) {
                            const res = await fetch("/api/auth/users/toggle-status", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ userId, active: newActiveState })
                            });

                            if (res.ok) {
                                AF.showToast(`Usuario ${newActiveState ? 'activado' : 'desactivado'} correctamente.`, "success");
                                // Refresh initial state to fetch updated users
                                if (AF.initStore) {
                                    await AF.initStore();
                                }
                                AF.renderUsersTable();
                            } else {
                                const err = await res.json();
                                AF.showToast(err.error || "Error al cambiar estado de usuario.", "danger");
                            }
                        } else {
                            // Local/offline fallback
                            const idx = AF.state.usuarios.findIndex(user => user.id === userId);
                            if (idx !== -1) {
                                AF.state.usuarios[idx].active = newActiveState ? 1 : 0;
                                localStorage.setItem("activoflow_state", JSON.stringify(AF.state));
                                AF.showToast(`Usuario ${newActiveState ? 'activado' : 'desactivado'} localmente.`, "success");
                                AF.renderUsersTable();
                            }
                        }
                    } catch (err) {
                        console.error("Error toggling user status:", err);
                        AF.showToast("Error de conexión al cambiar estado.", "danger");
                    }
                }
            });
        });

        // Bind click actions to delete user
        tableBody.querySelectorAll(".btn-delete-user").forEach(btn => {
            btn.addEventListener("click", async () => {
                const userId = btn.getAttribute("data-id");

                if (confirm("¿Estás seguro de que deseas eliminar permanentemente a este usuario?")) {
                    try {
                        if (AF.useBackend) {
                            const res = await fetch("/api/auth/users/delete", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ userId })
                            });

                            if (res.ok) {
                                AF.showToast("Usuario eliminado correctamente.", "success");
                                if (AF.initStore) {
                                    await AF.initStore();
                                }
                                AF.renderUsersTable();
                            } else {
                                const err = await res.json();
                                AF.showToast(err.error || "Error al eliminar usuario.", "danger");
                            }
                        } else {
                            // Local/offline fallback
                            const idx = AF.state.usuarios.findIndex(user => user.id === userId);
                            if (idx !== -1) {
                                AF.state.usuarios.splice(idx, 1);
                                localStorage.setItem("activoflow_state", JSON.stringify(AF.state));
                                AF.showToast("Usuario eliminado localmente.", "success");
                                AF.renderUsersTable();
                            }
                        }
                    } catch (err) {
                        console.error("Error deleting user:", err);
                        AF.showToast("Error de conexión al eliminar usuario.", "danger");
                    }
                }
            });
        });
    };

})(window.ActivoFlow);
