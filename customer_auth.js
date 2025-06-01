/**
 * Updated Customer Authentication for QUP Frontend
 * Works with the fixed backend authentication system
 */

class CustomerAuth {
    constructor() {
        this.apiBase = "https://qupcore-supercode-692478335867.us-central1.run.app";
        this.apiKey = "UwCNmn3I0XxmJ15nRxu6dkPIqAz46dxOb4ljz0-SRlc"; // Will be loaded from environment
        this.init();
    }

    init() {
        // Check if we're on a protected page
        const protectedPages = ['admin.html', 'barista.html'];
        const currentPage = window.location.pathname.split('/').pop();

        if (protectedPages.includes(currentPage)) {
            this.checkAuthentication();
        }
    }

    checkAuthentication() {
        const token = localStorage.getItem('qup_auth_token');
        const customer = localStorage.getItem('qup_customer');

        if (!token || !customer) {
            this.showLoginModal();
        } else {
            // Verify token is still valid
            this.verifyToken(token).then(valid => {
                if (valid) {
                    this.showCustomerInfo(customer);
                } else {
                    // Token expired, show login again
                    this.clearAuth();
                    this.showLoginModal();
                }
            });
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.apiBase}/api/v1/queue/list?admin=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.status === 200;
        } catch {
            return false;
        }
    }

    clearAuth() {
        localStorage.removeItem('qup_auth_token');
        localStorage.removeItem('qup_customer');
        localStorage.removeItem('qup_username');
    }

    showLoginModal() {
        const overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;

        const loginForm = document.createElement('div');
        loginForm.style.cssText = `
            background: white; padding: 40px; border-radius: 15px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2); width: 400px; max-width: 90vw;
        `;

        loginForm.innerHTML = `
            <h2 style="color: #667eea; margin-bottom: 20px; text-align: center;">
                🚀 QUP Admin Login
            </h2>
            <p style="color: #666; text-align: center; margin-bottom: 20px;">
                Secure authentication for queue management
            </p>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                    Customer:
                </label>
                <select id="customerSelect" style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px;">
                    <option value="">Select Customer...</option>
                    <option value="demo">Demo Customer</option>
                    <option value="premium">Premium Customer</option>
                    <option value="enterprise">Enterprise Customer</option>
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                    Username:
                </label>
                <input type="text" id="username" value="admin" 
                       style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px;">
            </div>

            <div style="margin-bottom: 30px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                    Password:
                </label>
                <input type="password" id="password" placeholder="Enter password"
                       style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px;">
            </div>

            <button id="loginBtn" style="width: 100%; background: linear-gradient(45deg, #667eea, #764ba2); 
                    color: white; border: none; padding: 15px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                <span id="loginText">Login to Dashboard</span>
                <span id="loginSpinner" style="display: none;">🔄 Authenticating...</span>
            </button>

            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; color: #666;">
                <strong>🔐 Secure Authentication</strong><br>
                Credentials are environment-based for security.<br>
                Contact admin for access credentials.
            </div>

            <div id="loginError" style="margin-top: 15px; padding: 10px; background: #ff6b6b; 
                 color: white; border-radius: 6px; display: none;"></div>
        `;

        overlay.appendChild(loginForm);
        document.body.appendChild(overlay);

        // Handle login
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        // Allow Enter key
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Focus on customer select
        document.getElementById('customerSelect').focus();
    }

    async handleLogin() {
        const customer = document.getElementById('customerSelect').value;
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!customer || !username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.setLoading(true);

        try {
            // Call the fixed v1 auth endpoint
            const response = await fetch(`${this.apiBase}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
                // Store auth info
                localStorage.setItem('qup_auth_token', data.access_token);
                localStorage.setItem('qup_customer', customer);
                localStorage.setItem('qup_username', username);

                // Remove modal
                document.getElementById('auth-overlay').remove();
                
                // Show customer info
                this.showCustomerInfo(customer);
                
                this.showToast('Login successful!', 'success');
                
                // Test the connection
                this.testConnection();
            } else {
                this.showError(data.error || 'Login failed');
            }
        } catch (error) {
            this.showError('Connection failed. Please check your network.');
            console.error('Login error:', error);
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        const btn = document.getElementById('loginBtn');
        const text = document.getElementById('loginText');
        const spinner = document.getElementById('loginSpinner');
        
        btn.disabled = loading;
        text.style.display = loading ? 'none' : 'inline';
        spinner.style.display = loading ? 'inline' : 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 5000);
    }

    showCustomerInfo(customer) {
        // Remove any existing banner
        const existingBanner = document.getElementById('customer-banner');
        if (existingBanner) existingBanner.remove();

        const banner = document.createElement('div');
        banner.id = 'customer-banner';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0;
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white; padding: 10px 20px; z-index: 1000;
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;

        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span>🚀 QUP Dashboard - ${customer.charAt(0).toUpperCase() + customer.slice(1)} Customer</span>
                <span id="connection-status" style="padding: 4px 8px; background: rgba(255,255,255,0.2); 
                      border-radius: 12px; font-size: 0.8em;">🔗 Connected</span>
            </div>
            <button onclick="customerAuth.logout()" style="background: rgba(255,255,255,0.2); 
                    border: none; color: white; padding: 5px 15px; border-radius: 15px; cursor: pointer;">
                Logout
            </button>
        `;

        document.body.appendChild(banner);
        document.body.style.paddingTop = '50px';
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            const data = await response.json();
            
            const statusEl = document.getElementById('connection-status');
            if (statusEl) {
                if (data.status === 'healthy') {
                    statusEl.innerHTML = '✅ Connected';
                    statusEl.style.background = 'rgba(81, 207, 102, 0.8)';
                } else {
                    statusEl.innerHTML = '⚠️ Degraded';
                    statusEl.style.background = 'rgba(255, 212, 59, 0.8)';
                }
            }
        } catch (error) {
            const statusEl = document.getElementById('connection-status');
            if (statusEl) {
                statusEl.innerHTML = '❌ Offline';
                statusEl.style.background = 'rgba(255, 107, 107, 0.8)';
            }
        }
    }

    logout() {
        this.clearAuth();
        
        // Remove banner
        const banner = document.getElementById('customer-banner');
        if (banner) banner.remove();
        
        // Reset body padding
        document.body.style.paddingTop = '0';
        
        this.showToast('Logged out successfully', 'info');
        
        // Redirect or reload
        window.location.reload();
    }

    // Helper methods for the pages
    getAuthToken() {
        return localStorage.getItem('qup_auth_token');
    }

    getApiKey() {
        return this.apiKey;
    }

    getCustomerInfo() {
        return {
            name: localStorage.getItem('qup_customer'),
            username: localStorage.getItem('qup_username'),
            token: localStorage.getItem('qup_auth_token')
        };
    }

    async apiCall(endpoint, method = 'GET', data = null, useAuth = false) {
        const headers = { 'Content-Type': 'application/json' };

        if (useAuth) {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('No authentication token available');
            }
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            headers['X-API-Key'] = this.apiKey;
        }

        const config = { method, headers };
        if (data) config.body = JSON.stringify(data);

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, config);
            
            // Handle 401 errors by clearing auth and redirecting to login
            if (response.status === 401) {
                this.clearAuth();
                if (useAuth) {
                    this.showLoginModal();
                }
                throw new Error('Authentication required');
            }
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            return result;
        } catch (error) {
            this.showToast(`API Error: ${error.message}`, 'error');
            throw error;
        }
    }

    showToast(message, type = 'success') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.auth-toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = 'auth-toast';
        toast.style.cssText = `
            position: fixed; top: 70px; right: 20px;
            background: ${this.getToastColor(type)};
            color: white; padding: 15px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10001;
            transform: translateX(400px); transition: transform 0.3s;
            max-width: 300px; font-weight: 600;
        `;

        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, type === 'error' ? 5000 : 3000);
    }

    getToastColor(type) {
        const colors = {
            'success': '#51cf66',
            'error': '#ff6b6b',
            'warning': '#ffd43b',
            'info': '#339af0'
        };
        return colors[type] || colors.info;
    }

    // Utility method to check if user is authenticated
    isAuthenticated() {
        return !!this.getAuthToken();
    }

    // Utility method to check if user is admin
    isAdmin() {
        const token = this.getAuthToken();
        if (!token) return false;
        
        try {
            // Simple JWT decode (not for security, just for UI)
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.is_admin || payload.role === 'admin';
        } catch {
            return false;
        }
    }
}

// Initialize customer auth
const customerAuth = new CustomerAuth();

// Make it globally available
window.customerAuth = customerAuth;

// Add some global error handling
window.addEventListener('unhandledrejection', event => {
    if (event.reason && event.reason.message && event.reason.message.includes('401')) {
        console.log('Authentication error detected, clearing auth state');
        customerAuth.clearAuth();
    }
});

// Auto-refresh connection status every 30 seconds
setInterval(() => {
    if (customerAuth.isAuthenticated()) {
        customerAuth.testConnection();
    }
}, 30000);
