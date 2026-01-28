// FAQ Accordion
document.addEventListener('DOMContentLoaded', function () {
    // FAQ Accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Smooth scroll for table of contents links
    const tocLinks = document.querySelectorAll('.toc-link');

    tocLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Remove active class from all links
                tocLinks.forEach(l => l.classList.remove('active'));

                // Add active class to clicked link
                this.classList.add('active');

                // Calculate offset for sticky header
                const offset = 100;
                const targetPosition = targetSection.offsetTop - offset;

                // Smooth scroll
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Add visual feedback to section
                targetSection.style.boxShadow = '0 0 0 3px rgba(183, 110, 121, 0.2)';
                setTimeout(() => {
                    targetSection.style.boxShadow = '';
                }, 1500);
            }
        });
    });

    // Update active TOC link on scroll
    const sections = document.querySelectorAll('.policy-section');

    function updateActiveTocLink() {
        const scrollPosition = window.scrollY + 150;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                tocLinks.forEach(link => {
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
        scrollTimeout = setTimeout(updateActiveTocLink, 100);
    });

    // Print policy functionality
    const printButton = document.createElement('button');
    printButton.innerHTML = '<i class="fas fa-print"></i> Print Policy';
    printButton.className = 'print-policy-btn';

    // Style the print button
    printButton.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #5d4037;
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 25px;
        cursor: pointer;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
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
        // Open all FAQ items for printing
        faqItems.forEach(item => item.classList.add('active'));

        setTimeout(() => {
            window.print();

            // Close FAQ items after printing
            setTimeout(() => {
                faqItems.forEach(item => item.classList.remove('active'));
            }, 1000);
        }, 500);
    });

    document.body.appendChild(printButton);

    // Add print styles
    const printStyle = document.createElement('style');
    printStyle.media = 'print';
    printStyle.textContent = `
        @media print {
            .print-policy-btn,
            .toc-container,
            .summary-section,
            .contact-support,
            .update-notice {
                display: none !important;
            }
            
            .policy-section {
                break-inside: avoid;
                box-shadow: none !important;
                border: 1px solid #ddd !important;
            }
            
            .faq-answer {
                max-height: none !important;
                padding: 0 25px 25px !important;
                display: block !important;
            }
            
            .shipping-hero {
                height: 40vh !important;
                padding-top: 50px !important;
            }
            
            .shipping-hero h1 {
                font-size: 2.5rem !important;
            }
            
            a {
                color: #000 !important;
                text-decoration: none !important;
            }
        }
    `;
    document.head.appendChild(printStyle);

    // Back to top button
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.className = 'back-to-top';

    backToTopButton.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #b76e79;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 5px 20px rgba(183, 110, 121, 0.3);
        z-index: 100;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: all 0.3s ease;
    `;

    backToTopButton.addEventListener('mouseenter', () => {
        backToTopButton.style.background = '#5d4037';
        backToTopButton.style.transform = 'translateY(-3px)';
    });

    backToTopButton.addEventListener('mouseleave', () => {
        backToTopButton.style.background = '#b76e79';
        backToTopButton.style.transform = 'translateY(0)';
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    document.body.appendChild(backToTopButton);

    // Show/hide back to top button
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    // Highlight current section on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.borderLeft = '5px solid #b76e79';
                entry.target.style.transition = 'border-left 0.5s ease';

                // Remove highlight after 2 seconds
                setTimeout(() => {
                    entry.target.style.borderLeft = '';
                }, 2000);
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Add copy link functionality to section headers
    const sectionHeaders = document.querySelectorAll('.section-header h2');

    sectionHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.style.position = 'relative';

        // Add tooltip
        const tooltip = document.createElement('span');
        tooltip.textContent = 'Click to copy link';
        tooltip.style.cssText = `
            position: absolute;
            top: -30px;
            left: 0;
            background: #5d4037;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            white-space: nowrap;
        `;

        header.appendChild(tooltip);

        header.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
        });

        header.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });

        header.addEventListener('click', function () {
            const section = this.closest('.policy-section');
            const sectionId = section.getAttribute('id');
            const url = window.location.href.split('#')[0] + '#' + sectionId;

            // Copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                tooltip.textContent = 'Link copied!';
                tooltip.style.background = '#4CAF50';

                setTimeout(() => {
                    tooltip.textContent = 'Click to copy link';
                    tooltip.style.background = '#5d4037';
                }, 2000);
            });
        });
    });
});