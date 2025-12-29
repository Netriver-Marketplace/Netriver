// Netriver Marketplace - Dashboard JavaScript

// Dashboard data
let dashboardData = {
    user: null,
    products: [],
    orders: []
};

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Remove active class from all tabs and buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Load data for the tab
        if (tabId === 'products') {
            loadProducts();
        } else if (tabId === 'orders') {
            loadOrders();
        } else if (tabId === 'profile') {
            loadProfile();
        }
    });
});

// Load dashboard data
async function loadDashboard() {
    try {
        // Load user data
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
            throw new Error('Not authenticated');
        }
        dashboardData.user = await userResponse.json();

        // Load products
        const productsResponse = await fetch('/api/products/seller/my-products');
        const productsData = await productsResponse.json();
        dashboardData.products = productsData.products || [];

        // Load orders
        const ordersResponse = await fetch('/api/orders/seller/my-orders');
        const ordersData = await ordersResponse.json();
        dashboardData.orders = ordersData.orders || [];

        // Update UI
        updateDashboardUI();
        loadProducts(); // Load products tab by default

    } catch (error) {
        console.error('Load dashboard error:', error);
        if (error.message === 'Not authenticated') {
            showToast('Please login to access your dashboard', 'error');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        }
    }
}

// Update dashboard UI
function updateDashboardUI() {
    // Update business name
    const businessNameEl = document.querySelector('.business-name');
    if (businessNameEl && dashboardData.user) {
        businessNameEl.textContent = dashboardData.user.business_name;
    }

    // Update stats
    const totalProducts = dashboardData.products.length;
    const totalOrders = dashboardData.orders.length;
    const totalSales = dashboardData.orders.reduce((sum, order) => {
        return sum + parseFloat(order.total_amount || 0);
    }, 0);
    const totalEarnings = dashboardData.orders.reduce((sum, order) => {
        return sum + parseFloat(order.seller_amount || 0);
    }, 0);

    const statProductsEl = document.querySelector('.stat-total-products');
    const statOrdersEl = document.querySelector('.stat-total-orders');
    const statSalesEl = document.querySelector('.stat-total-sales');
    const statEarningsEl = document.querySelector('.stat-total-earnings');

    if (statProductsEl) statProductsEl.textContent = totalProducts;
    if (statOrdersEl) statOrdersEl.textContent = totalOrders;
    if (statSalesEl) statSalesEl.textContent = formatCurrency(totalSales);
    if (statEarningsEl) statEarningsEl.textContent = formatCurrency(totalEarnings);
}

