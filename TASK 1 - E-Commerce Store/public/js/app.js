/* ── Config ─────────────────────────────── */
const API = 'http://localhost:5000/api';

/* ── State ──────────────────────────────── */
// Load user from localStorage
const savedUser = JSON.parse(localStorage.getItem('sv_user') || 'null');
const savedCartKey = savedUser ? `sv_cart_${savedUser.id}` : 'sv_cart_guest';

let state = {
  products: [],
  filteredProducts: [],
  cart: JSON.parse(localStorage.getItem(savedCartKey) || '[]'),
  user: savedUser,
  token: localStorage.getItem('sv_token') || null,
  category: 'all',
  currentProduct: null,
  detailQty: 1,
  merchantActiveTab: 'orders',
  merchantProducts: [],
  merchantOrders: [],
  checkoutItem: null
};

/* ── Helpers ────────────────────────────── */
const $ = id => document.getElementById(id);
const saveCart = () => {
  const key = state.user ? `sv_cart_${state.user.id}` : 'sv_cart_guest';
  localStorage.setItem(key, JSON.stringify(state.cart));
};
const fmt = n => '$' + parseFloat(n).toFixed(2);
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

/* ── Toast Notifications Manager ────────── */
const Toast = {
  show(message, type = 'info') {
    const container = $('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span style="flex:1;">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    
    // Auto-dismiss logic after animations
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` };
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: authHeaders(),
    ...opts,
    ...(opts.body ? {} : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ── Routing ────────────────────────────── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(`page-${name}`).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'orders') loadOrders();
  if (name === 'merchant') loadMerchantDashboard();
}

function requireAuth(page) {
  if (state.user) showPage(page);
  else showPage('login');
}

/* ── Auth UI ────────────────────────────── */
function updateAuthUI() {
  if (state.user) {
    $('auth-nav-link').classList.add('hidden');
    $('user-greeting').classList.remove('hidden');
    $('user-greeting').textContent = `Hi, ${state.user.name.split(' ')[0]}`;
    $('logout-btn').classList.remove('hidden');
    
    // Toggle merchant link visibility based on merchant flag
    if (state.user.isMerchant) {
      $('merchant-nav-link').classList.remove('hidden');
    } else {
      $('merchant-nav-link').classList.add('hidden');
    }
  } else {
    $('auth-nav-link').classList.remove('hidden');
    $('user-greeting').classList.add('hidden');
    $('logout-btn').classList.add('hidden');
    $('merchant-nav-link').classList.add('hidden');
  }
}

function handleCartTransfer(user) {
  const userCartKey = `sv_cart_${user.id}`;
  const userCart = JSON.parse(localStorage.getItem(userCartKey) || '[]');
  
  if (state.cart.length > 0) {
    // Merge guest cart items into the user's cart
    state.cart.forEach(guestItem => {
      const existing = userCart.find(i => i.id === guestItem.id);
      if (existing) {
        existing.qty += guestItem.qty;
      } else {
        userCart.push(guestItem);
      }
    });
    // Clear the guest cart from localStorage
    localStorage.removeItem('sv_cart_guest');
  }
  
  state.cart = userCart;
  saveCart();
  updateCartUI();
}

async function doLogin() {
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const errEl = $('login-error');
  errEl.classList.add('hidden');
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password }),
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('sv_token', data.token);
    localStorage.setItem('sv_user', JSON.stringify(data.user));
    
    // Transfer or load user-specific cart
    handleCartTransfer(data.user);
    
    updateAuthUI();
    Toast.success(`Welcome back, ${data.user.name}!`);
    
    // Custom Redirects
    if (data.user.isMerchant) {
      showPage('merchant');
    } else if (state.redirectAfterLogin === 'checkout') {
      state.redirectAfterLogin = null;
      Toast.success('Your guest cart has been transferred to your account.');
      goToCheckout();
    } else {
      showPage('home');
    }
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
    Toast.error('Login failed: ' + e.message);
  }
}

async function doRegister() {
  const name = $('reg-name').value.trim();
  const email = $('reg-email').value.trim();
  const password = $('reg-password').value;
  const errEl = $('register-error');
  errEl.classList.add('hidden');
  if (!name || !email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.classList.remove('hidden');
    Toast.error('All registration fields are required.');
    return;
  }
  try {
    const data = await api('/auth/register', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('sv_token', data.token);
    localStorage.setItem('sv_user', JSON.stringify(data.user));
    
    // Transfer or load user-specific cart
    handleCartTransfer(data.user);
    
    updateAuthUI();
    Toast.success(`Account created! Welcome, ${data.user.name}!`);
    
    if (state.redirectAfterLogin === 'checkout') {
      state.redirectAfterLogin = null;
      Toast.success('Your guest cart has been transferred to your account.');
      goToCheckout();
    } else {
      showPage('home');
    }
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
    Toast.error('Registration failed: ' + e.message);
  }
}

function logout() {
  state.token = null; state.user = null;
  localStorage.removeItem('sv_token');
  localStorage.removeItem('sv_user');
  updateAuthUI();
  
  // Restore guest cart (usually empty)
  state.cart = JSON.parse(localStorage.getItem('sv_cart_guest') || '[]');
  updateCartUI();
  
  Toast.info('Successfully signed out.');
  showPage('home');
}

/* ── Products ───────────────────────────── */
function showProductSkeletons() {
  const grid = $('product-grid');
  $('products-loading').style.display = 'none';
  grid.innerHTML = Array(4).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img skeleton"></div>
      <div class="skeleton-title skeleton"></div>
      <div class="skeleton-meta skeleton" style="margin-top:0.4rem; height:12px; width:45%"></div>
      <div class="skeleton-price skeleton" style="margin-top:1rem; height:22px; width:30%"></div>
    </div>
  `).join('');
}

async function loadProducts() {
  showProductSkeletons();
  try {
    const qs = new URLSearchParams();
    if (state.category !== 'all') qs.set('category', state.category);
    const q = $('search-input').value.trim();
    if (q) qs.set('search', q);
    state.products = await api(`/products?${qs}`);
    renderProducts();
  } catch (e) {
    $('product-grid').innerHTML = `<p style="color:var(--error);padding:2rem 0">Failed to load products: ${e.message}</p>`;
    Toast.error('Failed to load products: ' + e.message);
  }
}

function renderProducts() {
  const grid = $('product-grid');
  $('products-loading').style.display = 'none';
  if (!state.products.length) {
    grid.innerHTML = '<p style="color:var(--ink-light);padding:2rem 0">No products found.</p>';
    return;
  }
  grid.innerHTML = state.products.map(p => `
    <div class="product-card" onclick="showProduct(${p.id})">
      <div class="card-img-wrap">
        <img class="product-img" src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-category">${p.category}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-rating">
          <span class="stars">${stars(p.rating)}</span>
          <span class="rating-count">(${p.reviews.toLocaleString()})</span>
        </div>
        <div class="card-footer">
          <span class="card-price">${fmt(p.price)}</span>
          <button class="add-btn" onclick="event.stopPropagation(); addToCart(${p.id})" title="Add to cart">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

function setCategory(cat, el) {
  state.category = cat;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadProducts();
}

function filterProducts() { loadProducts(); }

/* ── Product Detail ─────────────────────── */
async function showProduct(id) {
  showPage('product');
  state.detailQty = 1;
  hideWriteReviewForm();
  try {
    const p = await api(`/products/${id}`);
    state.currentProduct = p;
    $('product-detail-content').innerHTML = `
      <div class="detail-img-wrap">
        <img src="${p.image}" alt="${p.name}" />
      </div>
      <div class="detail-info">
        <div class="detail-category">${p.category}</div>
        <h1 class="detail-name">${p.name}</h1>
        <div class="detail-rating">
          <span class="stars">${stars(p.rating)}</span>
          <span class="rating-count">${p.rating} · ${p.reviews.toLocaleString()} reviews</span>
        </div>
        <div class="detail-price">${fmt(p.price)}</div>
        <p class="detail-desc">${p.description}</p>
        <div class="detail-stock">✓ In Stock (${p.stock} available)</div>
        <div class="qty-wrap">
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <span class="qty-num" id="detail-qty">1</span>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>
          <button class="btn-primary" onclick="addToCartQty(${p.id})">Add to Cart</button>
        </div>
        <button class="btn-secondary" style="width:100%" onclick="buyNow(${p.id})">Buy Now</button>
      </div>
    `;
    loadProductReviews(id);
  } catch (e) {
    $('product-detail-content').innerHTML = '<p>Product not found.</p>';
    Toast.error('Failed to load product details: ' + e.message);
  }
}

function changeQty(delta) {
  state.detailQty = Math.max(1, state.detailQty + delta);
  $('detail-qty').textContent = state.detailQty;
}

/* ── Cart ───────────────────────────────── */
function addToCart(productId, qty = 1) {
  const product = state.products.find(p => p.id === productId) || state.currentProduct;
  if (!product) return;
  const existing = state.cart.find(i => i.id === productId);
  if (existing) existing.qty += qty;
  else state.cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty });
  saveCart();
  updateCartUI();
  showCartBounce();
  Toast.success(`Added ${qty}x "${product.name}" to cart!`);
}

function addToCartQty(productId) {
  addToCart(productId, state.detailQty);
}

function removeFromCart(id) {
  const item = state.cart.find(i => i.id === id);
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart(); updateCartUI();
  if (item) Toast.info(`Removed "${item.name}" from cart.`);
}

function updateCartQty(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  saveCart(); updateCartUI();
}

function updateCartUI() {
  const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  $('cart-count').textContent = count;
  $('cart-total').textContent = fmt(total);

  const cartEl = $('cart-items');
  if (!state.cart.length) {
    cartEl.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
    return;
  }
  cartEl.innerHTML = state.cart.map(i => `
    <div class="cart-item">
      <div class="cart-item-img"><img src="${i.image}" alt="${i.name}" /></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">${fmt(i.price)} each</div>
        <div class="cart-item-qty">
          <button onclick="updateCartQty(${i.id}, -1)">−</button>
          <span>${i.qty}</span>
          <button onclick="updateCartQty(${i.id}, 1)">+</button>
        </div>
        <button class="remove-item" onclick="removeFromCart(${i.id})">Remove</button>
      </div>
    </div>
  `).join('');
}

function openCart() {
  $('cart-sidebar').classList.remove('hidden');
  $('cart-overlay').classList.remove('hidden');
}

function closeCart() {
  $('cart-sidebar').classList.add('hidden');
  $('cart-overlay').classList.add('hidden');
}

function toggleCart() {
  const isOpen = !$('cart-sidebar').classList.contains('hidden');
  isOpen ? closeCart() : openCart();
}

function showCartBounce() {
  const btn = document.querySelector('.cart-btn');
  btn.style.transform = 'scale(1.3)';
  setTimeout(() => btn.style.transform = '', 200);
}

/* ── Checkout ───────────────────────────── */
function requireMerchantAuth() {
  if (state.user && state.user.isMerchant) {
    showPage('merchant');
  } else {
    Toast.error('Access Denied: Merchant credentials required.');
    showPage('login');
  }
}

function buyNow(productId) {
  const product = state.products.find(p => p.id === productId) || state.currentProduct;
  if (!product) return;
  state.checkoutItem = { id: product.id, name: product.name, price: product.price, image: product.image, qty: state.detailQty };
  if (!state.user) {
    state.redirectAfterLogin = 'checkout';
    Toast.info('Please sign in to complete your purchase.');
    showPage('login');
  } else {
    goToCheckout();
  }
}

function startCartCheckout() {
  state.checkoutItem = null;
  goToCheckout();
}

function goToCheckout() {
  const items = state.checkoutItem ? [state.checkoutItem] : state.cart;
  if (!items.length) return;
  if (!state.user) {
    state.redirectAfterLogin = 'checkout';
    Toast.info('Please sign in to continue to checkout.');
    showPage('login');
    return;
  }
  closeCart();
  // populate checkout summary
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  $('checkout-items').innerHTML = items.map(i => `
    <div class="checkout-item">
      <img src="${i.image}" alt="${i.name}" />
      <div class="checkout-item-info">
        <strong>${i.name}</strong>
        <span>Qty: ${i.qty} · ${fmt(i.price * i.qty)}</span>
      </div>
    </div>
  `).join('');
  $('checkout-total').textContent = fmt(total);
  showPage('checkout');
}

async function placeOrder() {
  if (!state.user) { showPage('login'); return; }
  const name = $('usr-ship-nm').value.trim();
  const address = $('usr-ship-adr').value.trim();
  const city = $('usr-ship-ct').value.trim();
  const zip = $('usr-ship-zp').value.trim();
  const country = $('usr-ship-cn').value.trim();
  const errEl = $('checkout-error');
  errEl.classList.add('hidden');
  if (!name || !address || !city || !zip || !country) {
    errEl.textContent = 'Please fill in your shipping address.';
    errEl.classList.remove('hidden');
    Toast.error('Please complete shipping fields.');
    return;
  }
  const fullAddress = `${name}, ${address}, ${city} ${zip}, ${country}`;
  
  const items = state.checkoutItem ? [state.checkoutItem] : state.cart;
  if (!items.length) {
    Toast.error('No items to checkout.');
    return;
  }
  
  try {
    const order = await api('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: items.map(i => ({ product_id: i.id, quantity: i.qty })),
        address: fullAddress,
      }),
    });
    
    // Clear checkout target
    if (state.checkoutItem) {
      state.checkoutItem = null;
    } else {
      state.cart = [];
      saveCart();
      updateCartUI();
    }
    
    // Show success
    $('modal-order-info').textContent = `Order #${order.order_id} · ${fmt(order.total)}`;
    $('success-modal').classList.remove('hidden');
    Toast.success('Order placed successfully! Thank you.');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
    Toast.error('Order placement failed: ' + e.message);
  }
}

function closeModal() {
  $('success-modal').classList.add('hidden');
  showPage('home');
}

/* ── Orders ─────────────────────────────── */
async function loadOrders() {
  $('orders-list').innerHTML = '<p style="color:var(--ink-light)">Loading orders...</p>';
  try {
    const orders = await api('/orders');
    if (!orders.length) {
      $('orders-list').innerHTML = '<p style="color:var(--ink-light)">You have no orders yet.</p>';
      return;
    }
    $('orders-list').innerHTML = orders.map(o => `
      <div class="order-card" id="order-card-${o.id}">
        <div class="order-meta">
          <div>
            <div class="order-id">Order #${o.id} &middot; ${new Date(o.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            <div style="font-size:0.8rem;color:var(--ink-light);margin-top:0.2rem">${o.address}</div>
          </div>
          <span class="order-status ${o.status === 'Cancelled' ? 'status-cancelled' : ''}">${o.status}</span>
        </div>
        <div class="order-items-list">
          ${o.items.map(i => `
            <div class="order-item-row">
              <img src="${i.image}" alt="${i.product_name}" />
              <span>${i.product_name} x${i.quantity}</span>
              <span style="margin-left:auto;color:var(--ink-light)">${fmt(i.price * i.quantity)}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-card-footer">
          <div class="order-total">Total: ${fmt(o.total)}</div>
          ${o.status === 'Processing' ? `<button class="btn-cancel" onclick="cancelOrder(${o.id})">Cancel Order</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (e) {
    $('orders-list').innerHTML = '<p style="color:var(--error)">Failed to load orders.</p>';
  }
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  try {
    await api(`/orders/${orderId}/cancel`, { method: 'POST' });
    const card = $(`order-card-${orderId}`);
    if (card) {
      card.querySelector('.order-status').textContent = 'Cancelled';
      card.querySelector('.order-status').classList.add('status-cancelled');
      const btn = card.querySelector('.btn-cancel');
      if (btn) btn.remove();
    }
    Toast.success(`Order #${orderId} was successfully cancelled.`);
  } catch (e) {
    Toast.error('Failed to cancel order: ' + e.message);
  }
}

/* ── Theme Switcher ─────────────────────── */
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('sv_theme', isDark ? 'dark' : 'light');
  updateThemeUI(isDark);
  Toast.info(`Switched to ${isDark ? 'Obsidian Dark' : 'Imperial Light'} theme.`);
}

function updateThemeUI(isDark) {
  const sunIcon = document.querySelector('.theme-toggle-btn .sun-icon');
  const moonIcon = document.querySelector('.theme-toggle-btn .moon-icon');
  if (isDark) {
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  } else {
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('sv_theme') || 'light';
  const isDark = savedTheme === 'dark';
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  updateThemeUI(isDark);
}

/* ── Product Reviews Widget ─────────────── */
let activeReviewStars = 5;

function showWriteReviewForm() {
  if (!state.user) {
    Toast.error('Please sign in to write a review.');
    showPage('login');
    return;
  }
  $('write-review-container').classList.add('hidden');
  $('review-form-panel').classList.remove('hidden');
  setupStarSelectEvents();
}

function hideWriteReviewForm() {
  $('write-review-container').classList.remove('hidden');
  $('review-form-panel').classList.add('hidden');
  $('review-comment').value = '';
  activeReviewStars = 5;
  highlightStarSelector(5);
}

function setupStarSelectEvents() {
  const stars = document.querySelectorAll('#star-rating-select span');
  stars.forEach(s => {
    // Clone to remove previous event listeners
    const newStar = s.cloneNode(true);
    s.parentNode.replaceChild(newStar, s);
  });
  
  const newStars = document.querySelectorAll('#star-rating-select span');
  newStars.forEach(star => {
    star.addEventListener('click', () => {
      activeReviewStars = parseInt(star.getAttribute('data-val'));
      highlightStarSelector(activeReviewStars);
    });
    star.addEventListener('mouseover', () => {
      const hoverVal = parseInt(star.getAttribute('data-val'));
      newStars.forEach(s => {
        const val = parseInt(s.getAttribute('data-val'));
        if (val <= hoverVal) s.classList.add('hovered');
        else s.classList.remove('hovered');
      });
    });
    star.addEventListener('mouseout', () => {
      newStars.forEach(s => s.classList.remove('hovered'));
    });
  });
  highlightStarSelector(5);
}

function highlightStarSelector(rating) {
  const stars = document.querySelectorAll('#star-rating-select span');
  stars.forEach(s => {
    const val = parseInt(s.getAttribute('data-val'));
    if (val <= rating) s.classList.add('selected');
    else s.classList.remove('selected');
  });
}

async function loadProductReviews(productId) {
  const listEl = $('product-reviews-list');
  listEl.innerHTML = '<p style="color:var(--ink-light);">Loading reviews...</p>';
  try {
    const reviews = await api(`/products/${productId}/reviews`);
    
    // Calculate average & total
    const totalCount = reviews.length;
    let avg = 0;
    if (totalCount > 0) {
      avg = reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount;
    } else {
      avg = state.currentProduct ? state.currentProduct.rating : 4.5;
    }
    
    $('reviews-avg-rating').textContent = avg.toFixed(1);
    $('reviews-avg-stars').textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
    $('reviews-total-count').textContent = `${totalCount.toLocaleString()} customer reviews`;
    
    // Calculate bar percentage distribution
    const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    reviews.forEach(r => {
      if (distribution[r.rating] !== undefined) distribution[r.rating]++;
    });
    
    $('rating-bars-container').innerHTML = [5,4,3,2,1].map(starsCount => {
      const count = distribution[starsCount];
      const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : (starsCount === 5 ? 75 : (starsCount === 4 ? 20 : 5));
      return `
        <div class="rating-bar-row">
          <span class="rating-bar-label">${starsCount} star</span>
          <div class="rating-bar-bg">
            <div class="rating-bar-fill" style="width: ${pct}%"></div>
          </div>
          <span class="rating-bar-pct">${pct}%</span>
        </div>
      `;
    }).join('');
    
    if (totalCount === 0) {
      listEl.innerHTML = '<p style="color:var(--ink-light); padding:1rem 0;">No reviews written for this product yet. Be the first to share your experience!</p>';
      return;
    }
    
    listEl.innerHTML = reviews.map(r => {
      const initials = r.user_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      const relativeDate = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `
        <div class="review-card">
          <div class="review-avatar">${initials}</div>
          <div class="review-content">
            <div class="review-card-header">
              <span class="review-user-name">${r.user_name}</span>
              <span class="review-date">${relativeDate}</span>
            </div>
            <div class="stars" style="font-size:0.85rem;">${'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}</div>
            <div class="review-text">${r.comment}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    listEl.innerHTML = '<p style="color:var(--error);">Failed to load product reviews.</p>';
  }
}

async function submitReview() {
  const comment = $('review-comment').value.trim();
  if (!comment) {
    Toast.error('Please enter a review description.');
    return;
  }
  try {
    const pid = state.currentProduct.id;
    await api(`/products/${pid}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: activeReviewStars, comment })
    });
    Toast.success('Thank you! Your review was successfully submitted.');
    hideWriteReviewForm();
    
    // Refresh product details and reviews
    const updatedProduct = await api(`/products/${pid}`);
    state.currentProduct = updatedProduct;
    document.querySelector('.detail-rating').innerHTML = `
      <span class="stars">${stars(updatedProduct.rating)}</span>
      <span class="rating-count">${updatedProduct.rating} · ${updatedProduct.reviews.toLocaleString()} reviews</span>
    `;
    loadProductReviews(pid);
  } catch (e) {
    Toast.error('Failed to submit review: ' + e.message);
  }
}

/* ── Merchant Panel Console ─────────────── */
function switchMerchantTab(tabName, el) {
  state.merchantActiveTab = tabName;
  document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  
  document.querySelectorAll('.m-tab-content').forEach(c => c.classList.remove('active'));
  $(`merchant-tab-${tabName}`).classList.add('active');
  
  if (tabName === 'orders') renderMerchantOrdersTable();
  if (tabName === 'inventory') renderMerchantInventoryTable();
  if (tabName === 'analytics') renderMerchantAnalytics();
  if (tabName === 'history') renderMerchantHistoryTable();
}

async function loadMerchantDashboard() {
  try {
    // 1. Fetch Orders & Products
    state.merchantOrders = await api('/admin/orders');
    state.merchantProducts = await api('/products?category=all');
    
    // 2. Compute Stats
    const revenue = state.merchantOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    
    const lowStockCount = state.merchantProducts.filter(p => p.stock < 15).length;
    const activeOrdersCount = state.merchantOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
    
    $('merchant-revenue').textContent = fmt(revenue);
    $('merchant-orders-count').textContent = state.merchantOrders.length;
    $('merchant-active-orders-count').textContent = activeOrdersCount;
    $('merchant-low-stock').textContent = lowStockCount;
    
    // Trigger active tab render
    if (state.merchantActiveTab === 'orders') renderMerchantOrdersTable();
    if (state.merchantActiveTab === 'inventory') renderMerchantInventoryTable();
    if (state.merchantActiveTab === 'analytics') renderMerchantAnalytics();
    if (state.merchantActiveTab === 'history') renderMerchantHistoryTable();
    
  } catch (e) {
    Toast.error('Merchant Portal loading failed: ' + e.message);
  }
}

function renderMerchantOrdersTable() {
  const tbody = $('merchant-orders-table-body');
  
  // Filter for active orders (not Delivered and not Cancelled)
  const activeOrders = state.merchantOrders.filter(o => 
    o.status !== 'Delivered' && o.status !== 'Cancelled'
  );
  
  if (!activeOrders.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:3rem 0; color:var(--ink-light); font-size:1.1rem;">No active orders</td></tr>';
    return;
  }
  
  tbody.innerHTML = activeOrders.map(o => {
    const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const statusClass = o.status.toLowerCase();
    
    // Render visual detail breakdown of the items and full customer address
    const itemsDetailsHTML = `
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
          ${o.items.map(i => `
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <img src="${i.image}" alt="${i.product_name}" style="width:28px; height:28px; object-fit:cover; border-radius:4px; border:1px solid var(--border);" />
              <span style="font-weight:500; font-size:0.85rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${i.product_name}">${i.product_name}</span>
              <span style="color:var(--ink-light); font-size:0.8rem;">x${i.quantity}</span>
            </div>
          `).join('')}
        </div>
        <div style="font-size:0.75rem; color:var(--ink-light); margin-top:0.4rem; padding-top:0.4rem; border-top:1px dashed var(--border); max-width:280px; white-space:normal; word-break:break-word;">
          <strong>Ship To:</strong> ${o.address}
        </div>
      </div>
    `;
    
    return `
      <tr>
        <td style="padding:1rem 1.2rem; font-weight:600;">#${o.id}</td>
        <td style="padding:1rem 1.2rem;">
          <div style="font-weight:500;">${o.user_name}</div>
          <div style="font-size:0.75rem; color:var(--ink-light);">${o.user_email}</div>
        </td>
        <td style="padding:1rem 1.2rem; color:var(--ink-light);">${dateStr}</td>
        <td style="padding:1rem 1.2rem;">${itemsDetailsHTML}</td>
        <td style="padding:1rem 1.2rem; font-weight:500;">${fmt(o.total)}</td>
        <td style="padding:1rem 1.2rem;">
          <span class="badge-status ${statusClass}">${o.status}</span>
        </td>
        <td style="padding:1rem 1.2rem;">
          <select onchange="updateFulfillmentStatus(${o.id}, this.value)" class="custom-select" style="padding:0.35rem 0.5rem; font-size:0.8rem; border-radius:var(--r); border:1px solid var(--border); outline:none; background:var(--bg-card); color:var(--ink);">
            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Dispatched" ${o.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateFulfillmentStatus(orderId, newStatus) {
  try {
    await api(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    Toast.success(`Order #${orderId} status set to "${newStatus}".`);
    loadMerchantDashboard();
  } catch (e) {
    Toast.error('Status update failed: ' + e.message);
  }
}

function renderMerchantHistoryTable() {
  const tbody = $('merchant-history-table-body');
  if (!state.merchantOrders.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:3rem 0; color:var(--ink-light); font-size:1.1rem;">No orders recorded in system.</td></tr>';
    return;
  }
  tbody.innerHTML = state.merchantOrders.map(o => {
    const dateStr = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const statusClass = o.status.toLowerCase();
    
    // Render visual detail breakdown of the items and full customer address
    const itemsDetailsHTML = `
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
          ${o.items.map(i => `
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <img src="${i.image}" alt="${i.product_name}" style="width:28px; height:28px; object-fit:cover; border-radius:4px; border:1px solid var(--border);" />
              <span style="font-weight:500; font-size:0.85rem; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${i.product_name}">${i.product_name}</span>
              <span style="color:var(--ink-light); font-size:0.8rem;">x${i.quantity}</span>
            </div>
          `).join('')}
        </div>
        <div style="font-size:0.75rem; color:var(--ink-light); margin-top:0.4rem; padding-top:0.4rem; border-top:1px dashed var(--border); max-width:280px; white-space:normal; word-break:break-word;">
          <strong>Ship To:</strong> ${o.address}
        </div>
      </div>
    `;
    
    return `
      <tr>
        <td style="padding:1rem 1.2rem; font-weight:600;">#${o.id}</td>
        <td style="padding:1rem 1.2rem;">
          <div style="font-weight:500;">${o.user_name}</div>
          <div style="font-size:0.75rem; color:var(--ink-light);">${o.user_email}</div>
        </td>
        <td style="padding:1rem 1.2rem; color:var(--ink-light);">${dateStr}</td>
        <td style="padding:1rem 1.2rem;">${itemsDetailsHTML}</td>
        <td style="padding:1rem 1.2rem; font-weight:500;">${fmt(o.total)}</td>
        <td style="padding:1rem 1.2rem;">
          <span class="badge-status ${statusClass}">${o.status}</span>
        </td>
      </tr>
    `;
  }).join('');
}

async function uploadLocalImage(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    Toast.info('Uploading image to USMart servers...');
    const res = await fetch(API + '/admin/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    
    $('p-modal-image').value = data.image_url;
    Toast.success('Product image uploaded successfully!');
  } catch (e) {
    Toast.error('Image upload failed: ' + e.message);
    input.value = '';
  }
}

function renderMerchantInventoryTable() {
  const tbody = $('merchant-inventory-table-body');
  if (!state.merchantProducts.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem 0; color:var(--ink-light)">Store catalog is empty.</td></tr>';
    return;
  }
  tbody.innerHTML = state.merchantProducts.map(p => {
    const stockClass = p.stock < 15 ? 'color:var(--error); font-weight:600' : '';
    const ratingInfo = p.reviews > 0 ? `${p.rating} ★ (${p.reviews} revs)` : 'No reviews';
    return `
      <tr>
        <td style="padding:1rem 1.2rem;"><img class="table-img" src="${p.image}" alt="${p.name}" /></td>
        <td style="padding:1rem 1.2rem; font-weight:500;">${p.name}</td>
        <td style="padding:1rem 1.2rem; color:var(--ink-light);">${p.category}</td>
        <td style="padding:1rem 1.2rem; font-weight:500;">${fmt(p.price)}</td>
        <td style="padding:1rem 1.2rem; ${stockClass}">${p.stock} units</td>
        <td style="padding:1rem 1.2rem; color:var(--ink-light);">${ratingInfo}</td>
        <td style="padding:1rem 1.2rem; white-space:nowrap;">
          <button class="merchant-btn-edit" onclick="editProduct(${p.id})">Edit</button>
          <button class="merchant-btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openProductModal(productId = null) {
  const isEdit = productId !== null;
  $('p-modal-id').value = isEdit ? productId : '';
  $('product-modal-title').textContent = isEdit ? 'Modify Product Catalog' : 'Add New Product';
  
  // Clear any active file selection in the local upload input
  const fileInput = $('p-modal-image-file');
  if (fileInput) fileInput.value = '';
  
  if (isEdit) {
    const p = state.merchantProducts.find(prod => prod.id === productId);
    if (!p) return;
    $('p-modal-name').value = p.name;
    $('p-modal-price').value = p.price;
    $('p-modal-stock').value = p.stock;
    $('p-modal-category').value = p.category;
    $('p-modal-image').value = p.image;
    $('p-modal-description').value = p.description;
  } else {
    $('p-modal-name').value = '';
    $('p-modal-price').value = '';
    $('p-modal-stock').value = '';
    $('p-modal-category').value = 'Electronics';
    $('p-modal-image').value = '';
    $('p-modal-description').value = '';
  }
  
  $('product-modal').classList.remove('hidden');
}

function closeProductModal() {
  $('product-modal').classList.add('hidden');
}

async function saveProduct() {
  const id = $('p-modal-id').value;
  const name = $('p-modal-name').value.trim();
  const price = parseFloat($('p-modal-price').value);
  const stock = parseInt($('p-modal-stock').value);
  const category = $('p-modal-category').value;
  const image = $('p-modal-image').value.trim();
  const description = $('p-modal-description').value.trim();
  
  if (!name || isNaN(price) || isNaN(stock) || !image || !description) {
    Toast.error('Please complete all form fields.');
    return;
  }
  
  const payload = { name, price, stock, category, image, description };
  const isEdit = id !== '';
  try {
    if (isEdit) {
      await api(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      Toast.success(`Product "${name}" updated successfully.`);
    } else {
      await api('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      Toast.success(`Product "${name}" successfully added to USMart catalog.`);
    }
    closeProductModal();
    loadMerchantDashboard();
    loadProducts(); // Reload home page catalog
  } catch (e) {
    Toast.error('Save product failed: ' + e.message);
  }
}

function editProduct(productId) {
  openProductModal(productId);
}

async function deleteProduct(productId) {
  const p = state.merchantProducts.find(prod => prod.id === productId);
  if (!p) return;
  if (!confirm(`Are you sure you want to delete "${p.name}"? This will erase all customer reviews and sales item mappings for this product.`)) return;
  try {
    await api(`/products/${productId}`, { method: 'DELETE' });
    Toast.success(`Product "${p.name}" deleted successfully.`);
    loadMerchantDashboard();
    loadProducts();
  } catch (e) {
    Toast.error('Failed to delete product: ' + e.message);
  }
}

function renderMerchantAnalytics() {
  const container = $('analytics-legend');
  const svg = $('analytics-donut');
  if (!container || !svg) return;
  
  // Dynamic aggregation by category
  const shares = {};
  state.merchantProducts.forEach(p => {
    shares[p.category] = (shares[p.category] || 0) + p.stock;
  });
  
  const categories = Object.keys(shares);
  const totalStock = categories.reduce((sum, c) => sum + shares[c], 0);
  
  const colors = ['#b8955a', '#5c524a', '#8c7853', '#d4b078', '#3d3832'];
  
  let accumulatedPercent = 0;
  let svgContent = `
    <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent"></circle>
    <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--border)" stroke-width="3.2"></circle>
  `;
  
  let topCategory = '';
  let topPct = 0;
  
  container.innerHTML = categories.map((cat, idx) => {
    const stockVal = shares[cat];
    const pct = totalStock > 0 ? Math.round((stockVal / totalStock) * 100) : 0;
    const color = colors[idx % colors.length];
    
    if (pct > topPct) {
      topPct = pct;
      topCategory = cat;
    }
    
    const strokeDash = pct;
    const strokeOffset = 100 - accumulatedPercent + 25;
    accumulatedPercent += pct;
    
    if (pct > 0) {
      svgContent += `
        <circle class="donut-ring-segment" cx="21" cy="21" r="15.91549430918954" 
                fill="transparent" stroke="${color}" stroke-width="3.3" 
                stroke-dasharray="${strokeDash} ${100 - strokeDash}" 
                stroke-dashoffset="${strokeOffset}"></circle>
      `;
    }
    
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:var(--ink);">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${color};"></span>
          <span>${cat}</span>
        </div>
        <span style="font-weight:600; color:var(--ink-light);">${stockVal} units (${pct}%)</span>
      </div>
    `;
  }).join('');
  
  svg.innerHTML = svgContent;
  $('chart-main-pct').textContent = `${topPct}%`;
  document.querySelector('.chart-label span:last-child').textContent = topCategory || 'Empty';
}

/* ── Init ───────────────────────────────── */
initTheme();
updateAuthUI();
updateCartUI();
loadProducts();
