// NEXUS GEAR Main SPA Orchestrator and Router

// Global Toast Notification Helper
window.showToast = function(type, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'warning') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);
  
  if (window.lucide) {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
};

// State trackers for product listings
let currentCategory = '';
let searchTimeout = null;

// ==========================================================================
// SPA ROUTER
// ==========================================================================

async function handleRoute() {
  const hash = window.location.hash || '#/';
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Clear modal states and cart drawers on navigation
  document.getElementById('product-modal').classList.remove('active');
  window.cartModule.toggle(false);

  const path = hash.slice(1); // Strip the leading '#'

  // Simple routing matcher
  if (path === '/' || path === '') {
    await renderHomeView(mainContent);
  } else if (path === '/checkout') {
    await renderCheckoutView(mainContent);
  } else if (path === '/profile') {
    await renderProfileView(mainContent);
  } else {
    mainContent.innerHTML = `
      <div class="glass-panel text-center" style="padding: 64px 20px; text-align: center;">
        <i data-lucide="compass" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom:16px;"></i>
        <h2>Vector Not Found (404)</h2>
        <p class="mt-2 text-secondary">The requested system pathway is not active or accessible.</p>
        <a href="#/" class="btn btn-primary mt-6">Return to Grid</a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

// ==========================================================================
// VIEW 1: HOME (PRODUCT GALLERY)
// ==========================================================================

async function renderHomeView(container) {
  // Setup search bar and filters
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  
  if (searchInput) {
    searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
  }

  container.innerHTML = `
    <!-- Hero Section -->
    <section class="shop-hero glass-panel">
      <div class="hero-tagline">Authorized Supply Terminal</div>
      <h1>GEAR UP FOR THE <span class="accent-text">NEXT AGE</span></h1>
      <p class="hero-description">Equip yourself with premium neural interfaces, advanced bio-wearables, quantum drives, and custom cybernetic accessories.</p>
    </section>

    <!-- Product Grid -->
    <section class="products-grid" id="home-products-grid">
      <div style="grid-column: 1/-1; text-align: center; padding: 48px;">
        <p class="text-secondary">Syncing with store database...</p>
      </div>
    </section>
  `;

  await loadProducts();
}

async function loadProducts(searchQuery = '') {
  const grid = document.getElementById('home-products-grid');
  if (!grid) return;

  try {
    const products = await window.api.products.getAll(currentCategory, searchQuery);
    
    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-shop-state">
          <i data-lucide="search-code"></i>
          <h3>No Equipment Detected</h3>
          <p class="mt-2">Refine your search parameters or query filters.</p>
        </div>
      `;
    } else {
      grid.innerHTML = products.map(prod => {
        const isOutOfStock = prod.stock <= 0;
        const isLowStock = prod.stock > 0 && prod.stock <= 5;
        
        let stockHtml = `<span class="stock-status stock-ok"><i data-lucide="package"></i> In Stock (${prod.stock})</span>`;
        if (isOutOfStock) {
          stockHtml = `<span class="stock-status stock-out"><i data-lucide="package-x"></i> Depleted</span>`;
        } else if (isLowStock) {
          stockHtml = `<span class="stock-status stock-low"><i data-lucide="package-open"></i> Critical Stock (${prod.stock})</span>`;
        }

        return `
          <div class="product-card glass-panel">
            <div class="product-image-container">
              <img src="${prod.image_url}" alt="${prod.name}" class="product-image">
              <span class="product-category-tag">${prod.category}</span>
              <div class="product-details-btn-overlay">
                <button class="btn btn-outline btn-sm view-details-btn" data-id="${prod.id}">
                  <i data-lucide="eye"></i> Inspect Item
                </button>
              </div>
            </div>
            <div class="product-card-body">
              <h3 class="product-title">${prod.name}</h3>
              <p class="product-desc-excerpt">${prod.description}</p>
              <div class="product-card-footer">
                <div>
                  <div class="product-price">$${prod.price.toFixed(2)}</div>
                  <div class="mt-1">${stockHtml}</div>
                </div>
                <button class="btn btn-primary btn-sm quick-add-btn" data-id="${prod.id}" ${isOutOfStock ? 'disabled' : ''}>
                  <i data-lucide="shopping-cart"></i> Add
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Attach Action Listeners
    document.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', () => openProductModal(parseInt(btn.dataset.id)));
    });

    document.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const prod = products.find(p => p.id === id);
        if (prod) {
          window.cartModule.add(prod, 1);
        }
      });
    });

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-shop-state" style="color:var(--error);">
        <i data-lucide="server-crash" style="color:var(--error);"></i>
        <h3>Connection Failure</h3>
        <p class="mt-2">Could not retrieve stock list from the core node.</p>
      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

// ==========================================================================
// VIEW 2: PRODUCT DETAIL MODAL
// ==========================================================================

async function openProductModal(productId) {
  const modal = document.getElementById('product-modal');
  const content = document.getElementById('product-modal-content');
  if (!modal || !content) return;

  content.innerHTML = `<p class="text-center text-secondary">Loading item specs...</p>`;
  modal.classList.add('active');

  try {
    const prod = await window.api.products.getById(productId);
    
    const isOutOfStock = prod.stock <= 0;
    const isLowStock = prod.stock > 0 && prod.stock <= 5;
    
    let stockHtml = `<span class="stock-status stock-ok"><i data-lucide="package"></i> In Stock (${prod.stock} units)</span>`;
    if (isOutOfStock) {
      stockHtml = `<span class="stock-status stock-out"><i data-lucide="package-x"></i> Out of Stock</span>`;
    } else if (isLowStock) {
      stockHtml = `<span class="stock-status stock-low"><i data-lucide="package-open"></i> Critical Stock Alert (${prod.stock} left)</span>`;
    }

    // Render specs
    let specsHtml = '';
    if (prod.specs && Object.keys(prod.specs).length > 0) {
      specsHtml = `
        <div class="detail-specs-box">
          <h4>Technical Specifications</h4>
          <div class="specs-grid">
            ${Object.entries(prod.specs).map(([lbl, val]) => `
              <div class="spec-item">
                <span class="spec-label">${lbl}</span>
                <span class="spec-value">${val}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="product-detail-layout">
        <div class="detail-image-wrapper">
          <img src="${prod.image_url}" alt="${prod.name}" class="detail-image">
        </div>
        <div class="detail-info">
          <span class="detail-category">${prod.category}</span>
          <h2 class="detail-title">${prod.name}</h2>
          <div class="detail-price">$${prod.price.toFixed(2)}</div>
          <div class="mb-4">${stockHtml}</div>
          <p class="detail-desc">${prod.description}</p>
          
          ${specsHtml}

          <div class="mt-auto" style="display:flex; gap:16px; align-items:center;">
            ${!isOutOfStock ? `
              <div class="quantity-adjuster" style="height:42px;">
                <button class="qty-btn" id="modal-dec-qty"><i data-lucide="minus"></i></button>
                <span class="qty-val" id="modal-qty-val" style="width:40px; font-size:1rem;">1</span>
                <button class="qty-btn" id="modal-inc-qty"><i data-lucide="plus"></i></button>
              </div>
              <button class="btn btn-primary" id="modal-add-to-cart" style="flex:1; height:42px;">
                <i data-lucide="shopping-cart"></i> Add To Cart
              </button>
            ` : `
              <button class="btn btn-outline btn-block" disabled style="height:42px;">
                Equipment Depleted
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach quantity selector handlers
    if (!isOutOfStock) {
      let qty = 1;
      const qtyVal = document.getElementById('modal-qty-val');
      
      document.getElementById('modal-inc-qty').addEventListener('click', () => {
        if (qty < prod.stock) {
          qty++;
          qtyVal.textContent = qty;
        } else {
          showToast('warning', `Maximum stock limit (${prod.stock}) reached.`);
        }
      });

      document.getElementById('modal-dec-qty').addEventListener('click', () => {
        if (qty > 1) {
          qty--;
          qtyVal.textContent = qty;
        }
      });

      document.getElementById('modal-add-to-cart').addEventListener('click', () => {
        const added = window.cartModule.add(prod, qty);
        if (added) {
          modal.classList.remove('active');
        }
      });
    }

  } catch (err) {
    content.innerHTML = `<div class="error-msg">Failed to retrieve details: ${err.message}</div>`;
  }
}

// ==========================================================================
// VIEW 3: CHECKOUT PAGE
// ==========================================================================

async function renderCheckoutView(container) {
  // Ensure user is signed in
  if (!window.authModule.user) {
    container.innerHTML = `
      <div class="glass-panel text-center" style="padding: 64px 20px; text-align: center;">
        <i data-lucide="lock" style="width: 48px; height: 48px; color: var(--accent-magenta); margin-bottom:16px;"></i>
        <h2>Authentication Protocol Required</h2>
        <p class="mt-2 text-secondary">Sign in with your operative credentials to initialize the checkout terminal.</p>
        <button class="btn btn-primary mt-6" onclick="window.authModule.toggleModal(true, 'login')">
          Establish Connection
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const cartItems = window.cartModule.get();
  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="glass-panel text-center" style="padding: 64px 20px; text-align: center;">
        <i data-lucide="shopping-bag" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom:16px;"></i>
        <h2>Empty Checkout Buffer</h2>
        <p class="mt-2 text-secondary">Add items to your cart before entering the checkout queue.</p>
        <a href="#/" class="btn btn-primary mt-6">Browse Products</a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Draw Checkout Flow
  container.innerHTML = `
    <div class="checkout-grid">
      <!-- Shipping Form -->
      <div class="glass-panel checkout-card">
        <h2 class="checkout-section-title"><i data-lucide="truck"></i> Logistics Terminal</h2>
        <form id="checkout-order-form">
          <div class="form-group mb-4">
            <label for="shipping-name">Recipient Name</label>
            <input type="text" id="shipping-name" required placeholder="Operative Name" value="${window.authModule.user.username}">
          </div>
          <div class="form-group mb-4">
            <label for="shipping-address">Delivery Address (Physical Grid)</label>
            <textarea id="shipping-address" rows="3" required placeholder="Sector, Building, City, Country Coordinates"></textarea>
          </div>
          
          <div style="border-top: 1px solid var(--border-color); padding-top: 20px;" class="mt-6">
            <h3>Payment Protocol</h3>
            <p class="text-secondary" style="font-size: 0.8rem; margin-bottom: 16px;">
              Simulation Mode: Charges will be settled via test network credits.
            </p>
            <div class="form-group">
              <label for="credit-mock">Simulated Credit ID</label>
              <input type="text" id="credit-mock" disabled value="NEXUS-CREDIT-TEST-NET-2026">
            </div>
          </div>

          <div class="error-msg hidden mt-4" id="checkout-error"></div>
          
          <button type="submit" class="btn btn-primary btn-block mt-6" id="checkout-submit-btn">
            <span>Authorise Credits & Place Order</span><i data-lucide="credit-card"></i>
          </button>
        </form>
      </div>

      <!-- Summary -->
      <div class="glass-panel checkout-card">
        <h2 class="checkout-section-title"><i data-lucide="clipboard-list"></i> Bill of Lading</h2>
        <div class="checkout-summary-list">
          ${cartItems.map(item => `
            <div class="checkout-summary-item">
              <span class="summary-item-name">
                ${item.name} 
                <span class="summary-item-qty">x${item.quantity}</span>
              </span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <div class="summary-total-divider"></div>

        <div class="checkout-summary-item" style="font-weight: 700; font-size: 1.1rem;">
          <span>Total Credits</span>
          <span class="accent-text" style="font-size:1.3rem;">$${window.cartModule.getTotal().toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Handle Form Submission
  const form = document.getElementById('checkout-order-form');
  const errorEl = document.getElementById('checkout-error');
  const submitBtn = document.getElementById('checkout-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.classList.add('hidden');
    if (submitBtn) submitBtn.disabled = true;

    const shippingAddress = document.getElementById('shipping-address').value;
    const items = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    try {
      const response = await window.api.orders.create(shippingAddress, items);
      showToast('success', `Order processed! ID: #${response.orderId}`);
      window.cartModule.clear();
      window.location.hash = '#/profile';
    } catch (err) {
      if (submitBtn) submitBtn.disabled = false;
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
      showToast('error', `Order failed: ${err.message}`);
    }
  });
}

// ==========================================================================
// VIEW 4: USER PROFILE & ADMIN CONSOLE
// ==========================================================================

async function renderProfileView(container) {
  // Ensure user is signed in
  if (!window.authModule.user) {
    container.innerHTML = `
      <div class="glass-panel text-center" style="padding: 64px 20px; text-align: center;">
        <i data-lucide="lock" style="width: 48px; height: 48px; color: var(--accent-magenta); margin-bottom:16px;"></i>
        <h2>Access Restricted</h2>
        <p class="mt-2 text-secondary">Establish an operative session to view your profile console.</p>
        <button class="btn btn-primary mt-6" onclick="window.authModule.toggleModal(true, 'login')">
          Sign In
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const isAdmin = window.authModule.user.role === 'admin';

  // Base Layout
  container.innerHTML = `
    <div class="profile-layout">
      <!-- Sidebar navigation -->
      <div class="glass-panel profile-sidebar">
        <div class="profile-user-card">
          <div class="profile-avatar"><i data-lucide="user-check"></i></div>
          <span class="profile-name">${window.authModule.user.username}</span>
          <span class="profile-email">${window.authModule.user.email}</span>
          <span class="profile-role-tag">${window.authModule.user.role}</span>
        </div>
        <div class="profile-nav-menu">
          <button class="profile-nav-btn active" id="profile-tab-orders-btn">
            <i data-lucide="shopping-bag"></i> Order History
          </button>
          ${isAdmin ? `
            <button class="profile-nav-btn" id="profile-tab-admin-btn" style="color: var(--accent-cyan);">
              <i data-lucide="sliders"></i> Admin Console
            </button>
          ` : ''}
          <button class="profile-nav-btn btn-logout" id="profile-logout-btn" style="margin-top: 24px;">
            <i data-lucide="log-out"></i> Terminate Session
          </button>
        </div>
      </div>

      <!-- Profile content workspace -->
      <div id="profile-workspace">
        <p class="text-secondary">Syncing details...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach navigation action listeners
  const ordersTabBtn = document.getElementById('profile-tab-orders-btn');
  const adminTabBtn = document.getElementById('profile-tab-admin-btn');
  const logoutBtn = document.getElementById('profile-logout-btn');

  const workspace = document.getElementById('profile-workspace');

  ordersTabBtn.addEventListener('click', () => {
    ordersTabBtn.classList.add('active');
    if (adminTabBtn) adminTabBtn.classList.remove('active');
    loadUserOrders(workspace);
  });

  if (adminTabBtn) {
    adminTabBtn.addEventListener('click', () => {
      adminTabBtn.classList.add('active');
      ordersTabBtn.classList.remove('active');
      loadAdminConsole(workspace);
    });
  }

  logoutBtn.addEventListener('click', () => {
    window.authModule.logout();
  });

  // Default view: Load user orders
  await loadUserOrders(workspace);
}

async function loadUserOrders(workspace) {
  workspace.innerHTML = `<p class="text-secondary">Syncing order lists...</p>`;
  
  try {
    const orders = await window.api.orders.getUserOrders();
    
    if (orders.length === 0) {
      workspace.innerHTML = `
        <div class="glass-panel order-card text-center" style="padding: 48px; text-align: center;">
          <i data-lucide="package-open" style="width: 36px; height: 36px; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h3>No Orders Logged</h3>
          <p class="text-secondary mt-1">Place orders in the checkout area to list transactions.</p>
        </div>
      `;
    } else {
      workspace.innerHTML = `
        <div class="orders-section">
          <h2>Purchase Orders</h2>
          ${orders.map(order => {
            const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });

            return `
              <div class="glass-panel order-card">
                <div class="order-card-header">
                  <div class="order-id-meta">
                    <h4>Order #${order.id}</h4>
                    <div class="order-date-meta">${formattedDate}</div>
                  </div>
                  <span class="order-status-badge status-${order.status}">${order.status}</span>
                </div>
                
                <div class="order-items-summary">
                  ${order.items.map(item => `
                    <div class="order-item-row">
                      <span class="order-item-desc">
                        ${item.product_name} <span style="font-size:0.75rem; color:var(--text-muted);">x${item.quantity}</span>
                      </span>
                      <span>$${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                    </div>
                  `).join('')}
                </div>

                <div class="order-card-footer">
                  <span class="order-shipping-meta">Coordinates: ${order.shipping_address}</span>
                  <span class="order-total-price">Total: <span class="accent-text">$${order.total_amount.toFixed(2)}</span></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  } catch (err) {
    workspace.innerHTML = `<div class="error-msg">Failed to load orders: ${err.message}</div>`;
  }

  if (window.lucide) window.lucide.createIcons();
}

async function loadAdminConsole(workspace) {
  workspace.innerHTML = `<p class="text-secondary">Syncing admin databases...</p>`;
  
  try {
    const orders = await window.api.orders.adminGetAll();
    
    if (orders.length === 0) {
      workspace.innerHTML = `
        <div class="glass-panel order-card text-center" style="padding: 48px;">
          <h3>No System Orders</h3>
          <p class="text-secondary mt-1">No transactions have been logged in the system.</p>
        </div>
      `;
    } else {
      workspace.innerHTML = `
        <div class="admin-header-row">
          <h2>Administrative Portal</h2>
          <span class="profile-role-tag" style="margin-top:0;">Master Control</span>
        </div>
        
        <div class="glass-panel admin-table-panel">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Operative</th>
                <th>Purchased Items</th>
                <th>Billing Total</th>
                <th>Logistics Status</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(order => {
                const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                return `
                  <tr>
                    <td>
                      <strong>#${order.id}</strong>
                      <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${formattedDate}</div>
                    </td>
                    <td>
                      <div>${order.username}</div>
                      <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${order.email}</div>
                    </td>
                    <td>
                      <ul class="admin-table-items-list">
                        ${order.items.map(item => `
                          <li>${item.product_name} <strong>x${item.quantity}</strong></li>
                        `).join('')}
                      </ul>
                      <div style="font-size:0.7rem; color:var(--text-muted); margin-top:4px;">Addr: ${order.shipping_address}</div>
                    </td>
                    <td>
                      <strong class="accent-text">$${order.total_amount.toFixed(2)}</strong>
                    </td>
                    <td>
                      <select class="admin-status-select" data-id="${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                      </select>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Attach status change action listeners
      document.querySelectorAll('.admin-status-select').forEach(select => {
        select.addEventListener('change', async () => {
          const id = parseInt(select.dataset.id);
          const newStatus = select.value;
          
          try {
            await window.api.orders.adminUpdateStatus(id, newStatus);
            showToast('success', `Logistics status updated for Order #${id} to ${newStatus}.`);
          } catch (err) {
            showToast('error', `Failed to update status: ${err.message}`);
            // Re-render dashboard to reset status selector UI
            await loadAdminConsole(workspace);
          }
        });
      });
    }
  } catch (err) {
    workspace.innerHTML = `<div class="error-msg">Access denied or error: ${err.message}</div>`;
  }

  if (window.lucide) window.lucide.createIcons();
}

// ==========================================================================
// BOOTSTRAP LIGNE OF INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize APIs and state trackers
  window.cartModule.init();
  window.authModule.init();

  // Routing bindings
  window.addEventListener('hashchange', handleRoute);
  
  // Trigger initial route
  handleRoute();

  // Search input query bindings
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      
      if (q) {
        if (clearBtn) clearBtn.classList.remove('hidden');
      } else {
        if (clearBtn) clearBtn.classList.add('hidden');
      }

      // Debouncing queries (250ms)
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        // Only run search on home view
        if (window.location.hash === '#/' || window.location.hash === '') {
          loadProducts(q);
        }
      }, 250);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.add('hidden');
      if (window.location.hash === '#/' || window.location.hash === '') {
        loadProducts();
      }
    });
  }

  // Category selection click listeners
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentCategory = btn.dataset.category;
      
      // Reset search bar
      if (searchInput) {
        searchInput.value = '';
        if (clearBtn) clearBtn.classList.add('hidden');
      }

      // Redirect back to home to see categorized list
      window.location.hash = '#/';
      loadProducts();
    });
  });

  // Product modal close triggers
  const prodClose = document.getElementById('product-modal-close');
  const prodOverlay = document.getElementById('product-modal');
  if (prodClose) prodClose.addEventListener('click', () => prodOverlay.classList.remove('active'));
  if (prodOverlay) {
    prodOverlay.addEventListener('click', (e) => {
      if (e.target === prodOverlay) prodOverlay.classList.remove('active');
    });
  }

  // Auth modal close triggers
  const authClose = document.getElementById('auth-modal-close');
  const authOverlay = document.getElementById('auth-modal');
  if (authClose) authClose.addEventListener('click', () => window.authModule.toggleModal(false));
  if (authOverlay) {
    authOverlay.addEventListener('click', (e) => {
      if (e.target === authOverlay) window.authModule.toggleModal(false);
    });
  }
});
