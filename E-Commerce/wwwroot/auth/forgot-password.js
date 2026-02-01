document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const sendResetLinkBtn = document.getElementById('sendResetLinkBtn');
    const resendLinkBtn = document.getElementById('resendLinkBtn');
    const changeEmailBtn = document.getElementById('changeEmailBtn');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.step');
    const resendModal = document.getElementById('resendModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const timerProgress = document.querySelector('.timer-progress');
    const timerMinutes = document.getElementById('timerMinutes');
    const timerSeconds = document.getElementById('timerSeconds');
    const remainingTime = document.getElementById('remainingTime');
    const sentEmail = document.getElementById('sentEmail');

    // Password strength variables
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const requirements = document.querySelectorAll('.requirement');
    const passwordMatch = document.getElementById('passwordMatch');

    // Current step
    let currentStep = 1;
    let resendTimer = null;
    let countdownTime = 300; // 5 minutes in seconds

    // Initialize
    init();

    function init() {
        // Check if we're coming from reset password link
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const token = urlParams.get('token');

        if (email && token) {
            // Auto-fill and go to step 3
            document.getElementById('resetEmail').value = email;
            document.getElementById('resetToken').value = token;
            goToStep(3);
        }

        // Setup event listeners
        setupEventListeners();

        // Start with step 1
        updateStepIndicator();
    }

    function setupEventListeners() {
        // Form submissions
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', handleForgotPasswordSubmit);
        }

        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', handleResetPasswordSubmit);
        }

        // Button clicks
        if (resendLinkBtn) {
            resendLinkBtn.addEventListener('click', handleResendLink);
        }

        if (changeEmailBtn) {
            changeEmailBtn.addEventListener('click', () => goToStep(1));
        }

        // Password visibility toggle
        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', function () {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // Password strength checker
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', checkPasswordStrength);
        }

        // Password confirmation checker
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', checkPasswordMatch);
        }

        // Modal
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === resendModal) {
                closeModal();
            }
        });

        // Contact support link
        const contactSupportLink = document.getElementById('contactSupport');
        if (contactSupportLink) {
            contactSupportLink.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Support: support@elegantsuits.com | Phone: +91 22 1234 5678', 'info', 5000);
            });
        }
    }

    function handleForgotPasswordSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const token = document.querySelector('input[name="__RequestVerificationToken"]').value;

        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        sendResetLinkBtn.disabled = true;

        $.ajax({
            url: '/Account/ForgotPassword',
            type: 'POST',
            data: {
                Email: email,
                __RequestVerificationToken: token
            },
            success: function (result) {
                if (!result.success) {
                    showToast(result.message, 'error');
                    if (result?.url) {
                        setTimeout(() => {
                            window.location.href = result.url;
                        }, 1200);
                    }
                }
                //showToast('If your email is registered, you will receive a reset link.', 'success');
                goToStep(2);
                startResendTimer();
            },
            error: function () {
                showToast('Something went wrong. Try again.', 'error');
            },
            complete: function () {
                sendResetLinkBtn.disabled = false;
            }
        });
    }


    function handleResetPasswordSubmit(e) {
        e.preventDefault();

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validate password
        if (!validatePassword(newPassword)) {
            showToast('Please ensure your password meets all requirements', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        // Show loading state
        const originalText = resetPasswordBtn.querySelector('.btn-text').textContent;
        resetPasswordBtn.querySelector('.btn-text').textContent = 'Resetting...';
        resetPasswordBtn.disabled = true;

        // In production, this would be an AJAX call
        $.ajax({
            url: '/Account/ResetPassword',
            type: 'POST',
            data: {
                Email: document.getElementById('resetEmail').value,
                Token: document.getElementById('resetToken').value,
                NewPassword: newPassword,
                ConfirmPassword: confirmPassword,
                __RequestVerificationToken: document.querySelector('input[name="__RequestVerificationToken"]').value
            },
            success: function (result) {
                if (result.success) {
                    goToStep(4);
                    showToast('Password reset successfully!', 'success');
                } else {
                    showToast(result.message, 'error');
                }
            },
            error: function () {
                showToast('Something went wrong', 'error');
            },
            complete: function () {
                resetPasswordBtn.querySelector('.btn-text').textContent = originalText;
                resetPasswordBtn.disabled = false;
            }
        });

    }

    function handleResendLink() {
        if (resendTimer) {
            showModal();
            return;
        }

        const email = sentEmail.textContent;
        const token = document.querySelector('input[name="__RequestVerificationToken"]').value;

        const originalHtml = resendLinkBtn.innerHTML;
        resendLinkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resending...';
        resendLinkBtn.disabled = true;

        $.ajax({
            url: '/Account/ResendResetLink',
            type: 'POST',
            data: {
                Email: email,
                __RequestVerificationToken: token
            },
            success: function (result) {
                if (result.success) {
                    showToast('New reset link sent to your email', 'success');
                    startResendTimer();
                } else {
                    showToast(result.message || 'Failed to resend link', 'error');
                }
            },
            error: function () {
                showToast('Network error. Please try again.', 'error');
            },
            complete: function () {
                resendLinkBtn.innerHTML = originalHtml;
                resendLinkBtn.disabled = false;
            }
        });
    }


    function goToStep(stepNumber) {
        // Hide all steps
        steps.forEach(step => {
            step.classList.remove('active');
        });

        // Show current step
        const currentStepElement = document.getElementById(`step${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }

        // Update progress steps
        currentStep = stepNumber;
        updateStepIndicator();

        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateStepIndicator() {
        progressSteps.forEach((step, index) => {
            const stepNumber = index + 1;

            // Remove all classes
            step.classList.remove('active', 'completed');

            // Add appropriate classes
            if (stepNumber < currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === currentStep) {
                step.classList.add('active');
            }
        });
    }

    function checkPasswordStrength() {
        const password = newPasswordInput.value;
        let strength = 0;

        // Check password requirements
        const requirementsMet = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        // Update requirement indicators
        requirements.forEach(req => {
            const type = req.getAttribute('data-requirement');
            const icon = req.querySelector('i');

            if (requirementsMet[type]) {
                req.classList.add('valid');
                icon.className = 'fas fa-check';
                icon.style.color = '#4CAF50';
                strength += 20;
            } else {
                req.classList.remove('valid');
                icon.className = 'fas fa-times';
                icon.style.color = '#f44336';
            }
        });

        // Update strength bar and text
        strengthFill.style.width = `${strength}%`;

        if (strength < 40) {
            strengthFill.style.background = '#f44336';
            strengthText.textContent = 'Weak';
            strengthText.style.color = '#f44336';
        } else if (strength < 80) {
            strengthFill.style.background = '#FF9800';
            strengthText.textContent = 'Medium';
            strengthText.style.color = '#FF9800';
        } else {
            strengthFill.style.background = '#4CAF50';
            strengthText.textContent = 'Strong';
            strengthText.style.color = '#4CAF50';
        }
    }

    function checkPasswordMatch() {
        const password = newPasswordInput.value;
        const confirm = confirmPasswordInput.value;

        if (confirm.length === 0) {
            passwordMatch.classList.remove('show');
            return;
        }

        if (password === confirm) {
            passwordMatch.classList.add('show');
            passwordMatch.innerHTML = '<i class="fas fa-check"></i> Passwords match';
            passwordMatch.style.color = '#4CAF50';
        } else {
            passwordMatch.classList.add('show');
            passwordMatch.innerHTML = '<i class="fas fa-times"></i> Passwords do not match';
            passwordMatch.style.color = '#f44336';
        }
    }

    function startResendTimer() {
        clearInterval(resendTimer);
        countdownTime = 300; // Reset to 5 minutes

        // Update button state
        resendLinkBtn.disabled = true;
        resendLinkBtn.innerHTML = '<i class="fas fa-clock"></i> Wait 5:00';

        // Start countdown
        resendTimer = setInterval(() => {
            countdownTime--;

            const minutes = Math.floor(countdownTime / 60);
            const seconds = countdownTime % 60;

            // Update button text
            resendLinkBtn.innerHTML = `<i class="fas fa-clock"></i> Wait ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Update modal if open
            if (resendModal.style.display === 'flex') {
                updateTimerDisplay(minutes, seconds);
            }

            if (countdownTime <= 0) {
                clearInterval(resendTimer);
                resendTimer = null;
                resendLinkBtn.disabled = false;
                resendLinkBtn.innerHTML = '<i class="fas fa-redo"></i> Resend Link';
            }
        }, 1000);
    }

    function updateTimerDisplay(minutes, seconds) {
        timerMinutes.textContent = minutes.toString().padStart(2, '0');
        timerSeconds.textContent = seconds.toString().padStart(2, '0');

        // Update progress circle
        const progress = (300 - countdownTime) / 300 * 339.292;
        timerProgress.style.strokeDashoffset = 339.292 - progress;

        // Update remaining time text
        remainingTime.textContent = `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    function showModal() {
        // Update timer display with current values
        const minutes = Math.floor(countdownTime / 60);
        const seconds = countdownTime % 60;
        updateTimerDisplay(minutes, seconds);

        // Show modal
        resendModal.style.display = 'flex';
    }

    function closeModal() {
        resendModal.style.display = 'none';
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        return Object.values(requirements).every(req => req);
    }
});