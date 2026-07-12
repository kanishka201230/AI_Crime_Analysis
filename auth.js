
const AegisAuth = (() => {
  const USERS_KEY = "aegis_users";
  const SESSION_KEY = "aegis_session_user";

  let users = [];

  // Default seeded admin credentials
  const defaultUsers = [
    {
      username: "miller",
      password: "secure123",
      fullname: "Det. Miller",
      badge: "DET-8821",
      role: "Lead Analyst"
    }
  ];

  /* ---- Storage Helpers ---- */
  const loadUsers = () => {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      try { users = JSON.parse(stored); }
      catch (e) { users = [...defaultUsers]; saveUsers(); }
    } else {
      users = [...defaultUsers];
      saveUsers();
    }
  };

  const saveUsers = () => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  /* ---- DOM Profile Updater ---- */
  const updateProfileUI = (user) => {
    const nameEl  = document.getElementById("current-user-name");
    const roleEl  = document.getElementById("current-user-role");
    const badgeEl = document.getElementById("current-user-badge");
    if (nameEl)  nameEl.textContent  = user.fullname;
    if (roleEl)  roleEl.textContent  = user.role;
    if (badgeEl) badgeEl.textContent = `Badge: #${user.badge}`;
  };

  /* ---- Screen Switchers ---- */
  const showApp = () => {
    document.getElementById("login-wrapper").style.display  = "none";
    const app = document.querySelector(".app-container");
    app.style.display   = "flex";
    app.classList.add("app-fade-in");
  };

  const showLogin = () => {
    const app = document.querySelector(".app-container");
    if (app) app.style.display = "none";
    const lw = document.getElementById("login-wrapper");
    if (lw) lw.style.display = "flex";
    bindForms();
  };

  /* ---- Security Scan Animation ---- */
  const runScan = (type, user, onComplete) => {
    const formBox = document.getElementById("auth-form-container");
    const scanBox = document.getElementById("auth-scanning-container");
    const console_ = document.getElementById("scan-console-text");

    if (!formBox || !scanBox || !console_) { onComplete(); return; }

    formBox.style.display = "none";
    scanBox.style.display = "flex";
    console_.innerHTML    = "";

    const steps = type === "login" ? [
      "Establishing encrypted terminal channel...",
      "Reading badge credentials hash...",
      "Matching cryptographic signature...",
      "Verifying security clearance level...",
      "✔ Access granted. Welcome, Operator."
    ] : [
      "Generating employee badge token...",
      "Writing encrypted credentials to registry...",
      "Assigning department clearance roles...",
      "✔ Registration complete. Access granted."
    ];

    let i = 0;
    const print = () => {
      if (i < steps.length) {
        const line = document.createElement("div");
        line.className = "console-line";
        const isLast = i === steps.length - 1;
        line.innerHTML = `<span class="console-prompt ${isLast ? 'success' : ''}">&gt;</span> ${steps[i]}`;
        console_.appendChild(line);
        console_.scrollTop = console_.scrollHeight;
        i++;
        setTimeout(print, 400);
      } else {
        setTimeout(onComplete, 500);
      }
    };
    print();
  };

  /* ---- Error / Success Message Helpers ---- */
  const showError = (id, msg) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = "alert-msg error-msg";
    el.style.display = "block";
  };

  const clearErrors = () => {
    document.querySelectorAll(".alert-msg").forEach(el => {
      el.textContent = "";
      el.style.display = "none";
    });
  };

  /* ---- Form Binding ---- */
  const bindForms = () => {
    /* Tab switching */
    const tabLogin  = document.getElementById("tab-login");
    const tabSignup = document.getElementById("tab-signup");
    const loginForm = document.getElementById("login-form-block");
    const regForm   = document.getElementById("signup-form-block");

    tabLogin?.addEventListener("click", () => {
      tabLogin.classList.add("active");   tabSignup.classList.remove("active");
      loginForm.classList.add("active");  regForm.classList.remove("active");
      clearErrors();
    });

    tabSignup?.addEventListener("click", () => {
      tabSignup.classList.add("active");  tabLogin.classList.remove("active");
      regForm.classList.add("active");    loginForm.classList.remove("active");
      clearErrors();
    });

    /* Login submit */
    document.getElementById("btn-login-submit")?.addEventListener("click", (e) => {
      e.preventDefault();
      const uVal = document.getElementById("login-username").value.trim().toLowerCase();
      const pVal = document.getElementById("login-password").value;

      if (!uVal || !pVal) { showError("login-error-msg", "Username and password are required."); return; }

      const match = users.find(u => u.username === uVal && u.password === pVal);
      if (!match) { showError("login-error-msg", "❌ Access Denied: Invalid credentials or clearance level."); return; }

      runScan("login", match, () => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(match));
        updateProfileUI(match);
        showApp();
        document.dispatchEvent(new CustomEvent("aegisAuthSuccess"));
      });
    });

    /* Signup submit */
    document.getElementById("btn-signup-submit")?.addEventListener("click", (e) => {
      e.preventDefault();
      const fullname = document.getElementById("signup-name").value.trim();
      const badge    = document.getElementById("signup-badge").value.trim().toUpperCase();
      const role     = document.getElementById("signup-role").value;
      const username = document.getElementById("signup-username").value.trim().toLowerCase();
      const password = document.getElementById("signup-password").value;

      if (!fullname || !badge || !role || !username || !password) {
        showError("signup-error-msg", "All fields are required to register access.");
        return;
      }
      if (!/^[a-z0-9_]{3,15}$/.test(username)) {
        showError("signup-error-msg", "Username: 3-15 alphanumeric characters or underscores only.");
        return;
      }
      if (password.length < 5) {
        showError("signup-error-msg", "Password must be at least 5 characters.");
        return;
      }
      if (users.some(u => u.username === username)) {
        showError("signup-error-msg", "Username already exists in the department registry.");
        return;
      }
      if (users.some(u => u.badge === badge)) {
        showError("signup-error-msg", "Badge ID already registered to another account.");
        return;
      }

      const newUser = { username, password, fullname, badge, role };
      users.push(newUser);
      saveUsers();

      runScan("signup", newUser, () => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
        updateProfileUI(newUser);
        showApp();
        document.dispatchEvent(new CustomEvent("aegisAuthSuccess"));
      });
    });

    /* Enter key support on login form */
    ["login-username", "login-password"].forEach(id => {
      document.getElementById(id)?.addEventListener("keyup", (e) => {
        if (e.key === "Enter") document.getElementById("btn-login-submit")?.click();
      });
    });
  };

  /* ---- Public API ---- */
  return {
    init() {
      loadUsers();
      const sess = localStorage.getItem(SESSION_KEY);
      if (sess) {
        try {
          const user = JSON.parse(sess);
          updateProfileUI(user);
          showApp();
          return true; // already authenticated
        } catch (e) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      showLogin();
      return false; // needs login
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
      window.location.reload();
    },

    isAuthenticated() {
      return !!localStorage.getItem(SESSION_KEY);
    }
  };
})();
