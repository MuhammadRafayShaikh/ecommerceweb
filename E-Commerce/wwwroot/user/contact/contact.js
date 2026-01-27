// FAQ Toggle Functionality
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        item.classList.toggle('active');
    });
});

// Form Validation and Submission
document.getElementById('contactForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.text-danger').forEach(el => el.textContent = '');

    // Get form data
    const formData = new FormData(this);

    // Client-side validation
    let isValid = true;

    // Validate Full Name
    const fullName = formData.get('FullName');
    if (!fullName || fullName.trim().length < 2) {
        document.querySelector('[data-valmsg-for="FullName"]').textContent = 'Please enter your full name';
        isValid = false;
    }

    // Validate Email
    const email = formData.get('Email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        document.querySelector('[data-valmsg-for="Email"]').textContent = 'Please enter a valid email address';
        isValid = false;
    }

    // Validate Subject
    const subject = formData.get('Subject');
    if (!subject) {
        document.querySelector('[data-valmsg-for="Subject"]').textContent = 'Please select a subject';
        isValid = false;
    }

    // Validate Message
    const message = formData.get('Message');
    if (!message || message.trim().length < 10) {
        document.querySelector('[data-valmsg-for="Message"]').textContent = 'Please enter a message (at least 10 characters)';
        isValid = false;
    }

   
    if (isValid) {
        const submitButton = $('.submit-button');
        const buttonText = submitButton.find('.button-text');
        const originalText = buttonText.text();

        // Loading state
        buttonText.text('Sending...');
        submitButton.prop('disabled', true);

        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: formData,
            processData: false,   // VERY IMPORTANT
            contentType: false,   // VERY IMPORTANT
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                if (data.success) {
                    showNotification("Message sent successfully! We'll get back to you soon.", 'success');
                    $('#contactForm')[0].reset();

                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000)
                } else {
                    if (data.errors) {
                        $.each(data.errors, function (key, value) {
                            const errorElement = $(`[data-valmsg-for="${key}"]`);
                            if (errorElement.length) {
                                errorElement.text(value[0]);
                            }
                        });
                    }

                    showNotification(data.message || 'Error sending message. Please try again.', 'error');
                }
            },
            error: function () {
                showNotification('Network error. Please check your connection and try again.', 'error');
            },
            complete: function () {
                // Reset button
                buttonText.text(originalText);
                submitButton.prop('disabled', false);
            }
        });
    }

});

// Notification Function
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Chat Widget Functions
function openChat() {
    document.getElementById('chatWidget').classList.add('active');
}

function closeChat() {
    document.getElementById('chatWidget').classList.remove('active');
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (message) {
        // Add user message
        const messagesContainer = document.querySelector('.chat-messages');
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message';
        userMessage.innerHTML = `
            <div class="message-content" style="margin-left: auto;">
                <p style="background: #b76e79; color: white; border-radius: 15px 15px 5px 15px;">${message}</p>
                <span class="message-time">Just now</span>
            </div>
        `;
        messagesContainer.appendChild(userMessage);

        // Clear input
        input.value = '';

        // Simulate bot response
        setTimeout(() => {
            const botResponse = document.createElement('div');
            botResponse.className = 'chat-message bot';
            botResponse.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>Thank you for your message! Our customer support team will respond shortly. In the meantime, you can also email us at support@elegantstitch.com</p>
                    <span class="message-time">Just now</span>
                </div>
            `;
            messagesContainer.appendChild(botResponse);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 1000);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Initialize Google Maps (placeholder - in production, use actual Google Maps API)
function initMap() {
    // This is a placeholder. In production, you would initialize Google Maps here.
    console.log('Google Maps initialization would go here');
}

// Load Google Maps when page loads
document.addEventListener('DOMContentLoaded', initMap);

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);