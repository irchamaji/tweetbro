// Track which posts already have buttons (works for both Twitter and Threads)
const processedPosts = new WeakSet();

// Track active modal
let activeModal = null;

// Detect which platform we're on
const isTwitter = window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com');
const isThreads = window.location.hostname.includes('threads.com');

console.log(`Platform detected: ${isTwitter ? 'Twitter/X' : isThreads ? 'Threads' : 'Unknown'}`);

// Create modal for reply suggestions
function createModal(post, postText, userName) {
  const modal = document.createElement('div');
  modal.className = 'reply-suggestion-modal';

  modal.innerHTML = `
    <div class="modal-header">
      <h3>Reply to @${userName}</h3>
      <button class="modal-close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="input-section">
        <label>What do you want to say?</label>
        <textarea class="intent-input" rows="4" placeholder="e.g.:&#10;- quels outils utilisez-vous&#10;- i do not agree&#10;- eu tenho a mesma experiência"></textarea>
      </div>
      <button class="generate-btn">Generate Suggestions</button>
    </div>
  `;

  // Position modal relative to post, but keep it within viewport
  const postRect = post.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 16; // Padding from viewport edges
  const modalWidth = 400; // From CSS: .reply-suggestion-modal { width: 400px; }
  const estimatedModalHeight = 500; // Approximate height for initial positioning
  
  let modalLeft = postRect.right + 20;
  let modalTop = postRect.top;
  
  // Adjust horizontal position if modal would overflow right edge
  if (modalLeft + modalWidth + padding > viewportWidth) {
    // Try to position on the left side of the post
    modalLeft = postRect.left - modalWidth - 20;
    // If that still overflows, align to right edge with padding
    if (modalLeft < padding) {
      modalLeft = viewportWidth - modalWidth - padding;
    }
  }
  
  // Ensure modal doesn't overflow left edge
  if (modalLeft < padding) {
    modalLeft = padding;
  }
  
  // Adjust vertical position if modal would overflow bottom
  if (modalTop + estimatedModalHeight + padding > viewportHeight) {
    // Align to bottom with padding
    modalTop = viewportHeight - estimatedModalHeight - padding;
  }
  
  // Ensure modal doesn't overflow top
  if (modalTop < padding) {
    modalTop = padding;
  }
  
  modal.style.position = 'fixed';
  modal.style.top = `${modalTop}px`;
  modal.style.left = `${modalLeft}px`;
  modal.style.opacity = '0';
  modal.style.transform = 'scale(0.9)';
  modal.style.maxHeight = `${viewportHeight - (padding * 2)}px`;

  // Close modal handler
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => {
    anime({
      targets: closeBtn,
      rotate: 90,
      duration: 150,
      easing: 'easeOutQuad'
    });
    closeModal(modal);
  });

  // Generate button handler
  const generateBtn = modal.querySelector('.generate-btn');
  generateBtn.addEventListener('click', async () => {
    const intent = modal.querySelector('.intent-input').value;

    if (!intent.trim()) {
      alert('Please enter what you want to say');
      return;
    }

    // Show loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="spinning-loader">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
      </svg>
      <span>Generating...</span>
    `;

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'generateReplies',
        data: {
          tweetText: postText,
          userName,
          intent
        }
      });

      if (response.success) {
        console.log('Generated replies:', response.replies);
        displayReplies(modal, response.replies);
      } else {
        alert('Error: ' + response.error);
      }
    } catch (error) {
      console.error('Error generating replies:', error);
      alert('Failed to generate replies. Please try again.');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = 'Suggest';
    }
  });

  document.body.appendChild(modal);

  // Animate modal in
  anime({
    targets: modal,
    opacity: [0, 1],
    scale: [0.9, 1],
    duration: 250,
    easing: 'easeOutQuad'
  });

  return modal;
}

// Display generated replies in modal
function displayReplies(modal, replies) {
  const modalBody = modal.querySelector('.modal-body');

  // Remove input section and generate button
  modalBody.innerHTML = '';

  // Create replies container
  const repliesContainer = document.createElement('div');
  repliesContainer.className = 'replies-container';

  replies.forEach((reply, index) => {
    const replyCard = document.createElement('div');
    replyCard.className = 'reply-card';
    replyCard.style.opacity = '0';
    replyCard.style.transform = 'translateY(10px)';

    replyCard.innerHTML = `
      <div class="reply-header">
        <span class="reply-style">${reply.style}</span>
        <div class="reply-header-right">
          <span class="reply-length">${reply.text.length} chars</span>
          <button class="copy-btn" data-text="${reply.text.replace(/"/g, '&quot;')}" aria-label="Copy reply">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
        </div>
      </div>
      <p class="reply-text">${reply.text}</p>
    `;

    // Add copy functionality
    const copyBtn = replyCard.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(reply.text);
        copyBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        `;
        anime({
          targets: copyBtn,
          scale: [1, 1.1, 1],
          duration: 300,
          easing: 'easeOutQuad'
        });
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          `;
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy to clipboard');
      }
    });

    repliesContainer.appendChild(replyCard);
  });

  modalBody.appendChild(repliesContainer);

  // Animate cards in
  anime({
    targets: repliesContainer.querySelectorAll('.reply-card'),
    opacity: [0, 1],
    translateY: [10, 0],
    delay: anime.stagger(50),
    duration: 300,
    easing: 'easeOutQuad'
  });
}

// Close and remove modal
async function closeModal(modal) {
  if (modal && modal.parentNode) {
    await anime({
      targets: modal,
      opacity: 0,
      scale: 0.9,
      duration: 200,
      easing: 'easeInQuad'
    }).finished;
    modal.remove();
    activeModal = null;
  }
}

// Close modal when clicking outside
function setupModalBackdrop() {
  document.addEventListener('click', (e) => {
    if (activeModal && !activeModal.contains(e.target) && !e.target.closest('.ai-analyze-btn')) {
      closeModal(activeModal);
    }
  });
}

// Create and style the analyze button
function createAnalyzeButton() {
  const button = document.createElement('button');
  button.className = 'ai-analyze-btn';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
    </svg>
    <span>Rep</span>
  `;
  button.style.opacity = '0';
  button.style.transform = 'translateY(5px)';
  return button;
}

