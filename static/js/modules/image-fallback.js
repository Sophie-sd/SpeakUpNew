/**
 * Image Fallback Module
 * Handles broken image loading errors and replaces them with placeholders
 *
 * Обробляє помилки завантаження зображень і замінює їх на заглушки
 */

const PLACEHOLDER_URL = '/static/img/news-placeholder.svg';

/**
 * Handles image loading error by replacing with placeholder
 * @param {HTMLImageElement} img - The image element
 */
function handleImageError(img) {
  if (img.dataset.imageFailed === 'true') {
    return; // Already processed
  }

  img.src = PLACEHOLDER_URL;
  img.classList.add('image-fallback');
  img.setAttribute('data-image-failed', 'true');
}


/**
 * Observe for dynamically added images (e.g., lazy-loaded content)
 * Uses MutationObserver to track new images
 */
function observeDynamicImages() {
  const contentContainer = document.querySelector('.news-article__content');

  if (!contentContainer) {
    return; // Not on article detail page
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is an image
            if (node.tagName === 'IMG' && node.dataset.imageFailed !== 'true') {
              node.addEventListener('error', () => handleImageError(node), {
                once: true,
              });
            }

            // Check for images inside the added node
            const imagesInNode = node.querySelectorAll?.('img');
            if (imagesInNode) {
              imagesInNode.forEach((img) => {
                if (img.dataset.imageFailed !== 'true') {
                  img.addEventListener('error', () => handleImageError(img), {
                    once: true,
                  });
                }
              });
            }
          }
        });
      }
    });
  });

  observer.observe(contentContainer, {
    childList: true,
    subtree: true,
  });
}

/**
 * Initialize with IntersectionObserver for lazy-loaded images
 * Ensures images that fail to load after being scrolled into view are handled
 */
function setupLazyLoadObserver() {
  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;

          // Add error listener when image comes into view
          if (img.dataset.imageFailed !== 'true') {
            img.addEventListener('error', () => handleImageError(img), {
              once: true,
            });
          }
        }
      });
    },
    {
      rootMargin: '50px',
    }
  );

  // Observe all images
  const images = document.querySelectorAll(
    '.news-item__image, .news-article__featured-image, .news-article__content img'
  );

  images.forEach((img) => {
    imageObserver.observe(img);
  });
}

/**
 * Public initialization function
 * Call this on page load or when new news elements are added
 */
export function initImageFallback() {
  // Initialize for existing images
  initImageFallbackForExisting();

  // Setup lazy load observer
  setupLazyLoadObserver();
}

/**
 * Helper function to initialize existing images
 */
function initImageFallbackForExisting() {
  // Select all news-related images
  const selectors = [
    '.news-item__image',
    '.news-article__featured-image',
    '.news-article__content img',
  ];

  const images = document.querySelectorAll(selectors.join(', '));

  images.forEach((img) => {
    // Only add listener if not already processed
    if (img.dataset.imageFailed !== 'true') {
      img.addEventListener('error', () => handleImageError(img), { once: true });
    }
  });

  // Watch for dynamically loaded images in article content
  observeDynamicImages();
}

/**
 * Manual image replacement function for imperatively handling images
 * @param {string} imageSelector - CSS selector for the image
 */
export function replaceImageWithFallback(imageSelector) {
  const img = document.querySelector(imageSelector);
  if (img) {
    handleImageError(img);
  }
}

export default {
  initImageFallback,
  replaceImageWithFallback,
};
