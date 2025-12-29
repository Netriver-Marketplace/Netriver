// Netriver Marketplace - Main JavaScript

// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  body.classList.add(savedTheme + '-mode');
}

themeToggle.addEventListener('click', () => {
  if (body.classList.contains('light-mode')) {
    body.classList.remove('light-mode');
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.add('light-mode');
    localStorage.setItem('theme', 'light');
  }
});

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// API Base URL
const API_BASE = '/api';

// Utility Functions
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function formatCurrency(amount) {
  return '₦' + parseFloat(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(dateString) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-NG', options);
}

// API Calls
async function apiCall(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(API_BASE + endpoint, mergedOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message, 'error');
    throw error;
  }
}

// Cart Functions
async function addToCart(productId, quantity = 1) {
  try {
    const result = await apiCall('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
    showToast('Item added to cart');
    updateCartCount();
    return result;
  } catch (error) {
    console.error('Add to cart error:', error);
  }
}

async function updateCartCount() {
  try {
    const data = await apiCall('/cart/count/items');
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
      cartCount.textContent = data.count || 0;
    }
  } catch (error) {
    console.error('Update cart count error:', error);
  }
}

// Product Functions
async function loadProducts(container, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = `/products${queryString ? '?' + queryString : ''}`;

  try {
    const data = await apiCall(endpoint);
    
    if (container) {
      container.innerHTML = '';

      if (data.products.length === 0) {
        container.innerHTML = '<p class="no-products">No products found</p>';
        return;
      }

      data.products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
      });
    }

    return data;
  } catch (error) {
    console.error('Load products error:', error);
    if (container) {
      container.innerHTML = '<p class="error">Failed to load products</p>';
    }
  }
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  const imageUrl = product.image_url || 'https://via.placeholder.com/300x200?text=No+Image';
  
  card.innerHTML = `
    <img src="${imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Available'">
    <div class="product-info">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-price">${formatCurrency(product.price)}</p>
      <p class="product-category">${product.category}</p>
      <p class="product-seller">Sold by: ${product.seller_name}</p>
      <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
        Add to Cart
      </button>
    </div>
  `;

  return card;
}

// Authentication Functions
async function checkAuth() {
  try {
    const data = await apiCall('/auth/check');
    return data.authenticated;
  } catch (error) {
    return false;
  }
}

async function register(formData) {
  try {
    const result = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    showToast('Registration successful!');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
    return result;
  } catch (error) {
    console.error('Registration error:', error);
  }
}

async function login(email, password) {
  try {
    const result = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    showToast('Login successful!');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
    return result;
  } catch (error) {
    console.error('Login error:', error);
  }
}

