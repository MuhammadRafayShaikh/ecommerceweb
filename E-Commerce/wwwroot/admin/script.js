// Global variables
let revenueChartInstance = null;
let categoryChartInstance = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardStats();
    loadRevenueChart();
    loadCategoryChart();
    loadRecentOrders();
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/Admin/GetDashboardStats');
        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();

        // Animate counters
        animateCounter('revenue', data.totalRevenue);
        animateCounter('orders', data.totalOrders);
        animateCounter('customers', data.totalCustomers);
        document.getElementById('conversion').textContent = data.conversionRate + '%';

        // Update changes
        updateChangeIndicator('revenueChange', data.revenueChange);
        updateChangeIndicator('ordersChange', data.ordersChange);
        updateChangeIndicator('customersChange', data.customersChange);
        updateChangeIndicator('conversionChange', data.conversionChange);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('Failed to load dashboard statistics', 'danger');
    }
}

// Load revenue chart
function loadRevenueChart() {
    const days = document.getElementById('revenueTimeFilter').value;

    $.ajax({
        url: `/Admin/GetRevenueData?days=${days}`,
        type: 'GET',
        success: function (data) {

            const ctx = document.getElementById('revenueChart').getContext('2d');

            // Destroy previous chart
            if (revenueChartInstance) {
                revenueChartInstance.destroy();
            }

            revenueChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: data.values,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: value => '₹' + (value / 1000).toFixed(0) + 'k'
                            }
                        }
                    }
                }
            });
        },
        error: function () {
            console.error('Error loading revenue chart');
            showNotification('Failed to load revenue chart', 'danger');
        }
    });
}


