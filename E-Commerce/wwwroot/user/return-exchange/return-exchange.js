// FAQ Accordion
document.addEventListener('DOMContentLoaded', function () {
    // Initialize FAQ accordion
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
    const sections = document.querySelectorAll('.policy-section');

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

    // Print policy button
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
            .policy-summary,
            .contact-support,
            .policy-updates {
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
            
            .return-hero {
                height: 40vh !important;
                padding-top: 50px !important;
            }
            
            .return-hero h1 {
                font-size: 2.5rem !important;
            }
            
            a {
                color: #000 !important;
                text-decoration: none !important;
            }
            
            .support-button {
                display: none !important;
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

    // Highlight sections on scroll
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

    // Policy calculator - Estimate refund amount
    const calculatorButton = document.createElement('button');
    calculatorButton.innerHTML = '<i class="fas fa-calculator"></i> Refund Calculator';
    calculatorButton.className = 'calculator-btn';

    calculatorButton.style.cssText = `
        position: fixed;
        bottom: 140px;
        right: 30px;
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 25px;
        cursor: pointer;
        box-shadow: 0 5px 20px rgba(76, 175, 80, 0.3);
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        transition: all 0.3s ease;
    `;

    calculatorButton.addEventListener('mouseenter', () => {
        calculatorButton.style.background = '#388E3C';
        calculatorButton.style.transform = 'translateY(-3px)';
    });

    calculatorButton.addEventListener('mouseleave', () => {
        calculatorButton.style.background = '#4CAF50';
        calculatorButton.style.transform = 'translateY(0)';
    });

    calculatorButton.addEventListener('click', () => {
        showRefundCalculator();
    });

    document.body.appendChild(calculatorButton);

    // Refund calculator modal
    function showRefundCalculator() {
        const modal = document.createElement('div');
        modal.className = 'calculator-modal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-calculator"></i> Refund Calculator</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="calculator-form">
                        <div class="form-group">
                            <label for="orderAmount">Order Amount (₹)</label>
                            <input type="number" id="orderAmount" placeholder="Enter order amount" min="0" step="100">
                        </div>
                        <div class="form-group">
                            <label for="shippingCost">Shipping Cost (₹)</label>
                            <input type="number" id="shippingCost" placeholder="Enter shipping cost" min="0" step="10">
                        </div>
                        <div class="form-group">
                            <label for="returnReason">Return Reason</label>
                            <select id="returnReason">
                                <option value="size">Size Issue</option>
                                <option value="color">Color Issue</option>
                                <option value="style">Style Change</option>
                                <option value="defective">Defective Item</option>
                            </select>
                        </div>
                        <button id="calculateBtn" class="calculate-btn">Calculate Refund</button>
                    </div>
                    <div class="calculator-result" id="calculatorResult">
                        <div class="result-header">
                            <i class="fas fa-rupee-sign"></i>
                            <h4>Estimated Refund</h4>
                        </div>
                        <div class="result-details">
                            <div class="result-item">
                                <span>Item Value:</span>
                                <span id="itemValue">₹0</span>
                            </div>
                            <div class="result-item">
                                <span>Shipping Refund:</span>
                                <span id="shippingRefund">₹0</span>
                            </div>
                            <div class="result-item">
                                <span>Processing Fee:</span>
                                <span id="processingFee">₹0</span>
                            </div>
                            <div class="result-item total">
                                <span>Total Refund:</span>
                                <span id="totalRefund">₹0</span>
                            </div>
                        </div>
                        <div class="result-note" id="resultNote">
                            This is an estimate. Actual refund may vary based on specific conditions.
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        const modalStyle = document.createElement('style');
        modalStyle.textContent = `
            .calculator-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease-out;
            }
            
            .modal-content {
                background: white;
                border-radius: 20px;
                width: 90%;
                max-width: 500px;
                animation: slideUp 0.3s ease-out;
            }
            
            .modal-header {
                background: linear-gradient(135deg, #5d4037, #b76e79);
                color: white;
                padding: 20px 30px;
                border-radius: 20px 20px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-header h3 {
                margin: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .close-modal {
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            .modal-body {
                padding: 30px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: #5d4037;
                font-weight: 500;
            }
            
            .form-group input,
            .form-group select {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid #eee;
                border-radius: 10px;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            
            .form-group input:focus,
            .form-group select:focus {
                outline: none;
                border-color: #b76e79;
                box-shadow: 0 0 0 3px rgba(183, 110, 121, 0.1);
            }
            
            .calculate-btn {
                width: 100%;
                background: #b76e79;
                color: white;
                border: none;
                padding: 15px;
                border-radius: 10px;
                font-size: 1.1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }
            
            .calculate-btn:hover {
                background: #5d4037;
                transform: translateY(-2px);
            }
            
            .calculator-result {
                margin-top: 30px;
                background: #f9f5f2;
                border-radius: 15px;
                padding: 25px;
                display: none;
            }
            
            .result-header {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #5d4037;
                margin-bottom: 20px;
            }
            
            .result-header i {
                font-size: 24px;
            }
            
            .result-header h4 {
                margin: 0;
                font-size: 1.2rem;
            }
            
            .result-details {
                margin-bottom: 20px;
            }
            
            .result-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
                color: #666;
            }
            
            .result-item.total {
                border-bottom: none;
                font-weight: 600;
                color: #5d4037;
                font-size: 1.1rem;
            }
            
            .result-note {
                color: #888;
                font-size: 0.9rem;
                font-style: italic;
                text-align: center;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(modalStyle);

        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => modal.remove(), 300);
            }
        });

        // Calculate refund
        document.getElementById('calculateBtn').addEventListener('click', () => {
            const orderAmount = parseFloat(document.getElementById('orderAmount').value) || 0;
            const shippingCost = parseFloat(document.getElementById('shippingCost').value) || 0;
            const returnReason = document.getElementById('returnReason').value;

            // Calculate refund based on policy
            let itemRefund = orderAmount;
            let shippingRefund = 0;
            let processingFee = 0;

            // Apply policy rules
            if (orderAmount < 3000) {
                // Shipping not free, shipping cost deducted
                shippingRefund = 0;
            } else {
                // Free shipping, no shipping refund
                shippingRefund = 0;
            }

            // Processing fee for non-defective returns
            if (returnReason !== 'defective') {
                processingFee = 50; // ₹50 processing fee
            }

            // For defective items, full refund including shipping
            if (returnReason === 'defective') {
                shippingRefund = shippingCost;
                processingFee = 0;
            }

            // Calculate total
            const totalRefund = itemRefund + shippingRefund - processingFee;

            // Update result display
            document.getElementById('itemValue').textContent = `₹${itemRefund.toFixed(2)}`;
            document.getElementById('shippingRefund').textContent = `₹${shippingRefund.toFixed(2)}`;
            document.getElementById('processingFee').textContent = `-₹${processingFee.toFixed(2)}`;
            document.getElementById('totalRefund').textContent = `₹${totalRefund.toFixed(2)}`;

            // Update note based on reason
            let note = 'This is an estimate. Actual refund may vary based on specific conditions.';
            if (returnReason === 'defective') {
                note = 'Defective items receive full refund including shipping charges. No processing fees apply.';
            } else if (orderAmount >= 3000) {
                note = 'Orders above ₹3000 qualify for free shipping, but shipping charges are not refundable.';
            }
            document.getElementById('resultNote').textContent = note;

            // Show result
            document.getElementById('calculatorResult').style.display = 'block';
        });
    }

    // Copy section link on header click
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

    // Add animation for summary cards on scroll
    const summaryCards = document.querySelectorAll('.summary-card');

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1
    });

    summaryCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        cardObserver.observe(card);
    });
});