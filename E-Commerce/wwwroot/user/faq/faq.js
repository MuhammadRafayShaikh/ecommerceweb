// FAQ Accordion Functionality
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all FAQ cards
    const faqCards = document.querySelectorAll('.faq-card');

    faqCards.forEach(card => {
        const question = card.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Close all other cards in the same section
            const sectionCards = card.parentElement.querySelectorAll('.faq-card');
            sectionCards.forEach(otherCard => {
                if (otherCard !== card && otherCard.classList.contains('active')) {
                    otherCard.classList.remove('active');
                }
            });

            // Toggle current card
            card.classList.toggle('active');
        });
    });

    // Quick Links Navigation
    const quickLinks = document.querySelectorAll('.quick-link');
    const sections = document.querySelectorAll('.faq-section');

    quickLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href').startsWith('#')) {
                e.preventDefault();

                // Update active state
                quickLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Scroll to section
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);

                if (targetSection) {
                    const offset = 100; // Account for sticky header
                    const targetPosition = targetSection.offsetTop - offset;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Search Functionality
    const searchInput = document.getElementById('faqSearch');
    const searchBtn = document.getElementById('searchBtn');

    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();

        if (searchTerm.length < 2) {
            resetSearch();
            return;
        }

        // Reset all cards first
        resetSearch();

        // Search through all FAQ content
        faqCards.forEach(card => {
            const question = card.querySelector('.faq-question h3').textContent.toLowerCase();
            const answer = card.querySelector('.faq-answer').textContent.toLowerCase();

            if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                // Highlight matching text
                highlightMatches(card, searchTerm);

                // Expand the card and scroll to it
                card.classList.add('active');
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Hide cards that don't match
                card.style.display = 'none';
            }
        });

        // Show search results count
        const visibleCards = document.querySelectorAll('.faq-card[style*="display: block"], .faq-card:not([style])');
        showSearchResults(visibleCards.length, searchTerm);
    }

    function highlightMatches(card, searchTerm) {
        const question = card.querySelector('.faq-question h3');
        const answer = card.querySelector('.faq-answer');

        // Store original text
        const originalQuestion = question.dataset.original || question.innerHTML;
        const originalAnswer = answer.dataset.original || answer.innerHTML;

        question.dataset.original = originalQuestion;
        answer.dataset.original = originalAnswer;

        // Highlight matches in question
        const highlightedQuestion = originalQuestion.replace(
            new RegExp(`(${searchTerm})`, 'gi'),
            '<span class="highlight">$1</span>'
        );

        // Highlight matches in answer
        const highlightedAnswer = originalAnswer.replace(
            new RegExp(`(${searchTerm})`, 'gi'),
            '<span class="highlight">$1</span>'
        );

        question.innerHTML = highlightedQuestion;
        answer.innerHTML = highlightedAnswer;
    }

    function resetSearch() {
        // Reset all cards
        faqCards.forEach(card => {
            card.style.display = 'block';
            card.classList.remove('active');

            // Remove highlights
            const question = card.querySelector('.faq-question h3');
            const answer = card.querySelector('.faq-answer');

            if (question.dataset.original) {
                question.innerHTML = question.dataset.original;
            }

            if (answer.dataset.original) {
                answer.innerHTML = answer.dataset.original;
            }
        });

        // Hide search results message
        const resultsMessage = document.querySelector('.search-results-message');
        if (resultsMessage) {
            resultsMessage.remove();
        }
    }

    function showSearchResults(count, term) {
        // Remove existing message
        const existingMessage = document.querySelector('.search-results-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const message = document.createElement('div');
        message.className = 'search-results-message';
        message.innerHTML = `
            <p>Found <strong>${count}</strong> results for "${term}"</p>
            <button id="clearSearch">Clear Search</button>
        `;

        // Style the message
        message.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 15px 25px;
            border-radius: 25px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 20px;
            z-index: 1000;
            animation: slideDown 0.3s ease-out;
        `;

        // Style the clear button
        const clearBtn = message.querySelector('#clearSearch');
        clearBtn.style.cssText = `
            background: #b76e79;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        `;

        clearBtn.addEventListener('mouseenter', () => {
            clearBtn.style.background = '#5d4037';
        });

        clearBtn.addEventListener('mouseleave', () => {
            clearBtn.style.background = '#b76e79';
        });

        // Add click handler for clear button
        clearBtn.addEventListener('click', () => {
            resetSearch();
            searchInput.value = '';
            message.remove();
        });

        document.body.appendChild(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => message.remove(), 300);
            }
        }, 5000);
    }

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .highlight {
            background-color: #FFEB3B;
            padding: 0 2px;
            border-radius: 3px;
            font-weight: bold;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translate(-50%, -20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        
        @keyframes slideUp {
            from {
                opacity: 1;
                transform: translate(-50%, 0);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -20px);
            }
        }
    `;
    document.head.appendChild(style);

    // Event listeners for search
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Clear search when input is cleared
    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '') {
            resetSearch();
        }
    });

    // Scroll spy for quick links
    function updateActiveLink() {
        const scrollPosition = window.scrollY + 150;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const sectionId = section.getAttribute('id');
                quickLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Debounce scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateActiveLink, 100);
    });

    // Live Chat Function (placeholder)
    window.openChat = function () {
        alert('Live chat would open here. In a real implementation, this would connect to a chat service like Zendesk or Intercom.');
    };

    // Print FAQ functionality (optional)
    const printButton = document.createElement('button');
    printButton.innerHTML = '<i class="fas fa-print"></i> Print FAQs';
    printButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #5d4037;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        cursor: pointer;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    `;

    printButton.addEventListener('mouseenter', () => {
        printButton.style.background = '#b76e79';
        printButton.style.transform = 'translateY(-3px)';
    });

    printButton.addEventListener('mouseleave', () => {
        printButton.style.background = '#5d4037';
        printButton.style.transform = 'translateY(0)';
    });

    printButton.addEventListener('click', () => {
        // Open all FAQ cards for printing
        faqCards.forEach(card => card.classList.add('active'));

        setTimeout(() => {
            window.print();

            // Close all FAQ cards after printing
            setTimeout(() => {
                faqCards.forEach(card => card.classList.remove('active'));
            }, 1000);
        }, 500);
    });

    // Add print styles
    const printStyle = document.createElement('style');
    printStyle.media = 'print';
    printStyle.textContent = `
        @media print {
            .quick-links, .search-box, .cta-buttons, .contact-cta button {
                display: none !important;
            }
            
            .faq-card {
                break-inside: avoid;
            }
            
            .faq-answer {
                max-height: none !important;
                padding: 0 30px 30px !important;
                display: block !important;
            }
        }
    `;
    document.head.appendChild(printStyle);

    document.body.appendChild(printButton);
});