// Load category chart
async function loadCategoryChart() {
    const period = document.getElementById('categoryTimeFilter').value;

    try {
        const response = await fetch(`/Admin/GetCategorySales?period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch category data');

        const data = await response.json();

        const ctx = document.getElementById('categoryChart').getContext('2d');

        // Destroy previous chart if exists
        if (categoryChartInstance) {
            categoryChartInstance.destroy();
        }

        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        'rgba(156, 39, 176, 0.8)',
                        'rgba(255, 64, 129, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(33, 150, 243, 0.8)',
                        'rgba(103, 58, 183, 0.8)',
                        'rgba(0, 150, 136, 0.8)',
                        'rgba(205, 220, 57, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });

    } catch (error) {
        console.error('Error loading category chart:', error);
        showNotification('Failed to load category chart', 'danger');
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const response = await fetch('/Admin/GetRecentOrders');
        if (!response.ok) throw new Error('Failed to fetch recent orders');

        const orders = await response.json();
        const ordersTableBody = document.getElementById('ordersTableBody');
        ordersTableBody.innerHTML = '';

        if (orders.length === 0) {
            ordersTableBody.innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                                <i class="fas fa-shopping-cart fa-2x" style="margin-bottom: 10px; color: #ddd;"></i>
                                <p>No recent orders found</p>
                            </td>
                        </tr>
                    `;
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            const orderDate = new Date(order.createdAt);
            const formattedDate = orderDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            // Get status class
            let statusClass = '';
            switch (order.status) {
                case 4: // Delivered
                    statusClass = 'delivered';
                    break;
                case 1: // Confirmed
                case 3: // Shipped
                    statusClass = 'processing';
                    break;
                case 2: // Cancelled
                    statusClass = 'cancelled';
                    break;
                default: // Pending
                    statusClass = 'pending';
            }

            // Get status text
            let statusText = '';
            switch (order.status) {
                case 0: statusText = 'Pending'; break;
                case 1: statusText = 'Confirmed'; break;
                case 2: statusText = 'Cancelled'; break;
                case 3: statusText = 'Shipped'; break;
                case 4: statusText = 'Delivered'; break;
                default: statusText = 'Pending';
            }

            row.innerHTML = `
                        <td><strong>${order.orderNumber || `ORD-${order.id}`}</strong></td>
                        <td>
                            <div class="customer-cell">
                                <div class="customer-avatar">${order.user?.name?.charAt(0) || 'U'}</div>
                                <div>${order.user?.name || 'Customer'}</div>
                            </div>
                        </td>
                        <td>${formattedDate}</td>
                        <td><strong>₹${(order.grandTotal || 0).toLocaleString('en-IN')}</strong></td>
                        <td><span class="status ${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="view-btn" onclick="viewOrder(${order.id})" title="View Order">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    `;
            ordersTableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading recent orders:', error);
        const ordersTableBody = document.getElementById('ordersTableBody');
        ordersTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px; color: #dc3545;">
                            <i class="fas fa-exclamation-circle fa-2x" style="margin-bottom: 10px;"></i>
                            <p>Failed to load recent orders</p>
                        </td>
                    </tr>
                `;
    }
}

// View order details
function viewOrder(orderId) {
    window.open(`/Order/Details/${orderId}`, '_blank');
}

// Helper functions
function animateCounter(elementId, targetValue, duration = 1500) {
    const element = document.getElementById(elementId);
    const currentText = element.textContent.replace(/[^0-9.]/g, '');
    const currentValue = parseFloat(currentText) || 0;
    const increment = (targetValue - currentValue) / (duration / 16);
    let currentAnimationValue = currentValue;

    const timer = setInterval(() => {
        currentAnimationValue += increment;
        if (Math.abs(currentAnimationValue - targetValue) < Math.abs(increment)) {
            clearInterval(timer);
            element.textContent = formatNumber(targetValue, elementId === 'conversion');
        } else {
            element.textContent = formatNumber(Math.floor(currentAnimationValue), elementId === 'conversion');
        }
    }, 16);
}

function formatNumber(num, isPercentage = false) {
    if (isPercentage) {
        return num.toFixed(1) + '%';
    }

    if (num >= 10000000) { // 1 crore
        return '₹' + (num / 10000000).toFixed(1) + 'Cr';
    } else if (num >= 100000) { // 1 lakh
        return '₹' + (num / 100000).toFixed(1) + 'L';
    } else if (num >= 1000) {
        return '₹' + (num / 1000).toFixed(0) + 'k';
    }
    return '₹' + Math.round(num).toString();
}

function updateChangeIndicator(elementId, changePercentage) {
    const element = document.getElementById(elementId);
    const change = parseFloat(changePercentage);

    if (change > 0) {
        element.className = 'stat-change positive';
        element.innerHTML = `<i class="fas fa-arrow-up"></i> ${Math.abs(change).toFixed(1)}%`;
    } else if (change < 0) {
        element.className = 'stat-change negative';
        element.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(change).toFixed(1)}%`;
    } else {
        element.className = 'stat-change neutral';
        element.innerHTML = `<i class="fas fa-minus"></i> 0%`;
    }
}
// Notification function
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                animation: fadeInUp 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            `;

    // Set color based on type
    if (type === 'success') {
        notification.style.backgroundColor = 'var(--success)';
    } else if (type === 'warning') {
        notification.style.backgroundColor = 'var(--warning)';
    } else if (type === 'info') {
        notification.style.backgroundColor = 'var(--info)';
    } else {
        notification.style.backgroundColor = 'var(--primary)';
    }

    // Add icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-circle';

    notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);

    // Add fadeOut animation
    if (!document.querySelector('style[data-notification]')) {
        const style = document.createElement('style');
        style.setAttribute('data-notification', 'true');
        style.textContent = `
                    @keyframes fadeOut {
                        from { opacity: 1; transform: translateY(0); }
                        to { opacity: 0; transform: translateY(-20px); }
                    }
                `;
        document.head.appendChild(style);
    }
}

//// Remove after 3 seconds (with hover pause)
//let removeTimeout;

//function startRemoveTimer() {
//    removeTimeout = setTimeout(() => {
//        notification.style.animation = 'fadeOut 0.3s ease';
//        setTimeout(() => {
//            if (notification.parentNode) {
//                document.body.removeChild(notification);
//            }
//        }, 300);
//    }, 3000);
//}

//// start timer initially
//startRemoveTimer();

//// pause on hover
//notification.addEventListener('mouseenter', () => {
//    clearTimeout(removeTimeout);
//});

//// resume on mouse leave
//notification.addEventListener('mouseleave', () => {
//    startRemoveTimer();
//});
