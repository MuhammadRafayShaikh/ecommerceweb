// Animate collection items on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Stagger the animation for each item
            setTimeout(() => {
                entry.target.classList.add('animate');
            }, index * 100);
        }
    });
}, observerOptions);

// Observe all collection items
const collectionItems = document.querySelectorAll('.collection-item');
collectionItems.forEach(item => {
    observer.observe(item);
});

function observeCollectionItems() {
    const collectionItems = document.querySelectorAll('.collection-item');
    collectionItems.forEach(item => observer.observe(item));
}

observeCollectionItems();

// Category tags functionality
const categoryTags = document.querySelectorAll('.category-tag');
categoryTags.forEach(tag => {
    tag.addEventListener('click', function () {
        categoryTags.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const categoryId = this.dataset.categoryId;

        $.ajax({
            url: "/Home/ChangeCategory",
            type: "GET",
            data: { categoryId: categoryId },
            success: function (res) {
                $("#filter-section").html(res.filters);
                $("#collectionsGrid").html(res.products);
                observeCollectionItems();
            }

        })
        const categoryName = this.textContent;
        const currentUrl = window.location.href;

        const modifyCurrentUrl = currentUrl.split("/")

        if (categoryName != "All Collections") {

            history.replaceState(null, "", "/" + modifyCurrentUrl[3] + "/" + modifyCurrentUrl[4] + "/" + categoryId);
        } else {
            history.replaceState(null, "", "/" + modifyCurrentUrl[3] + "/" + modifyCurrentUrl[4]);
        }
    });
});

const selectedFilters = {
    fabric: null,
    occasion: null,
    color: null
};

// 2️⃣ Event listeners
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function () {
        const categoryId = $("#categoryId").val();
        //alert(categoryId);
        const filterType = this.dataset.filter;
        const filterValue = this.dataset.value;

        const parent = this.parentElement;
        parent.querySelectorAll('.filter-btn')
            .forEach(btn => btn.classList.remove('active'));

        this.classList.add('active');

        selectedFilters[filterType] = filterValue;

        $.ajax({
            url: "/Home/Filter",
            type: "GET",
            data: {
                categoryId: categoryId,
                fabric: selectedFilters.fabric,
                occasion: selectedFilters.occasion,
                color: selectedFilters.color,
                minPrice: document.getElementById('minPrice').value,
                maxPrice: document.getElementById('maxPrice').value
            },
            success: function (html) {
                //alert("hell")
                console.log(html)
                $("#collectionsGrid").html(html);

                observeCollectionItems();
            }
        });

        //console.log(selectedFilters);
    });
});
document.getElementById('minPrice').addEventListener('input', function () {
    const min = parseFloat(this.value) || 0;
    const max = parseFloat(document.getElementById('maxPrice').value) || 0;

    if (min > max && max > 0) {
        this.value = max - 1; // auto-correct minPrice to maxPrice
    }
});

document.getElementById('maxPrice').addEventListener('input', function () {
    const max = parseFloat(this.value) || 0;
    const min = parseFloat(document.getElementById('minPrice').value) || 0;

    if (max < min && min > 0) {
        this.value = min + 1; // auto-correct maxPrice to minPrice
    }
});

function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    }
}

const priceInputs = document.querySelectorAll('#minPrice, #maxPrice');

priceInputs.forEach(input => {
    input.addEventListener('input', debounce(function () {
        const categoryId = $("#categoryId").val();
        $.ajax({
            url: "/Home/Filter",
            type: "GET",
            data: {
                categoryId: categoryId,
                fabric: selectedFilters.fabric,
                occasion: selectedFilters.occasion,
                color: selectedFilters.color,
                minPrice: document.getElementById('minPrice').value,
                maxPrice: document.getElementById('maxPrice').value
            },
            success: function (html) {
                //alert("hello")
                //console.log(html)
                $("#collectionsGrid").html(html);
                //$("#collectionsGrid").html('<div style="width:100px;height:100px;background:red;"></div>');
                observeCollectionItems(); // scroll animation fir se attach
            }
        });
    }, 500)); // 500ms debounce
});