async function logout() {
  try {
    await apiCall('/auth/logout', {
      method: 'POST'
    });
    showToast('Logged out successfully');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Dashboard Functions
async function loadDashboard() {
  try {
    const user = await apiCall('/auth/me');
    const products = await apiCall('/products/seller/my-products');
    const orders = await apiCall('/orders/seller/my-orders');

    // Update business name
    const businessNameEl = document.querySelector('.business-name');
    if (businessNameEl) {
      businessNameEl.textContent = user.business_name;
    }

    // Update stats
    updateDashboardStats(user, products, orders);

    return { user, products, orders };
  } catch (error) {
    console.error('Load dashboard error:', error);
    if (error.message === 'Authentication required') {
      window.location.href = '/login';
    }
  }
}

function updateDashboardStats(user, products, orders) {
  // Total products
  const totalProducts = document.querySelector('.stat-total-products');
  if (totalProducts) {
    totalProducts.textContent = products.pagination?.total || 0;
  }

  // Total orders
  const totalOrders = document.querySelector('.stat-total-orders');
  if (totalOrders) {
    totalOrders.textContent = orders.pagination?.total || 0;
  }

  // Calculate sales
  const totalSales = orders.orders?.reduce((sum, order) => {
    return sum + parseFloat(order.total_amount);
  }, 0) || 0;

  const salesEl = document.querySelector('.stat-total-sales');
  if (salesEl) {
    salesEl.textContent = formatCurrency(totalSales);
  }

  // Calculate earnings (90% after 10% commission)
  const totalEarnings = orders.orders?.reduce((sum, order) => {
    return sum + parseFloat(order.seller_amount);
  }, 0) || 0;

  const earningsEl = document.querySelector('.stat-total-earnings');
  if (earningsEl) {
    earningsEl.textContent = formatCurrency(totalEarnings);
  }
}

// Cart Page Functions
async function loadCart() {
  try {
    const data = await apiCall('/cart');
    return data;
  } catch (error) {
    console.error('Load cart error:', error);
    return { items: [], total: 0, itemCount: 0 };
  }
}

async function updateCartItemQuantity(cartItemId, quantity) {
  try {
    await apiCall(`/cart/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
    loadCartPage();
    updateCartCount();
  } catch (error) {
    console.error('Update cart item error:', error);
  }
}

async function removeCartItem(cartItemId) {
  try {
    await apiCall(`/cart/${cartItemId}`, {
      method: 'DELETE'
    });
    showToast('Item removed from cart');
    loadCartPage();
    updateCartCount();
  } catch (error) {
    console.error('Remove cart item error:', error);
  }
}

async function clearCart() {
  try {
    await apiCall('/cart', {
      method: 'DELETE'
    });
    showToast('Cart cleared');
    loadCartPage();
    updateCartCount();
  } catch (error) {
    console.error('Clear cart error:', error);
  }
}

async function loadCartPage() {
  const cartData = await loadCart();
  const cartContainer = document.querySelector('.cart-items');
  const cartTotal = document.querySelector('.cart-total-amount');
  const cartItemCount = document.querySelector('.cart-item-count');

  if (cartContainer) {
    cartContainer.innerHTML = '';

    if (cartData.items.length === 0) {
      cartContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    } else {
      cartData.items.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
          <div class="cart-item-info">
            <h4 class="cart-item-name">${item.name}</h4>
            <p class="cart-item-price">${formatCurrency(item.price)}</p>
            <p>Seller: ${item.seller_name}</p>
          </div>
          <div class="cart-item-quantity">
            <button class="quantity-btn" onclick="updateCartItemQuantity(${item.cart_id}, ${item.quantity - 1})">-</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn" onclick="updateCartItemQuantity(${item.cart_id}, ${item.quantity + 1})">+</button>
          </div>
          <button class="remove-btn" onclick="removeCartItem(${item.cart_id})">Remove</button>
        `;
        cartContainer.appendChild(cartItem);
      });
    }
  }

  if (cartTotal) {
    cartTotal.textContent = formatCurrency(cartData.total);
  }

  if (cartItemCount) {
    cartItemCount.textContent = cartData.itemCount;
  }
}

// Payment Functions
async function initializePayment(orderNumber, email, amount) {
  try {
    const result = await apiCall('/payment/initialize', {
      method: 'POST',
      body: JSON.stringify({ orderNumber, email, amount })
    });

    if (result.authorizationUrl) {
      window.location.href = result.authorizationUrl;
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
  }
}

// Search and Filter Functions
function setupSearchAndFilter() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-select');
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  const searchButton = document.getElementById('search-button');

  const productGrid = document.getElementById('product-grid');

  if (searchButton && productGrid) {
    searchButton.addEventListener('click', () => {
      const params = {};
      
      if (searchInput?.value) {
        params.search = searchInput.value;
      }
      
      if (categorySelect?.value) {
        params.category = categorySelect.value;
      }
      
      if (minPriceInput?.value) {
        params.minPrice = minPriceInput.value;
      }
      
      if (maxPriceInput?.value) {
        params.maxPrice = maxPriceInput.value;
      }

      loadProducts(productGrid, params);
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  setupSearchAndFilter();

  // Check current page and load appropriate data
  const currentPath = window.location.pathname;

  if (currentPath === '/dashboard') {
    loadDashboard();
  } else if (currentPath === '/cart') {
    loadCartPage();
  } else if (currentPath === '/products') {
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
      loadProducts(productGrid);
    }
  }
});