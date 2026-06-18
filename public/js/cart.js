// NEXUS GEAR Cart Module

const cartModule = {
  items: JSON.parse(localStorage.getItem('nexus_cart')) || [],

  save() {
    localStorage.setItem('nexus_cart', JSON.stringify(this.items));
    this.render();
  },

  get() {
    return this.items;
  },

  add(product, quantity = 1) {
    const existing = this.items.find(item => item.productId === product.id);
    
    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        showToast('error', `Cannot add more. Only ${product.stock} items available in database.`);
        return false;
      }
      existing.quantity += quantity;
    } else {
      if (quantity > product.stock) {
        showToast('error', `Cannot add. Only ${product.stock} items available in database.`);
        return false;
      }
      this.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url,
        stock: product.stock,
        quantity: quantity
      });
    }

    this.save();
    showToast('success', `${product.name} added to cart.`);
    return true;
  },

  remove(productId) {
    const index = this.items.findIndex(item => item.productId === productId);
    if (index !== -1) {
      const name = this.items[index].name;
      this.items.splice(index, 1);
      this.save();
      showToast('info', `${name} removed from cart.`);
    }
  },

  updateQty(productId, qty) {
    const item = this.items.find(item => item.productId === productId);
    if (item) {
      if (qty <= 0) {
        this.remove(productId);
        return;
      }
      if (qty > item.stock) {
        showToast('warning', `Only ${item.stock} items in stock.`);
        item.quantity = item.stock;
      } else {
        item.quantity = qty;
      }
      this.save();
    }
  },

  clear() {
    this.items = [];
    this.save();
  },

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  render() {
    const container = document.getElementById('cart-drawer-items');
    const footer = document.getElementById('cart-drawer-footer');
    const subtotalEl = document.getElementById('cart-subtotal');
    const badgeEl = document.getElementById('cart-badge-count');

    // Update nav badge count
    const count = this.getCount();
    badgeEl.textContent = count;
    if (count > 0) {
      badgeEl.classList.remove('hidden');
    } else {
      badgeEl.classList.add('hidden');
    }

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="empty-cart-state">
          <i data-lucide="package-open" style="width: 48px; height: 48px; color: var(--text-muted);"></i>
          <p class="mt-4">No active items detected in cart.</p>
          <button class="btn btn-primary btn-sm mt-4" id="cart-empty-shop-btn">Browse Shop</button>
        </div>
      `;
      footer.classList.add('hidden');
      
      const emptyShopBtn = document.getElementById('cart-empty-shop-btn');
      if (emptyShopBtn) {
        emptyShopBtn.addEventListener('click', () => {
          cartModule.toggle(false);
          window.location.hash = '#/';
        });
      }
    } else {
      footer.classList.remove('hidden');
      subtotalEl.textContent = `$${this.getTotal().toFixed(2)}`;

      container.innerHTML = this.items.map(item => `
        <div class="cart-item">
          <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-info">
            <div>
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-price mt-1">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
              <div class="quantity-adjuster">
                <button class="qty-btn dec-qty" data-id="${item.productId}"><i data-lucide="minus" style="width: 12px; height: 12px;"></i></button>
                <span class="qty-val">${item.quantity}</span>
                <button class="qty-btn inc-qty" data-id="${item.productId}"><i data-lucide="plus" style="width: 12px; height: 12px;"></i></button>
              </div>
              <button class="cart-item-remove-btn" data-id="${item.productId}">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Remove
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Refresh Lucide icons in cart drawer
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  toggle(show) {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    
    if (show) {
      drawer.classList.add('active');
      overlay.classList.add('active');
      this.render();
    } else {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    }
  },

  init() {
    // Nav Cart Trigger
    const cartBtn = document.getElementById('nav-cart-btn');
    const closeBtn = document.getElementById('cart-close-btn');
    const overlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.getElementById('cart-checkout-btn');

    if (cartBtn) cartBtn.addEventListener('click', () => this.toggle(true));
    if (closeBtn) closeBtn.addEventListener('click', () => this.toggle(false));
    if (overlay) overlay.addEventListener('click', () => this.toggle(false));
    
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        this.toggle(false);
        window.location.hash = '#/checkout';
      });
    }

    // Handle cart item modifications (event delegation)
    const itemsContainer = document.getElementById('cart-drawer-items');
    if (itemsContainer) {
      itemsContainer.addEventListener('click', (e) => {
        // Remove button
        const removeBtn = e.target.closest('.cart-item-remove-btn');
        if (removeBtn) {
          const id = parseInt(removeBtn.dataset.id);
          this.remove(id);
          return;
        }

        // Increment Quantity
        const incBtn = e.target.closest('.inc-qty');
        if (incBtn) {
          const id = parseInt(incBtn.dataset.id);
          const item = this.items.find(i => i.productId === id);
          if (item) {
            this.updateQty(id, item.quantity + 1);
          }
          return;
        }

        // Decrement Quantity
        const decBtn = e.target.closest('.dec-qty');
        if (decBtn) {
          const id = parseInt(decBtn.dataset.id);
          const item = this.items.find(i => i.productId === id);
          if (item) {
            this.updateQty(id, item.quantity - 1);
          }
          return;
        }
      });
    }

    this.render();
  }
};

window.cartModule = cartModule;