// Find posts on the page (platform-aware)
function findPosts() {
  if (isTwitter) {
    // Twitter/X uses article tags for tweets
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    if (tweets.length > 0) {
      console.log(`Found ${tweets.length} tweets`);
      return Array.from(tweets);
    }
    return [];
  }
  
  if (isThreads) {
    // Use XPath to find all direct children of the posts container
    // Each post is at /div[INDEX] where INDEX can be 1, 2, 3, 46, etc.
    const postsContainerXPath = '//*[@id="barcelona-page-layout"]/div/div/div[2]/div[1]/div[3]/div/div[1]';
    
    try {
      const containerResult = document.evaluate(postsContainerXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const container = containerResult.singleNodeValue;
      
      if (container) {
        // Get all direct children of the container - these are the individual posts
        const allChildren = Array.from(container.children);
        const threads = allChildren.filter(child => {
          // Each post should be a DIV with nested content
          return child.tagName === 'DIV' && child.children.length > 0;
        });
        
        if (threads.length > 0) {
          console.log(`Found ${threads.length} threads as direct children of container`);
          return threads;
        }
      }
    } catch (error) {
      console.error('Error finding posts container:', error);
    }

    // Fallback: Use CSS selector to find posts by their characteristic class
    try {
      const posts = document.querySelectorAll('div[data-pressable-container="true"][data-interactive-id]');
      if (posts.length > 0) {
        console.log(`Found ${posts.length} threads using data-pressable-container selector`);
        return Array.from(posts);
      }
    } catch (error) {
      console.error('Error with pressable container selector:', error);
    }

    // Final fallback to generic selectors
    const selectors = [
      'article[data-testid="post"]',
      'article[data-testid="thread-post"]',
      'div[data-testid="post-container"]',
      'div[data-testid="thread-item"]',
      'article',
      'div[role="article"]'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} threads using fallback selector: ${selector}`);
        return Array.from(elements);
      }
    }

    console.log('No threads found with any method');
  }
  
  return [];
}

// Add button to a post (platform-aware)
function addButtonToPost(post) {
  if (processedPosts.has(post)) return;

  console.log('Adding button to post:', post);
  
  // Twitter/X logic
  if (isTwitter) {
    // Find the action bar (where like, retweet buttons are)
    const actionBar = post.querySelector('[role="group"]');
    if (!actionBar) return;
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'ai-analyze-container';
    
    const button = createAnalyzeButton();
    buttonContainer.appendChild(button);
    
    // Insert button into action bar
    actionBar.appendChild(buttonContainer);
    
    setupButtonEvents(post, button);
    processedPosts.add(post);
    return;
  }

  // Threads.com logic
  if (isThreads) {
    // Find the target container where button should be appended as last child
    // Different post types have different structures:
    // - Post with link preview: div/div/div/div/div[3]/div/div[3]/div
    // - Post with image: div/div/div/div/div[3]/div/div[3]/div
    // - Post with text only: div/div/div/div/div[3]/div/div[2]/div
    // - Post with reply in feed: div/div[1]/div/div/div[4]/div/div[3]/div
    let targetContainer = null;
  
  // Try different XPath patterns for different post types
  const xpathPatterns = [
    './div/div[1]/div/div/div[4]/div/div[3]/div',  // Posts with reply in feed
    './div/div/div/div/div[3]/div/div[3]/div',     // Posts with link preview or image
    './div/div/div/div/div[3]/div/div[2]/div',     // Posts with text only
    './/div[4]/div/div[3]/div',                     // Shorter pattern for reply
    './/div[3]/div/div[3]/div',                     // Shorter pattern for link/image
    './/div[3]/div/div[2]/div'                      // Shorter pattern for text only
  ];
  
    for (const xpath of xpathPatterns) {
      try {
        const result = document.evaluate(xpath, post, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const element = result.singleNodeValue;
        if (element) {
          targetContainer = element;
          console.log(`Found target container with XPath pattern: ${xpath}`);
          break;
        }
      } catch (error) {
        // Continue to next pattern
      }
    }

    if (!targetContainer) {
      console.log('No target container found for post, trying action bar fallback');
      
      // Fallback to old method - append to action bar
      let actionBar = null;
      const allDivs = post.querySelectorAll('div');
      for (const div of allDivs) {
        const buttons = div.querySelectorAll('button, [role="button"]');
        if (buttons.length >= 3 && buttons.length <= 6) {
          actionBar = div;
          break;
        }
      }
      
      if (actionBar) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'ai-analyze-container';
        const button = createAnalyzeButton();
        buttonContainer.appendChild(button);
        actionBar.appendChild(buttonContainer);
        setupButtonEvents(post, button);
        processedPosts.add(post);
      }
      return;
    }

    console.log('Successfully found target container, appending button as last child');

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'ai-analyze-container';

    const button = createAnalyzeButton();
    buttonContainer.appendChild(button);

    // Append button container as the last child of target container
    targetContainer.appendChild(buttonContainer);

    setupButtonEvents(post, button);
    processedPosts.add(post);
  }
}

// Setup button events (extracted to reuse)
function setupButtonEvents(post, button) {
  // Show button on post hover
  post.addEventListener('mouseenter', () => {
    anime({
      targets: button,
      opacity: 1,
      translateY: 0,
      duration: 200,
      easing: 'easeOutQuad'
    });
  });

  post.addEventListener('mouseleave', () => {
    anime({
      targets: button,
      opacity: 0,
      translateY: 5,
      duration: 200,
      easing: 'easeInQuad'
    });
  });

  // Button click handler
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Animate button click
    anime({
      targets: button,
      scale: [1, 0.95, 1],
      duration: 150,
      easing: 'easeOutQuad'
    });

    // Close existing modal if any
    if (activeModal) {
      closeModal(activeModal);
    }

    // Extract post text and user name
    const postText = extractPostText(post);
    const userName = extractUserName(post);

    console.log('=== Opening Reply Suggestion Modal ===');
    console.log('User Name:', userName);
    console.log('Post content:', postText);

    // Create and show modal
    const modal = createModal(post, postText, userName);
    activeModal = modal;
  });
}

// Extract text from post (platform-aware)
function extractPostText(post) {
  if (isTwitter) {
    const textElement = post.querySelector('[data-testid="tweetText"]');
    return textElement ? textElement.innerText : '';
  }
  
  if (isThreads) {
    // Try different selectors for thread text, prioritizing Threads-specific patterns
    const textSelectors = [
      // Threads-specific selectors
      'div[data-testid="post-text"]',
      'span[data-testid="post-text"]',
      'div[dir="auto"]', // Often used for text content
      'span[dir="auto"]',
      // Generic selectors
      '[data-testid="post-text"]',
      '[data-testid="thread-text"]',
      'div[data-testid="post-content"] p',
      '.post-text',
      '.thread-text',
      'p',
      'span'
    ];

    for (const selector of textSelectors) {
      const textElements = post.querySelectorAll(selector);
      for (const textElement of textElements) {
        const text = textElement.innerText || textElement.textContent;
        if (text && text.trim() && text.length > 10) { // Filter out short texts like usernames
          return text.trim();
        }
      }
    }
  }

  return '';
}

// Extract user name from post (platform-aware)
function extractUserName(post) {
  if (isTwitter) {
    // Try to find the display name in the tweet header
    const userElement = post.querySelector('[data-testid="User-Name"]');
    if (userElement) {
      // The display name is usually in a span within the user element
      const nameSpan = userElement.querySelector('span');
      if (nameSpan) {
        return nameSpan.innerText;
      }
    }
    return 'Unknown';
  }
  
  if (isThreads) {
    // Try different selectors for user name, prioritizing Threads-specific patterns
    const nameSelectors = [
      // Threads-specific selectors
      'a[data-testid="user-name-link"]',
      'span[data-testid="user-name"]',
      'div[data-testid="user-name"]',
      'a[href*="/@"]',
      // Generic selectors
      '[data-testid="user-name"]',
      '[data-testid="post-author"]',
      '[data-testid="thread-author"]',
      '.user-name',
      '.post-author',
      '.thread-author'
    ];

    for (const selector of nameSelectors) {
      const userElements = post.querySelectorAll(selector);
      for (const userElement of userElements) {
        // Try to get text content
        const text = userElement.innerText || userElement.textContent;
        if (text && text.trim()) {
          // Extract username from URL if it's a link
          if (userElement.href && userElement.href.includes('/@')) {
            const match = userElement.href.match(/\/@([^\/\?]+)/);
            if (match) return match[1];
          }
          // Return the text if it's a reasonable username length
          if (text.trim().length > 0 && text.trim().length < 50) {
            return text.trim();
          }
        }
      }
    }
  }

  return 'Unknown';
}

// Process all posts on the page
function processPosts() {
  const posts = findPosts();
  console.log('Processing posts:', posts.length);
  posts.forEach((post, index) => {
    console.log(`Processing post ${index + 1}:`, post);
    addButtonToPost(post);
  });
}

// Watch for new posts loading (infinite scroll)
const observer = new MutationObserver((mutations) => {
  processPosts();
});

// Start observing
function init() {
  // Setup modal backdrop click handler
  setupModalBackdrop();

  // Process existing posts
  processPosts();

  // Watch for new posts
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  const platform = isTwitter ? 'Twitter/X' : isThreads ? 'Threads' : 'Unknown';
  console.log(`AI Reply Assistant loaded for ${platform}!`);
}

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}