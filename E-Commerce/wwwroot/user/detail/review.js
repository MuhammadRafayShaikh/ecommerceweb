// reviews.js
class ProductReviews {
    constructor(productId) {
        this.productId = productId;
        this.currentPage = 1;
        this.pageSize = 5;
        this.totalPages = 1;
        this.isLoading = false;

        this.initialize();
    }

    initialize() {
        this.bindEvents();
        this.loadReviews();
        this.loadRatingStats();
    }

    bindEvents() {
        // Write review button
        const writeReviewBtn = document.getElementById('writeReviewBtn');
        if (writeReviewBtn) {
            writeReviewBtn.addEventListener('click', () => this.checkReviewEligibility());
        }

        // Close review modal
        const closeReviewModal = document.querySelector('.close-review-modal');
        if (closeReviewModal) {
            closeReviewModal.addEventListener('click', () => this.closeReviewModal());
        }

        // Close review modal on overlay click
        const reviewOverlay = document.querySelector('.review-modal-overlay');
        if (reviewOverlay) {
            reviewOverlay.addEventListener('click', () => this.closeReviewModal());
        }

        // Cancel review button
        const cancelReviewBtn = document.querySelector('.btn-cancel-review');
        if (cancelReviewBtn) {
            cancelReviewBtn.addEventListener('click', () => this.closeReviewModal());
        }

        // View all reviews button
        const viewAllBtn = document.getElementById('viewMoreReviews');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => this.openAllReviewsModal());
        }

        // Close all reviews modal
        const closeAllReviews = document.querySelector('.close-all-reviews');
        if (closeAllReviews) {
            closeAllReviews.addEventListener('click', () => this.closeAllReviewsModal());
        }

        // Close all reviews modal on overlay click
        const allReviewsOverlay = document.querySelector('.all-reviews-overlay');
        if (allReviewsOverlay) {
            allReviewsOverlay.addEventListener('click', () => this.closeAllReviewsModal());
        }

        // Review form submission
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => this.submitReview(e));
        }

        // Star rating interaction
        const starInputs = document.querySelectorAll('.star-rating input');
        starInputs.forEach(input => {
            input.addEventListener('change', () => this.updateSubmitButton());
        });

        // Review text input
        const reviewText = document.getElementById('reviewText');
        if (reviewText) {
            reviewText.addEventListener('input', () => {
                this.updateCharCount();
                this.updateSubmitButton();
            });
        }

        // Sort reviews
        const sortSelect = document.getElementById('sortReviews');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.loadReviews());
        }

        // Close eligibility modal
        const closeEligibilityBtn = document.querySelector('.close-eligibility-modal');
        if (closeEligibilityBtn) {
            closeEligibilityBtn.addEventListener('click', () => this.closeEligibilityModal());
        }

        const closeEligibilityOverlay = document.querySelector('.eligibility-overlay');
        if (closeEligibilityOverlay) {
            closeEligibilityOverlay.addEventListener('click', () => this.closeEligibilityModal());
        }

        const closeEligibilityAction = document.querySelector('.btn-close-eligibility');
        if (closeEligibilityAction) {
            closeEligibilityAction.addEventListener('click', () => this.closeEligibilityModal());
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeReviewModal();
                this.closeAllReviewsModal();
                this.closeEligibilityModal();
            }
        });
    }

    async checkReviewEligibility() {
        try {
            showToast('Checking review eligibility...', 'info');

            $.ajax({
                url: `/Review/CanReviewProduct?productId=${this.productId}`,
                type: "GET",
                success: (result) => {
                    if (result.success) {
                        if (result.canReview) {
                            this.openReviewModal();
                        }
                    } else {
                        this.showEligibilityError(result);
                    }
                }
            });


            //const response = await fetch(`/Review/CanReviewProduct?productId=${this.productId}`, {
            //    method: 'GET',
            //    headers: {
            //        'Content-Type': 'application/json'
            //    }
            //});

            //const result = await response.json();

            
        } catch (error) {
            console.error('Error checking review eligibility:', error);
            showToast('Error checking review eligibility', 'error');
        }
    }

    showEligibilityError(result) {
        // Update eligibility modal content
        const title = document.getElementById('eligibilityTitle');
        const message = document.getElementById('eligibilityMessage');
        const loginBtn = document.getElementById('loginBtn');

        if (result.existingReview) {
            title.textContent = 'Already Reviewed';
            message.textContent = result.message;

            // Update requirement checks
            this.updateRequirementStatus('reqLogin', true);
            this.updateRequirementStatus('reqPurchase', true);
            this.updateRequirementStatus('reqDelivered', true);
            this.updateRequirementStatus('reqNotReviewed', false);

            loginBtn.style.display = 'none';
        } else {
            title.textContent = 'Review Requirements';
            message.textContent = result.message;

            // Check if user is logged in
            const isLoggedIn = document.getElementById('reqLogin').querySelector('.fa-check-circle') !== null;

            if (!isLoggedIn) {
                loginBtn.style.display = 'block';
            } else {
                loginBtn.style.display = 'none';
            }
        }

        this.openEligibilityModal();
    }

    updateRequirementStatus(elementId, isMet) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const checkIcon = element.querySelector('.req-check i');
        if (checkIcon) {
            checkIcon.className = isMet ? 'fas fa-check-circle' : 'fas fa-times-circle';
        }
    }

    openReviewModal() {
        // Set product info
        const productImage = document.getElementById('reviewProductImage');
        const productName = document.getElementById('reviewProductName');
        const productPrice = document.getElementById('reviewProductPrice');

        const mainImage = document.getElementById('mainImage');
        const productTitle = document.querySelector('.product-title h1');
        const productPriceElement = document.querySelector('.product-price .current-price');

        if (mainImage) productImage.src = mainImage.src;
        if (productTitle) productName.textContent = productTitle.textContent;
        if (productPriceElement) productPrice.textContent = productPriceElement.textContent;

        // Reset form
        this.resetReviewForm();

        // Show modal
        const modal = document.getElementById('reviewFormModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeReviewModal() {
        const modal = document.getElementById('reviewFormModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    openAllReviewsModal() {
        const modal = document.getElementById('allReviewsModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        this.loadAllReviews(1);
    }

    closeAllReviewsModal() {
        const modal = document.getElementById('allReviewsModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    openEligibilityModal() {
        const modal = document.getElementById('reviewEligibilityModal');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeEligibilityModal() {
        const modal = document.getElementById('reviewEligibilityModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async loadReviews() {
        if (this.isLoading) return;

        this.isLoading = true;
        const reviewList = document.getElementById('reviewList');

        // Show loading state
        reviewList.innerHTML = `
            <div class="loading-reviews">
                <div class="spinner"></div>
                <p>Loading reviews...</p>
            </div>
        `;

        try {
            const sortBy = document.getElementById('sortReviews')?.value || 'newest';
            const response = await fetch(`/Review/GetProductReviews?productId=${this.productId}&page=1&pageSize=3&sort=${sortBy}`);
            const result = await response.json();

            if (result.success) {
                this.renderReviews(result.reviews, reviewList, false);
                this.updateViewMoreButton(result.totalReviews > 3);
            } else {
                reviewList.innerHTML = `
                    <div class="no-reviews">
                        <p>No reviews available yet.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewList.innerHTML = `
                <div class="error-loading">
                    <p>Error loading reviews. Please try again.</p>
                </div>
            `;
        } finally {
            this.isLoading = false;
        }
    }

    async loadAllReviews(page) {
        this.currentPage = page;
        const allReviewsBody = document.querySelector('.all-reviews-body');

        // Show loading state
        allReviewsBody.innerHTML = `
            <div class="reviews-loading">
                <div class="spinner-large"></div>
                <p>Loading reviews...</p>
            </div>
        `;

        try {
            const sortBy = document.getElementById('sortReviews')?.value || 'newest';
            const response = await fetch(`/Review/GetProductReviews?productId=${this.productId}&page=${page}&pageSize=10&sort=${sortBy}`);
            const result = await response.json();

            if (result.success) {
                this.renderReviews(result.reviews, allReviewsBody, true);
                this.totalPages = result.totalPages;
                this.renderPagination(result);
            } else {
                allReviewsBody.innerHTML = `
                    <div class="no-reviews">
                        <p>No reviews available yet.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading all reviews:', error);
            allReviewsBody.innerHTML = `
                <div class="error-loading">
                    <p>Error loading reviews. Please try again.</p>
                </div>
            `;
        }
    }

    async loadRatingStats() {
        try {
            const response = await fetch(`/Review/GetProductReviews?productId=${this.productId}&page=1&pageSize=1`);
            const result = await response.json();

            if (result.success && result.ratingStats) {
                this.renderRatingStats(result.ratingStats, result.totalReviews);
            }
        } catch (error) {
            console.error('Error loading rating stats:', error);
        }
    }

    renderRatingStats(ratingStats, totalReviews) {
        const ratingBars = document.getElementById('ratingBars');

        if (!ratingBars || !ratingStats) return;

        let html = '';

        for (let i = 5; i >= 1; i--) {
            const stat = ratingStats.find(s => s.rating === i) || { count: 0, percentage: 0 };
            const percentage = totalReviews > 0 ? Math.round((stat.count / totalReviews) * 100) : 0;

            html += `
                <div class="rating-bar">
                    <div class="bar-label">
                        ${i} <i class="fas fa-star"></i>
                    </div>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="bar-percent">${percentage}%</div>
                </div>
            `;
        }

        ratingBars.innerHTML = html;
    }

    renderReviews(reviews, container, isAllReviews = false) {
        if (!reviews || reviews.length === 0) {
            container.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-comment-slash"></i>
                    <h3>No Reviews Yet</h3>
                    <p>Be the first to review this product!</p>
                </div>
            `;
            return;
        }

        let html = '';

        reviews.forEach(review => {
            const stars = this.generateStars(review.rating);
            const fitBadge = review.fitFeedback ? `
                <div class="fit-badge">
                    <i class="fas fa-ruler-combined"></i> ${review.fitFeedback} Fit
                </div>
            ` : '';

            html += `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-avatar">
                            ${review.userInitials}
                        </div>
                        <div class="reviewer-info">
                            <div class="reviewer-name">${review.userName}</div>
                            <div class="review-meta">
                                <div class="review-rating">${stars}</div>
                                <div class="review-date">${review.createdAt}</div>
                                <div class="review-time">${review.timeAgo}</div>
                            </div>
                        </div>
                    </div>
                    <div class="review-content">
                        <p class="review-text">${review.reviewText}</p>
                        ${fitBadge}
                    </div>
                    ${isAllReviews ? `
                        <div class="review-actions">
                            <button class="review-action" onclick="this.reportReview(${review.id})">
                                <i class="fas fa-flag"></i> Report
                            </button>
                            <button class="review-action" onclick="this.helpfulReview(${review.id})">
                                <i class="fas fa-thumbs-up"></i> Helpful
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    updateViewMoreButton(show) {
        const viewMoreContainer = document.getElementById('viewMoreContainer');
        if (viewMoreContainer) {
            viewMoreContainer.style.display = show ? 'block' : 'none';
        }
    }

    renderPagination(result) {
        const paginationContainer = document.getElementById('reviewsPagination');
        if (!paginationContainer || result.totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        let html = '';

        // Previous button
        html += `
            <button class="page-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="productReviews.loadAllReviews(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const maxPagesToShow = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(result.totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="productReviews.loadAllReviews(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        html += `
            <button class="page-btn ${this.currentPage === result.totalPages ? 'disabled' : ''}" 
                    onclick="productReviews.loadAllReviews(${this.currentPage + 1})"
                    ${this.currentPage === result.totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = html;
    }

    resetReviewForm() {
        const form = document.getElementById('reviewForm');
        if (form) form.reset();

        const charCount = document.getElementById('charCount');
        if (charCount) charCount.textContent = '0';

        const submitBtn = document.querySelector('.btn-submit-review');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.remove('enabled');
        }

        // Clear errors
        this.clearErrors();
    }

    updateCharCount() {
        const textarea = document.getElementById('reviewText');
        const charCount = document.getElementById('charCount');

        if (textarea && charCount) {
            const count = textarea.value.length;
            charCount.textContent = count;

            if (count > 1000) {
                textarea.value = textarea.value.substring(0, 1000);
                charCount.textContent = 1000;
            }
        }
    }

    updateSubmitButton() {
        const rating = document.querySelector('input[name="rating"]:checked');
        const reviewText = document.getElementById('reviewText');
        const submitBtn = document.querySelector('.btn-submit-review');

        if (rating && reviewText && submitBtn) {
            const isValid = rating.value && reviewText.value.trim().length >= 10;
            submitBtn.disabled = !isValid;

            if (isValid) {
                submitBtn.classList.add('enabled');
            } else {
                submitBtn.classList.remove('enabled');
            }
        }
    }

    clearErrors() {
        const errors = document.querySelectorAll('.rating-error, .review-error');
        errors.forEach(error => {
            error.style.display = 'none';
            error.textContent = '';
        });
    }

    async submitReview(e) {
        e.preventDefault();

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        const formData = {
            ProductId: this.productId,
            Rating: document.querySelector('input[name="rating"]:checked').value,
            ReviewText: document.getElementById('reviewText').value.trim(),
            FitFeedback: document.querySelector('input[name="fitFeedback"]:checked')?.value || null
        };

        // Get anti-forgery token
        const token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;

        try {
            const submitBtn = document.querySelector('.btn-submit-review');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

            const response = await fetch('/Review/SubmitReview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message, 'success');
                this.closeReviewModal();

                // Reload reviews
                setTimeout(() => {
                    this.loadReviews();
                    this.loadRatingStats();
                }, 1000);
            } else {
                showToast(result.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showToast('Error submitting review. Please try again.', 'error');

            const submitBtn = document.querySelector('.btn-submit-review');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        }
    }

    validateForm() {
        let isValid = true;

        // Check rating
        const rating = document.querySelector('input[name="rating"]:checked');
        if (!rating) {
            const ratingError = document.getElementById('ratingError');
            ratingError.textContent = 'Please select a rating';
            ratingError.style.display = 'block';
            isValid = false;
        }

        // Check review text
        const reviewText = document.getElementById('reviewText');
        if (!reviewText || reviewText.value.trim().length < 10) {
            const reviewError = document.getElementById('reviewTextError');
            reviewError.textContent = 'Review must be at least 10 characters long';
            reviewError.style.display = 'block';
            isValid = false;
        }

        return isValid;
    }

    reportReview(reviewId) {
        if (confirm('Are you sure you want to report this review?')) {
            // Implement report functionality
            showToast('Review reported successfully', 'info');
        }
    }

    helpfulReview(reviewId) {
        // Implement helpful functionality
        showToast('Thanks for your feedback!', 'info');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const productId = document.querySelector('.product-detail-container')?.dataset.productId;
    if (productId) {
        window.productReviews = new ProductReviews(productId);
    }
});