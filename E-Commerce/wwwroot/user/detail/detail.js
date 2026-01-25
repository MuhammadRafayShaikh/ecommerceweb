// Product Detail Page JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Image Thumbnail Navigation
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.getElementById('mainImage');

    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function () {
            // Update main image
            const imageSrc = this.getAttribute('data-image');
            mainImage.src = imageSrc;

            // Update active thumbnail
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Color Selection
    const colorOptions = document.querySelectorAll('.color-option');
    const sizeOptionsContainer = document.getElementById('sizeOptions');
    let selectedColorId = colorOptions[0]?.getAttribute('data-color-id');

    // Get AJAX URL from hidden input
    const getColorDataUrl = document.getElementById('getColorDataUrl')?.value || '/Detail/GetColorData';

    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            if (this.classList.contains('selected')) return;

            // Update selected color
            colorOptions.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');

            selectedColorId = this.getAttribute('data-color-id');
            const colorName = this.getAttribute('data-color-name');
            const stock = parseInt(this.getAttribute('data-stock'));
            const sizes = this.getAttribute('data-sizes');

            // Update stock status
            const stockStatus = document.querySelector('.stock-status span');
            if (stock > 10) {
                stockStatus.textContent = `${stock} items in stock`;
                stockStatus.className = 'in-stock';
            } else if (stock > 0) {
                stockStatus.textContent = `Only ${stock} items left`;
                stockStatus.className = 'low-stock';
            } else {
                stockStatus.textContent = 'Out of stock';
                stockStatus.className = '';
            }

            // Update sizes based on selected color
            updateSizesForColor(sizes);

            // Update product images for selected color via AJAX
            updateImagesForColor(selectedColorId);
        });
    });

    // Size Selection
    function updateSizesForColor(sizesString) {
        // Clear existing sizes
        sizeOptionsContainer.innerHTML = '';

        // Split the sizes string (e.g., "M, XL") into array
        const sizes = sizesString.split(',').map(size => size.trim());

        // Create size options
        sizes.forEach((size, index) => {
            const sizeOption = document.createElement('div');
            sizeOption.className = `size-option ${index === 0 ? 'selected' : ''}`;
            sizeOption.setAttribute('data-size', size);
            sizeOption.textContent = size;

            sizeOption.addEventListener('click', function () {
                if (this.classList.contains('selected')) return;

                document.querySelectorAll('.size-option').forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
            });

            sizeOptionsContainer.appendChild(sizeOption);
        });
    }

    // Update images for selected color via AJAX
    function updateImagesForColor(colorId) {
        // Show loading indicator
        const imageThumbnails = document.getElementById('imageThumbnails');
        const mainImageContainer = document.querySelector('.main-image-container');

        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner"></div>';
        mainImageContainer.appendChild(loadingOverlay);

        // Make AJAX call to get color data
        $.ajax({
            url: getColorDataUrl,
            type: 'GET',
            data: { colorId: colorId },
            success: function (response) {
                if (response.success) {
                    // Update images
                    updateProductImages(response.images);

                    // Remove loading overlay
                    mainImageContainer.removeChild(loadingOverlay);
                } else {
                    console.error('Error loading color data:', response.message);
                    showToast('Error loading product images', 'error');
                    mainImageContainer.removeChild(loadingOverlay);
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX error:', error);
                showToast('Error loading product data', 'error');
                mainImageContainer.removeChild(loadingOverlay);
            }
        });
    }

    // Update product images
    function updateProductImages(images) {
        const imageThumbnails = document.getElementById('imageThumbnails');
        const mainImage = document.getElementById('mainImage');

        // Clear existing thumbnails
        imageThumbnails.innerHTML = '';

        // Update main image with first image
        if (images && images.length > 0) {
            mainImage.src = images[0];

            // Create thumbnails
            images.forEach((imageUrl, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
                thumbnail.setAttribute('data-image', imageUrl);
                thumbnail.innerHTML = `<img src="${imageUrl}" alt="Thumbnail ${index + 1}" loading="lazy">`;

                thumbnail.addEventListener('click', function () {
                    mainImage.src = imageUrl;

                    // Update active thumbnail
                    imageThumbnails.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                });

                imageThumbnails.appendChild(thumbnail);
            });
        }
    }

    // Quantity Controls
    const quantityInput = document.querySelector('.quantity-input');
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');

    minusBtn.addEventListener('click', function () {
        let value = parseInt(quantityInput.value);
        if (value > 1) {
            quantityInput.value = value - 1;
        }
    });

    plusBtn.addEventListener('click', function () {
        let value = parseInt(quantityInput.value);
        if (value < 10) {
            quantityInput.value = value + 1;
        }
    });

    quantityInput.addEventListener('input', function () {
        let value = parseInt(this.value);
        if (isNaN(value) || value < 1) this.value = 1;
        if (value > 10) this.value = 10;
    });

    // Tab Navigation
    const tabHeaders = document.querySelectorAll('.tab-header');
    const tabContents = document.querySelectorAll('.tab-content');

    tabHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');

            // Update active tab header
            tabHeaders.forEach(h => h.classList.remove('active'));
            this.classList.add('active');

            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Buy Now Button
    document.getElementById('buyNowBtn').addEventListener('click', function () {
        const selectedColorElement = document.querySelector('.color-option.selected');
        const selectedSizeElement = document.querySelector('.size-option.selected');
        const quantity = parseInt(quantityInput.value);

        if (!selectedColorElement || !selectedSizeElement) {
            showToast('Please select color and size', 'warning');
            return;
        }

        showToast('Proceeding to checkout...', 'info');
        // window.location.href = '/checkout?productId=@Model.Id&colorId=' + selectedColorId + '&size=' + selectedSize + '&quantity=' + quantity;
    });

    // Wishlist Button
    document.getElementById('wishlistBtn').addEventListener('click', function () {
        const isActive = this.classList.contains('active');

        if (isActive) {
            this.classList.remove('active');
            this.innerHTML = '<i class="far fa-heart"></i>';
            showToast('Removed from wishlist', 'info');
        } else {
            this.classList.add('active');
            this.innerHTML = '<i class="fas fa-heart"></i>';
            showToast('Added to wishlist', 'success');
        }
    });

});

