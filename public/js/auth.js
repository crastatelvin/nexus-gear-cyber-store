// NEXUS GEAR Auth Module

const authModule = {
  user: null,

  async checkSession() {
    try {
      this.user = await window.api.auth.me();
      this.updateUI();
      return this.user;
    } catch (err) {
      this.user = null;
      this.updateUI();
      return null;
    }
  },

  async login(email, password) {
    try {
      const errorEl = document.getElementById('login-error');
      if (errorEl) errorEl.classList.add('hidden');

      const user = await window.api.auth.login(email, password);
      this.user = user;
      this.updateUI();
      this.toggleModal(false);
      showToast('success', `Welcome back, Operative ${user.username}!`);
      
      // Redirect if current route requires authentication or if we are on login screen
      if (window.location.hash === '#/checkout' || window.location.hash === '#/profile') {
        window.location.reload(); // Reload to refresh active view context
      } else {
        window.location.hash = '#/profile';
      }
    } catch (err) {
      const errorEl = document.getElementById('login-error');
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
      showToast('error', `Login failed: ${err.message}`);
    }
  },

  async register(username, email, password) {
    try {
      const errorEl = document.getElementById('register-error');
      if (errorEl) errorEl.classList.add('hidden');

      const user = await window.api.auth.register(username, email, password);
      this.user = user;
      this.updateUI();
      this.toggleModal(false);
      showToast('success', `Profile provisioned. Welcome, Operative ${user.username}!`);
      window.location.hash = '#/profile';
    } catch (err) {
      const errorEl = document.getElementById('register-error');
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
      showToast('error', `Registration failed: ${err.message}`);
    }
  },

  async logout() {
    try {
      await window.api.auth.logout();
      showToast('info', 'Session terminated. Access revoked.');
      this.user = null;
      this.updateUI();
      window.location.hash = '#/';
    } catch (err) {
      showToast('error', 'Failed to close session properly.');
    }
  },

  updateUI() {
    const container = document.getElementById('auth-nav-container');
    if (!container) return;

    if (this.user) {
      // If user is admin, show a specific badge or add indicator
      const isAdmin = this.user.role === 'admin';
      container.innerHTML = `
        <div class="user-profile-nav" id="nav-profile-link">
          <i data-lucide="${isAdmin ? 'shield-check' : 'user'}"></i>
          <span>${this.user.username}</span>
          ${isAdmin ? '<span class="profile-role-tag" style="margin-top:0;font-size:0.6rem;padding:1px 4px;">ADMIN</span>' : ''}
        </div>
      `;

      document.getElementById('nav-profile-link').addEventListener('click', () => {
        window.location.hash = '#/profile';
      });
    } else {
      container.innerHTML = `
        <button id="nav-login-btn" class="btn btn-outline btn-sm">
          <i data-lucide="log-in"></i><span>Sign In</span>
        </button>
      `;

      document.getElementById('nav-login-btn').addEventListener('click', () => {
        this.toggleModal(true, 'login');
      });
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  toggleModal(show, view = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    if (show) {
      modal.classList.add('active');
      this.switchView(view);
    } else {
      modal.classList.remove('active');
      // Clear forms
      document.getElementById('login-form').reset();
      document.getElementById('register-form').reset();
      document.getElementById('login-error').classList.add('hidden');
      document.getElementById('register-error').classList.add('hidden');
    }
  },

  switchView(view) {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');

    if (view === 'login') {
      loginView.classList.remove('hidden');
      registerView.classList.add('hidden');
    } else {
      loginView.classList.add('hidden');
      registerView.classList.remove('hidden');
    }
  },

  init() {
    // Auth trigger listeners
    const closeBtn = document.getElementById('auth-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggleModal(false));

    const switchReg = document.getElementById('switch-to-register');
    const switchLog = document.getElementById('switch-to-login');

    if (switchReg) switchReg.addEventListener('click', (e) => { e.preventDefault(); this.switchView('register'); });
    if (switchLog) switchLog.addEventListener('click', (e) => { e.preventDefault(); this.switchView('login'); });

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        this.login(email, pass);
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const pass = document.getElementById('register-password').value;
        this.register(user, email, pass);
      });
    }

    this.checkSession();
  }
};

window.authModule = authModule;