// Load products table
async function loadProducts() {
    const productsTable = document.getElementById('products-table');
    if (!productsTable) return;

    try {
        const response = await fetch('/api/products/seller/my-products');
        const data = await response.json();
        dashboardData.products = data.products || [];

        if (dashboardData.products.length === 0) {
            productsTable.innerHTML = `
                <div class="empty-state">
                    <p>No products yet. Click "Add New Product" to get started!</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dashboardData.products.forEach(product => {
            const statusClass = product.status === 'active' ? 'status-active' : 
                               product.status === 'sold_out' ? 'status-sold-out' : 'status-inactive';
            const imageUrl = product.image_url || 'https://via.placeholder.com/50x50?text=No+Image';

            html += `
                <tr>
                    <td>
                        <div class="product-cell">
                            <img src="${imageUrl}" alt="${product.name}" class="product-thumbnail" 
                                 onerror="this.src='https://via.placeholder.com/50x50?text=Image'">
                            <div class="product-info">
                                <strong>${product.name}</strong>
                                <small>${product.category}</small>
                            </div>
                        </div>
                    </td>
                    <td>${formatCurrency(product.price)}</td>
                    <td>${product.stock_quantity}</td>
                    <td><span class="status-badge ${statusClass}">${product.status}</span></td>
                    <td>
                        <button class="btn-small btn-edit" onclick="editProduct(${product.id})">Edit</button>
                        <button class="btn-small btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        productsTable.innerHTML = html;

    } catch (error) {
        console.error('Load products error:', error);
        productsTable.innerHTML = '<p class="error">Failed to load products</p>';
    }
}

// Load orders table
async function loadOrders() {
    const ordersTable = document.getElementById('orders-table');
    if (!ordersTable) return;

    try {
        const response = await fetch('/api/orders/seller/my-orders');
        const data = await response.json();
        dashboardData.orders = data.orders || [];

        if (dashboardData.orders.length === 0) {
            ordersTable.innerHTML = `
                <div class="empty-state">
                    <p>No orders yet. Your orders will appear here when customers purchase your products.</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        dashboardData.orders.forEach(order => {
            const statusClass = `status-${order.order_status}`;
            
            html += `
                <tr>
                    <td><strong>${order.order_number}</strong></td>
                    <td>
                        <div>${order.customer_name}</div>
                        <small>${order.customer_email}</small>
                    </td>
                    <td>${order.product_name || 'Multiple products'}</td>
                    <td>${formatCurrency(order.total_amount)}</td>
                    <td>
                        <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                            <option value="pending" ${order.order_status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.order_status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="processing" ${order.order_status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.order_status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.order_status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.order_status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td>${formatDate(order.created_at)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        ordersTable.innerHTML = html;

    } catch (error) {
        console.error('Load orders error:', error);
        ordersTable.innerHTML = '<p class="error">Failed to load orders</p>';
    }
}

// Load profile
async function loadProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent) return;

    try {
        const response = await fetch('/api/auth/me');
        const user = await response.json();

        profileContent.innerHTML = `
            <div class="profile-form">
                <h3>Business Information</h3>
                <div class="form-group">
                    <label>Business Name:</label>
                    <input type="text" value="${user.business_name}" readonly>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" value="${user.email}" readonly>
                </div>
                <div class="form-group">
                    <label>Phone:</label>
                    <input type="tel" value="${user.phone}" readonly>
                </div>
                <div class="form-group">
                    <label>Business Address:</label>
                    <textarea readonly>${user.business_address}</textarea>
                </div>
                <div class="form-group">
                    <label>State:</label>
                    <input type="text" value="${user.state}" readonly>
                </div>
                <div class="form-group">
                    <label>City:</label>
                    <input type="text" value="${user.city}" readonly>
                </div>
                <div class="form-group">
                    <label>Business Description:</label>
                    <textarea readonly>${user.business_description || 'Not provided'}</textarea>
                </div>
                <div class="form-group">
                    <label>Member Since:</label>
                    <input type="text" value="${formatDate(user.created_at)}" readonly>
                </div>
                <div class="form-group">
                    <label>Last Login:</label>
                    <input type="text" value="${user.last_login ? formatDate(user.last_login) : 'Never'}" readonly>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Load profile error:', error);
        profileContent.innerHTML = '<p class="error">Failed to load profile</p>';
    }
}

// Add product
document.getElementById('add-product-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Product added successfully!', 'success');
            closeModal('add-product-modal');
            this.reset();
            loadDashboard();
        } else {
            showToast(result.error || 'Failed to add product', 'error');
        }
    } catch (error) {
        showToast('Failed to add product', 'error');
        console.error('Add product error:', error);
    }
});

// Edit product
function editProduct(productId) {
    const product = dashboardData.products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-description').value = product.description;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-stock').value = product.stock_quantity;
    document.getElementById('edit-product-image').value = product.image_url || '';

    document.getElementById('edit-product-modal').style.display = 'block';
}

// Update product
document.getElementById('edit-product-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    const productId = data.id;
    delete data.id;
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Product updated successfully!', 'success');
            closeModal('edit-product-modal');
            loadDashboard();
        } else {
            showToast(result.error || 'Failed to update product', 'error');
        }
    } catch (error) {
        showToast('Failed to update product', 'error');
        console.error('Update product error:', error);
    }
});

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Product deleted successfully!', 'success');
            loadDashboard();
        } else {
            showToast(result.error || 'Failed to delete product', 'error');
        }
    } catch (error) {
        showToast('Failed to delete product', 'error');
        console.error('Delete product error:', error);
    }
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderStatus: status })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast('Order status updated!', 'success');
            loadDashboard();
        } else {
            showToast(result.error || 'Failed to update order status', 'error');
        }
    } catch (error) {
        showToast('Failed to update order status', 'error');
        console.error('Update order status error:', error);
    }
}

// Modal functions
function showAddProductModal() {
    document.getElementById('add-product-modal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async function(e) {
    e.preventDefault();
    
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            showToast('Logged out successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
});

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});