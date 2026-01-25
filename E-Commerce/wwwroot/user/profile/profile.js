// profile.js - Elegant Stitch Theme
document.addEventListener('DOMContentLoaded', function () {
    console.log('Profile page loaded - Elegant Stitch Theme');

    // Initialize profile functionality
    initializeProfilePage();
    loadUserStats();
    loadActivity();

    // Navigation between sections
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));

            // Add active class to clicked item
            this.classList.add('active');

            // Get target section
            const sectionId = this.dataset.section;
            showSection(sectionId);
        });
    });

    // Form validation for change password
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        setupPasswordValidation();
    }

    // Theme switching
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const theme = this.dataset.theme;
            switchTheme(theme);
        });
    });

    // Toggle switches
    const toggleSwitches = document.querySelectorAll('.switch input');
    toggleSwitches.forEach(switchElement => {
        switchElement.addEventListener('change', function () {
            const setting = this.parentElement.parentElement.querySelector('span').textContent;
            savePreference(setting, this.checked);

            // Show toast notification
            const status = this.checked ? 'enabled' : 'disabled';
            showToast(`${setting} ${status}`, 'success');
        });
    });

    // Add scroll effect to header
    window.addEventListener('scroll', function () {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});

// Initialize profile page
function initializeProfilePage() {
    // Check for success/error messages in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success) {
        showToast(decodeURIComponent(success), 'success');
    }

    if (error) {
        showToast(decodeURIComponent(error), 'error');
    }

    // Set initial active section based on URL hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        const navItem = document.querySelector(`.nav-item[data-section="${hash}"]`);
        if (navItem) {
            navItem.click();
        }
    }
}

// Load user statistics
async function loadUserStats() {
    try {
        const response = await fetch('/Profile/GetUserStats');
        const result = await response.json();

        if (result.success) {
            // Update account age
            const accountAgeElement = document.getElementById('accountAge');
            if (accountAgeElement && result.stats.accountAge) {
                accountAgeElement.textContent = result.stats.accountAge;
            }

            // Update last login
            const lastLoginElement = document.getElementById('lastLoginTime');
            if (lastLoginElement && result.stats.lastLogin) {
                lastLoginElement.textContent = result.stats.lastLogin;
            }

            // Update other stats
            const statCards = document.querySelectorAll('.stat-number');
            if (statCards.length >= 4 && result.stats) {
                // This is just an example - you would replace with actual data
                statCards[0].textContent = result.stats.totalOrders || '0';
                statCards[1].textContent = result.stats.wishlistItems || '0';
                statCards[2].textContent = result.stats.reviewsWritten || '0';
            }
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
        showToast('Unable to load statistics', 'error');
    }
}

// Load user activity
async function loadActivity() {
    try {
        // In a real application, you would fetch from an API
        // For now, we'll simulate with static data
        const activityData = [
            {
                icon: 'fa-shopping-cart',
                text: 'Order #EST12345 placed successfully',
                time: '2 hours ago'
            },
            {
                icon: 'fa-heart',
                text: 'Added "Blue Embroidered Anarkali" to wishlist',
                time: '1 day ago'
            },
            {
                icon: 'fa-star',
                text: 'Reviewed "Pink Floral Palazzo Set" with 5 stars',
                time: '3 days ago'
            },
            {
                icon: 'fa-user-edit',
                text: 'Updated profile information',
                time: '1 week ago'
            }
        ];

        const activityList = document.getElementById('activityList');
        if (activityList) {
            let html = '';

            activityData.forEach(activity => {
                html += `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="fas ${activity.icon}"></i>
                        </div>
                        <div class="activity-content">
                            <p>${activity.text}</p>
                            <span class="activity-time">${activity.time}</span>
                        </div>
                    </div>
                `;
            });

            activityList.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        const activityList = document.getElementById('activityList');
        if (activityList) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <p>Unable to load recent activity</p>
                        <span class="activity-time">Try again later</span>
                    </div>
                </div>
            `;
        }
    }
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.profile-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update URL hash
    window.history.pushState(null, null, `#${sectionId}`);
}

// Setup password validation
function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('NewPassword');
    const confirmPasswordInput = document.getElementById('ConfirmPassword');
    const submitButton = document.querySelector('#changePasswordForm .btn-save');

    if (newPasswordInput && confirmPasswordInput && submitButton) {
        newPasswordInput.addEventListener('input', function () {
            validatePassword(this.value);
            validatePasswordMatch();
        });

        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

// Validate password strength
function validatePassword(password) {
    const requirements = {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
    };

    // Update requirement indicators
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        if (element) {
            if (requirements[req]) {
                element.classList.add('valid');
                element.innerHTML = `<i class="fas fa-check"></i> ${element.textContent.replace('✓ ', '')}`;
            } else {
                element.classList.remove('valid');
                element.innerHTML = element.textContent.replace('✓ ', '');
            }
        }
    });

    // Update strength bar and text
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.getElementById('strengthText');

    let strength = 0;
    if (requirements.length) strength += 25;
    if (requirements.uppercase) strength += 25;
    if (requirements.lowercase) strength += 25;
    if (requirements.number) strength += 25;

    if (strengthBar) {
        // Remove all classes
        strengthBar.className = 'strength-bar';

        // Add appropriate class
        if (strength < 50) {
            strengthBar.classList.add('weak');
        } else if (strength < 75) {
            strengthBar.classList.add('medium');
        } else {
            strengthBar.classList.add('strong');
        }

        // Update width
        strengthBar.style.setProperty('--width', `${strength}%`);
    }

    if (strengthText) {
        strengthText.textContent = getStrengthLabel(strength);
        strengthText.style.color = getStrengthColor(strength);
    }

    return strength >= 50; // Require at least medium strength
}

function getStrengthColor(strength) {
    if (strength < 50) return '#ff6b6b'; // Red
    if (strength < 75) return '#ffc107'; // Yellow
    return '#28a745'; // Green
}

function getStrengthLabel(strength) {
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Medium';
    return 'Strong';
}

// Validate password match
function validatePasswordMatch() {
    const newPassword = document.getElementById('NewPassword')?.value;
    const confirmPassword = document.getElementById('ConfirmPassword')?.value;
    const submitButton = document.querySelector('#changePasswordForm .btn-save');

    if (!newPassword || !confirmPassword || !submitButton) return;

    const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
    const isStrong = validatePassword(newPassword);

    submitButton.disabled = !(passwordsMatch && isStrong);

    // Visual feedback for password match
    const confirmInput = document.getElementById('ConfirmPassword');
    if (confirmInput) {
        if (confirmPassword.length > 0) {
            if (passwordsMatch) {
                confirmInput.style.borderColor = '#28a745';
            } else {
                confirmInput.style.borderColor = '#ff6b6b';
            }
        } else {
            confirmInput.style.borderColor = '#e0d7d1';
        }
    }
}

// Switch theme
function switchTheme(theme) {
    // Update active button
    const themeButtons = document.querySelectorAll('.theme-option');
    themeButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.theme === theme) {
            button.classList.add('active');
        }
    });

    // Apply theme
    document.body.setAttribute('data-theme', theme);

    // Save preference
    savePreference('theme', theme);

    showToast(`Theme switched to ${theme} mode`, 'success');
}