// detail.js
document.addEventListener('DOMContentLoaded', function () {

    const productId = document.querySelector('.product-detail-container')?.dataset.productId;
    if (productId) {
        // The reviews system will initialize automatically through reviews.js
        console.log('Product reviews system initialized');
    }

    console.log('Detail page loaded');

    // Video Player Instance
    let currentVideo = null;
    let isPlaying = false;

    // Initialize Video Player
    function initializeVideoPlayer() {
        const mainVideo = document.getElementById('mainVideo');
        const playPauseBtn = document.querySelector('.play-pause');
        const progressBar = document.querySelector('.video-progress-bar');
        const currentTimeEl = document.querySelector('.current-time');
        const durationEl = document.querySelector('.duration');
        const volumeBtn = document.querySelector('.volume-btn');
        const volumeSlider = document.querySelector('.volume-slider');
        const fullscreenBtn = document.querySelector('.fullscreen-btn');

        if (!mainVideo) return;

        // Format time function
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // Update time display
        function updateTime() {
            currentTimeEl.textContent = formatTime(mainVideo.currentTime);
            durationEl.textContent = formatTime(mainVideo.duration || 0);
            progressBar.value = (mainVideo.currentTime / mainVideo.duration) * 100 || 0;
        }

        // Play/Pause functionality
        playPauseBtn.addEventListener('click', function () {
            if (mainVideo.paused) {
                mainVideo.play();
                this.innerHTML = '<i class="fas fa-pause"></i>';
                isPlaying = true;
            } else {
                mainVideo.pause();
                this.innerHTML = '<i class="fas fa-play"></i>';
                isPlaying = false;
            }
        });

        // Update progress bar
        mainVideo.addEventListener('timeupdate', updateTime);

        // Seek functionality
        progressBar.addEventListener('input', function () {
            const time = (this.value / 100) * mainVideo.duration;
            mainVideo.currentTime = time;
        });

        // Volume control
        volumeBtn.addEventListener('click', function () {
            if (mainVideo.volume > 0) {
                mainVideo.volume = 0;
                volumeSlider.value = 0;
                this.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else {
                mainVideo.volume = 1;
                volumeSlider.value = 100;
                this.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        });

        volumeSlider.addEventListener('input', function () {
            mainVideo.volume = this.value / 100;
            volumeBtn.innerHTML = this.value > 0 ?
                '<i class="fas fa-volume-up"></i>' :
                '<i class="fas fa-volume-mute"></i>';
        });

        // Fullscreen functionality
        fullscreenBtn.addEventListener('click', function () {
            const videoContainer = document.querySelector('.video-container');
            if (!document.fullscreenElement) {
                if (videoContainer.requestFullscreen) {
                    videoContainer.requestFullscreen();
                } else if (videoContainer.webkitRequestFullscreen) {
                    videoContainer.webkitRequestFullscreen();
                }
                this.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                this.innerHTML = '<i class="fas fa-expand"></i>';
            }
        });

        // Video ended
        mainVideo.addEventListener('ended', function () {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        });

        // Load first video if exists
        const firstVideoThumb = document.querySelector('.media-thumbnail[data-media-type="video"]');
        if (firstVideoThumb) {
            const videoSrc = firstVideoThumb.dataset.videoSrc;
            mainVideo.querySelector('source').src = videoSrc;
            mainVideo.load();
        }
    }

    // Media Thumbnail Click Handler
    function setupMediaThumbnails() {
        const mediaThumbnails = document.querySelectorAll('.media-thumbnail');
        const mainImageDisplay = document.getElementById('mainImageDisplay');
        const mainVideoDisplay = document.getElementById('mainVideoDisplay');
        const mainVideo = document.getElementById('mainVideo');
        const playPauseBtn = document.querySelector('.play-pause');

        mediaThumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function () {
                // Remove active class from all thumbnails
                mediaThumbnails.forEach(t => t.classList.remove('active'));

                // Add active class to clicked thumbnail
                this.classList.add('active');

                const mediaType = this.dataset.mediaType;
                const mediaSrc = mediaType === 'video' ?
                    this.dataset.videoSrc :
                    this.dataset.media;

                if (mediaType === 'image') {
                    // Show image
                    mainImageDisplay.classList.add('active');
                    mainVideoDisplay.classList.remove('active');

                    const mainImage = document.getElementById('mainImage');
                    mainImage.src = mediaSrc;

                    // Pause video if playing
                    if (mainVideo && !mainVideo.paused) {
                        mainVideo.pause();
                        if (playPauseBtn) {
                            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                        }
                    }
                } else if (mediaType === 'video') {
                    // Show video
                    mainImageDisplay.classList.remove('active');
                    mainVideoDisplay.classList.add('active');

                    // Update video source
                    const source = mainVideo.querySelector('source');
                    source.src = mediaSrc;
                    mainVideo.load();

                    // Auto-play video
                    mainVideo.play().then(() => {
                        if (playPauseBtn) {
                            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        }
                    }).catch(error => {
                        console.log('Auto-play failed:', error);
                    });
                }
            });
        });
    }

    // Media Type Tabs
    function setupMediaTabs() {
        const mediaTabBtns = document.querySelectorAll('.media-tab-btn');
        const mediaThumbnails = document.querySelectorAll('.media-thumbnail');

        mediaTabBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const mediaType = this.dataset.mediaType;

                // Update active tab
                mediaTabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // Show/hide thumbnails based on type
                mediaThumbnails.forEach(thumbnail => {
                    if (mediaType === 'all') {
                        thumbnail.style.display = 'block';
                    } else {
                        const thumbType = thumbnail.dataset.mediaType;
                        if (thumbType === mediaType) {
                            thumbnail.style.display = 'block';
                        } else {
                            thumbnail.style.display = 'none';
                        }
                    }
                });
            });
        });
    }

    // Video Lightbox
    function setupVideoLightbox() {
        const videoLightbox = document.getElementById('videoLightbox');
        const lightboxVideo = document.getElementById('lightboxVideo');
        const closeLightbox = document.querySelector('.close-lightbox');
        const lightboxOverlay = document.querySelector('.lightbox-overlay');
        const playOverlays = document.querySelectorAll('.play-overlay');

        // Open lightbox
        playOverlays.forEach(overlay => {
            overlay.addEventListener('click', function () {
                const videoSrc = this.dataset.videoSrc;
                const videoTitle = this.closest('.video-card')?.querySelector('h4')?.textContent || 'Product Video';

                // Set video source
                const source = lightboxVideo.querySelector('source');
                source.src = videoSrc;
                lightboxVideo.load();

                // Set video info
                document.getElementById('lightboxVideoTitle').textContent = videoTitle;

                // Show lightbox
                videoLightbox.style.display = 'block';
                document.body.style.overflow = 'hidden';

                // Play video
                setTimeout(() => {
                    lightboxVideo.play();
                }, 300);
            });
        });

        // Close lightbox
        function closeLightboxFunc() {
            videoLightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
            lightboxVideo.pause();
        }

        if (closeLightbox) {
            closeLightbox.addEventListener('click', closeLightboxFunc);
        }

        if (lightboxOverlay) {
            lightboxOverlay.addEventListener('click', closeLightboxFunc);
        }

        // Close with Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && videoLightbox.style.display === 'block') {
                closeLightboxFunc();
            }
        });
    }

    // Color selection functionality
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Remove active class from all colors
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            // Add active class to clicked color
            this.classList.add('selected');

            // Update sizes based on selected color
            const sizesString = this.dataset.sizes;
            const sizes = sizesString ? sizesString.split(',').map(s => s.trim()) : [];
            updateSizeOptions(sizes);
        });
    });

    function updateSizeOptions(sizes) {
        const sizeContainer = document.getElementById('sizeOptions');
        sizeContainer.innerHTML = '';

        sizes.forEach(size => {
            const sizeOption = document.createElement('div');
            sizeOption.className = 'size-option';
            sizeOption.textContent = size;
            sizeOption.dataset.size = size;
            sizeContainer.appendChild(sizeOption);

            sizeOption.addEventListener('click', function () {
                // Remove active class from all sizes
                document.querySelectorAll('.size-option').forEach(opt => opt.classList.remove('selected'));
                // Add active class to clicked size
                this.classList.add('selected');
            });
        });
    }

    // Quantity control
    const minusBtn = document.querySelector('.quantity-btn.minus');
    const plusBtn = document.querySelector('.quantity-btn.plus');
    const quantityInput = document.querySelector('.quantity-input');

    if (minusBtn && plusBtn && quantityInput) {
        minusBtn.addEventListener('click', function () {
            let value = parseInt(quantityInput.value) || 1;
            if (value > 1) {
                value--;
                quantityInput.value = value;
            }
        });

        plusBtn.addEventListener('click', function () {
            let value = parseInt(quantityInput.value) || 1;
            //const maxStock = @maxStock;

            if (value < maxStock) {
                value++;
                quantityInput.value = value;
            }
        });

        quantityInput.addEventListener('change', function () {
            let value = parseInt(this.value) || 1;
            //const maxStock = @maxStock;

            if (value < 1) this.value = 1;
            if (value > maxStock) this.value = maxStock;
        });
    }

    // Buy Now button
    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function () {
            // Buy now functionality
            alert('Buy Now functionality will be implemented soon!');
        });
    }

    // Wishlist button
    const wishlistBtn = document.getElementById('wishlistBtn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', function () {
            // Wishlist functionality
            alert('Wishlist functionality will be implemented soon!');
        });
    }

    // Tab functionality
    const tabHeaders = document.querySelectorAll('.tab-header');
    const tabContents = document.querySelectorAll('.tab-content');

    tabHeaders.forEach(header => {
        header.addEventListener('click', function () {
            const tabId = this.dataset.tab;

            // Update active tab header
            tabHeaders.forEach(h => h.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Initialize all video functionality
    initializeVideoPlayer();
    setupMediaThumbnails();
    setupMediaTabs();
    setupVideoLightbox();

    console.log('Video functionality initialized');
});