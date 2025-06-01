// Authentication check for admin panel
(function() {
    // Check if user is authenticated
    const token = localStorage.getItem('qup_auth_token');
    const customer = localStorage.getItem('qup_customer');
    const username = localStorage.getItem('qup_username');

    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }

    // Update page title with customer info
    if (customer) {
        document.title = `QUP Admin - ${customer.charAt(0).toUpperCase() + customer.slice(1)} Customer`;
    }

    // Add logout functionality
    window.logout = function() {
        localStorage.removeItem('qup_auth_token');
        localStorage.removeItem('qup_customer');
        localStorage.removeItem('qup_username');
        window.location.href = 'login.html';
    };

    // Update API calls to use stored token
    window.getAuthToken = function() {
        return localStorage.getItem('qup_auth_token');
    };

    // Add customer info to header
    document.addEventListener('DOMContentLoaded', function() {
        const header = document.querySelector('.header h1');
        if (header && customer) {
            header.innerHTML = `🚀 QUP SuperCode Admin - ${customer.charAt(0).toUpperCase() + customer.slice(1)}`;
        }

        // Add logout button to header
        const headerDiv = document.querySelector('.header');
        if (headerDiv) {
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = 'Logout';
            logoutBtn.className = 'btn btn-danger';
            logoutBtn.onclick = logout;
            logoutBtn.style.position = 'absolute';
            logoutBtn.style.top = '20px';
            logoutBtn.style.right = '20px';
            logoutBtn.style.width = 'auto';
            headerDiv.style.position = 'relative';
            headerDiv.appendChild(logoutBtn);
        }
    });
})();