// Save preference
function savePreference(key, value) {
    // In a real application, you would save to the server
    // For now, we'll save to localStorage
    try {
        const preferences = JSON.parse(localStorage.getItem('elegantStitchPreferences') || '{}');
        preferences[key] = value;
        localStorage.setItem('elegantStitchPreferences', JSON.stringify(preferences));

        console.log(`Preference saved: ${key} = ${value}`);
    } catch (error) {
        console.error('Error saving preference:', error);
    }
}

// Modal functions
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();

        // Reset strength bar
        const strengthBar = modal.querySelector('.strength-bar');
        if (strengthBar) {
            strengthBar.className = 'strength-bar';
            strengthBar.style.setProperty('--width', '0%');
        }

        // Reset requirement indicators
        const requirements = modal.querySelectorAll('.password-requirements li');
        requirements.forEach(req => {
            req.classList.remove('valid');
            req.innerHTML = req.textContent.replace('✓ ', '');
        });
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Reset confirmation input
        const confirmInput = modal.querySelector('#confirmText');
        if (confirmInput) {
            confirmInput.value = '';
            confirmInput.style.borderColor = '#ff6b6b';
        }

        // Reset error message
        const errorElement = modal.querySelector('#confirmError');
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        // Disable delete button
        const deleteButton = modal.querySelector('.btn-delete');
        if (deleteButton) {
            deleteButton.disabled = true;
        }
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function openSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    const titleElement = document.getElementById('successTitle');
    const messageElement = document.getElementById('successMessage');

    if (modal && titleElement && messageElement) {
        titleElement.textContent = title;
        messageElement.textContent = message;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Validate delete confirmation
function validateDeleteConfirmation() {
    const confirmInput = document.getElementById('confirmText');
    const deleteButton = document.querySelector('#deleteAccountForm .btn-delete');
    const errorElement = document.getElementById('confirmError');

    if (!confirmInput || !deleteButton || !errorElement) return;

    const inputValue = confirmInput.value.trim();

    if (inputValue === 'DELETE') {
        deleteButton.disabled = false;
        errorElement.style.display = 'none';
        confirmInput.style.borderColor = '#28a745';
    } else {
        deleteButton.disabled = true;
        if (inputValue.length > 0) {
            errorElement.textContent = 'Please type DELETE exactly as shown';
            errorElement.style.display = 'block';
            confirmInput.style.borderColor = '#ff6b6b';
        } else {
            errorElement.style.display = 'none';
            confirmInput.style.borderColor = '#ff6b6b';
        }
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggleButton = input.parentElement.querySelector('.toggle-password i');

    if (!input || !toggleButton) return;

    if (input.type === 'password') {
        input.type = 'text';
        toggleButton.className = 'fas fa-eye-slash';
        toggleButton.style.color = '#b76e79';
    } else {
        input.type = 'password';
        toggleButton.className = 'fas fa-eye';
        toggleButton.style.color = '';
    }
}


// Load activity function for refresh button
function loadActivity() {
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
    }

    // Simulate API call
    setTimeout(() => {
        // This would be replaced with actual API call
        showToast('Activity refreshed successfully', 'success');

        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshBtn.disabled = false;
        }
    }, 1500);
}

// Handle form submission with AJAX
document.addEventListener('submit', function (e) {
    if (e.target.id === 'changePasswordForm' || e.target.id === 'deleteAccountForm') {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok');
            })
            .then(data => {
                if (data.success) {
                    showToast(data.message, 'success');

                    if (form.id === 'changePasswordForm') {
                        closePasswordModal();
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else if (form.id === 'deleteAccountForm') {
                        closeDeleteModal();
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1500);
                    }
                } else {
                    showToast(data.message || 'An error occurred', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
    }
});