//$(document).ready(function () {
//    // Code to run when the DOM is ready
//    $(".cart-btn").on("click", function (e) {
//        var productId = $(this).data("productId");
//        const currentUrl = window.location.href;
//        $.ajax({
//            url: "/Cart/Index",
//            type: "POST",
//            data: { productId: productId, currentUrl: currentUrl },
//            success: function (response) {
//                console.log(response);
//                if (!response.success) {
//                    window.location.href = `${response.redirect}`;
//                } else {
//                    showNotification(response.message, "success");
//                }
//            }
//        })
//    })
//});

// Search Functionality for Collections Page
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on a page that should have search
    const searchToggle = document.getElementById('searchToggle');
    const searchModal = document.getElementById('searchModal');
    const closeSearch = document.getElementById('closeSearch');
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const searchCategory = document.getElementById('searchCategory');
    const searchResults = document.getElementById('searchResults');
    const searchResultsCount = document.getElementById('searchResultsCount');
    const searchResultsTitle = document.getElementById('searchResultsTitle');
    const searchTime = document.getElementById('searchTime');
    const searchLoading = document.getElementById('searchLoading');

    // Variables for search
    let searchTimeout;
    let currentCategoryId = getCurrentCategoryId();
    let isSearching = false;

    // Initialize search
    if (searchToggle && searchModal) {
        initializeSearch();
    }

    // Get current category ID from URL or page
    function getCurrentCategoryId() {
        // Try to get from URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('id');

        if (categoryId) {
            return parseInt(categoryId);
        }

        // Try to get from active category tag
        const activeCategory = document.querySelector('.category-tag.active');
        if (activeCategory && activeCategory.dataset.categoryId) {
            return parseInt(activeCategory.dataset.categoryId);
        }

        return null;
    }

    // Initialize search functionality
    function initializeSearch() {
        // Set current category in dropdown
        if (currentCategoryId && searchCategory) {
            searchCategory.value = currentCategoryId;
        }

        // Event Listeners
        searchToggle.addEventListener('click', openSearchModal);
        closeSearch.addEventListener('click', closeSearchModal);
        clearSearch.addEventListener('click', clearSearchInput);

        if (searchInput) {
            searchInput.addEventListener('input', handleSearchInput);
            searchInput.addEventListener('keydown', handleSearchKeydown);
        }

        if (searchCategory) {
            searchCategory.addEventListener('change', performSearch);
        }

        // Close modal when clicking outside
        document.addEventListener('click', function (event) {
            if (searchModal && searchModal.classList.contains('active') &&
                !event.target.closest('.search-modal-content') &&
                !event.target.closest('#searchToggle')) {
                closeSearchModal();
            }
        });

        // Close with Escape key
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && searchModal.classList.contains('active')) {
                closeSearchModal();
            }
        });

        // Load popular searches on open
        if (searchModal) {
            searchModal.addEventListener('click', function (event) {
                if (event.target === this) {
                    closeSearchModal();
                }
            });
        }
    }

    // Open search modal
    function openSearchModal(event) {
        event.preventDefault();
        event.stopPropagation();

        if (searchModal) {
            searchModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Focus on input
            setTimeout(() => {
                if (searchInput) {
                    searchInput.focus();
                    // If there's text in input, search immediately
                    if (searchInput.value.trim()) {
                        performSearch();
                    }
                }
            }, 300);
        }
    }

    // Close search modal
    function closeSearchModal() {
        if (searchModal) {
            searchModal.classList.remove('active');
            document.body.style.overflow = 'auto';

            // Clear search after closing
            setTimeout(() => {
                if (searchInput) {
                    searchInput.value = '';
                }
                clearSearchResults();
            }, 300);
        }
    }

    // Clear search input
    function clearSearchInput() {
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
            clearSearchResults();
        }
    }

    // Handle search input
    function handleSearchInput(event) {
        const query = event.target.value.trim();

        // Show/hide clear button
        if (clearSearch) {
            clearSearch.style.display = query ? 'block' : 'none';
        }

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // If query is empty, show initial state
        if (!query) {
            showInitialState();
            return;
        }

        // Set timeout for debouncing
        searchTimeout = setTimeout(() => {
            performSearch();
        }, 500);
    }

    // Handle keyboard shortcuts
    function handleSearchKeydown(event) {
        // Ctrl/Cmd + K to focus
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            if (searchModal.classList.contains('active')) {
                searchInput.focus();
            } else {
                openSearchModal(event);
            }
        }

        // Enter to select first result
        if (event.key === 'Enter') {
            event.preventDefault();
            const firstResult = searchResults.querySelector('.product-result-item');
            if (firstResult) {
                firstResult.click();
            }
        }

        // Arrow navigation
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            navigateSearchResults(event.key === 'ArrowDown' ? 1 : -1);
        }
    }

    // Navigate search results with arrow keys
    function navigateSearchResults(direction) {
        const results = searchResults.querySelectorAll('.product-result-item');
        let currentIndex = -1;

        // Find currently selected result
        results.forEach((result, index) => {
            if (result.classList.contains('selected')) {
                currentIndex = index;
            }
        });

        // Remove selection from all
        results.forEach(result => result.classList.remove('selected'));

        // Calculate new index
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = results.length - 1;
        if (newIndex >= results.length) newIndex = 0;

        // Apply selection
        if (results[newIndex]) {
            results[newIndex].classList.add('selected');
            results[newIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }

    // Perform search
    async function performSearch() {
        const query = searchInput ? searchInput.value.trim() : '';

        if (!query || isSearching) {
            return;
        }

        const categoryId = searchCategory ? searchCategory.value : null;
        const startTime = Date.now();

        // Show loading
        showLoading();
        isSearching = true;

        try {
            // Build URL with parameters
            let url = `/Home/SearchProducts?query=${encodeURIComponent(query)}`;
            if (categoryId) {
                url += `&categoryId=${categoryId}`;
            }

            // Make API call
            const response = await fetch(url);
            const result = await response.json();

            // Calculate time taken
            const timeTaken = (Date.now() - startTime) / 1000;

            if (result.success) {
                // Update UI with results
                updateSearchResults(result.products, query, result.count, timeTaken);

                // Update title and stats
                if (searchResultsTitle) {
                    searchResultsTitle.textContent = `Search Results for "${query}"`;
                }

                if (searchResultsCount) {
                    searchResultsCount.textContent = `${result.count} result${result.count !== 1 ? 's' : ''}`;
                }

                if (searchTime) {
                    searchTime.textContent = `in ${timeTaken.toFixed(1)}s`;
                    searchTime.style.display = 'inline';
                }
            } else {
                showError(result.message || 'Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            showError('Network error. Please try again.');
        } finally {
            hideLoading();
            isSearching = false;
        }
    }

    // Update search results
    function updateSearchResults(products, query, count, timeTaken) {
        if (!searchResults) return;

        if (products.length === 0) {
            showNoResults(query);
            return;
        }

        // Create results HTML
        let html = '';

        products.forEach(product => {
            // Highlight search terms in name
            const highlightedName = highlightText(product.name, query);
            const highlightedDesc = highlightText(product.shortDescription, query);

            html += `
                <a href="/Detail/Index/${product.id}" class="product-result-item">
                    <div class="product-result-image">
                        <img src="${product.image}" alt="${product.name}" 
                             onerror="this.src='/images/default-product.jpg'">
                    </div>
                    <div class="product-result-content">
                        <h4 class="product-result-name">${highlightedName}</h4>
                        <p class="product-result-description">${highlightedDesc}</p>
                        <div class="product-result-meta">
                            <div class="product-result-price">
                                ${product.hasDiscount ? `
                                    <span class="original-price">₹${product.price}</span>
                                    <span class="discounted-price">₹${product.discountedPrice}</span>
                                ` : `
                                    <span class="discounted-price">₹${product.price}</span>
                                `}
                            </div>
                            ${product.category ? `
                                <span class="product-result-category">${product.category}</span>
                            ` : ''}
                            ${product.rating > 0 ? `
                                <div class="product-result-rating">
                                    <i class="fas fa-star"></i>
                                    <span>${product.rating.toFixed(1)}</span>
                                    ${product.reviewCount > 0 ? `
                                        <span>(${product.reviewCount})</span>
                                    ` : ''}
                                </div>
                            ` : ''}
                            ${product.fabric ? `
                                <span class="product-result-category">${product.fabric}</span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="product-result-actions">
                        <button class="view-product-btn">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </a>
            `;
        });

        searchResults.innerHTML = html;

        // Add click event to view buttons
        searchResults.querySelectorAll('.view-product-btn').forEach(btn => {
            btn.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                const link = this.closest('.product-result-item').href;
                window.location.href = link;
            });
        });
    }

    // Highlight search terms in text
    function highlightText(text, query) {
        if (!text || !query) return text || '';

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    // Show loading state
    function showLoading() {
        if (searchLoading) {
            searchLoading.style.display = 'block';
        }
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    // Hide loading state
    function hideLoading() {
        if (searchLoading) {
            searchLoading.style.display = 'none';
        }
    }

    // Show no results
    function showNoResults(query) {
        if (!searchResults) return;

        searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">
                    <i class="fas fa-search-minus"></i>
                </div>
                <h4>No Products Found</h4>
                <p>We couldn't find any products matching "${query}"</p>
                <div class="search-suggestions" style="margin-top: 15px;">
                    <p>Try:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Checking your spelling</li>
                        <li>Using more general terms</li>
                        <li>Browse by category instead</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // Show initial state
    function showInitialState() {
        if (!searchResults) return;

        searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h4>Start Typing to Search</h4>
                <p>Search for products by name, description, fabric, occasion, or color</p>
            </div>
        `;

        if (searchResultsTitle) {
            searchResultsTitle.textContent = 'Type to search products...';
        }

        if (searchResultsCount) {
            searchResultsCount.textContent = '0 results';
        }

        if (searchTime) {
            searchTime.style.display = 'none';
        }
    }

    // Show error state
    function showError(message) {
        if (!searchResults) return;

        searchResults.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon" style="color: #ff6b6b;">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h4>Search Error</h4>
                <p>${message}</p>
                <button onclick="performSearch()" style="margin-top: 15px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }

    // Clear search results
    function clearSearchResults() {
        showInitialState();

        if (searchResultsCount) {
            searchResultsCount.textContent = '0 results';
        }

        if (searchTime) {
            searchTime.style.display = 'none';
        }
    }

    // Add CSS for highlighting
    const style = document.createElement('style');
    style.textContent = `
        .search-highlight {
            background-color: rgba(255, 235, 59, 0.3);
            padding: 1px 4px;
            border-radius: 3px;
            font-weight: 600;
        }
        
        .product-result-item.selected {
            background: rgba(183, 110, 121, 0.1) !important;
            border-left: 3px solid var(--primary-color);
        }
        
        .search-suggestions ul {
            margin: 10px 0 0 20px;
            padding: 0;
        }
        
        .search-suggestions li {
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 3px;
        }
    `;
    document.head.appendChild(style);

    // Quick search shortcut
    document.addEventListener('keydown', function (event) {
        // Forward slash (/) to focus search
        if (event.key === '/' && !event.target.matches('input, textarea, select')) {
            event.preventDefault();
            if (searchModal) {
                openSearchModal(event);
            }
        }
    });

    // Add quick search tips
    console.log('Search Tips:');
    console.log('• Press / to open search');
    console.log('• Press Ctrl+K to focus search');
    console.log('• Use arrow keys to navigate results');
    console.log('• Press Enter to select first result');
});

// Make functions available globally for onclick handlers
window.openSearchModal = function (event) {
    const searchModal = document.getElementById('searchModal');
    if (searchModal) {
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 300);
        }
    }
    if (event) event.preventDefault();
};

window.performSearch = function () {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
        const event = new Event('input', { bubbles: true });
        searchInput.dispatchEvent(event);
    }
};