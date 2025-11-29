// Track which tweets already have buttons
const processedTweets = new WeakSet();

// Track active modal
let activeModal = null;

// Create modal for reply suggestions
function createModal(tweet, tweetText, userName) {
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
  
  // Position modal relative to tweet
  const tweetRect = tweet.getBoundingClientRect();
  modal.style.position = 'fixed';
  modal.style.top = `${tweetRect.top}px`;
  modal.style.left = `${tweetRect.right + 20}px`;
  
  // Close modal handler
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => {
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
          tweetText,
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
      generateBtn.innerHTML = 'Generate Suggestions';
    }
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
    
    replyCard.innerHTML = `
      <div class="reply-header">
        <span class="reply-style">${reply.style}</span>
        <span class="reply-length">${reply.text.length} chars</span>
      </div>
      <p class="reply-text">${reply.text}</p>
      <button class="copy-btn" data-text="${reply.text.replace(/"/g, '&quot;')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        Copy
      </button>
    `;
    
    // Add copy functionality
    const copyBtn = replyCard.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(reply.text);
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            Copy
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
}

// Close and remove modal
function closeModal(modal) {
  if (modal && modal.parentNode) {
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
  return button;
}

// Find tweet articles on the page
function findTweets() {
  // Twitter/X uses article tags for tweets
  return document.querySelectorAll('article[data-testid="tweet"]');
}

// Add button to a tweet
function addButtonToTweet(tweet) {
  if (processedTweets.has(tweet)) return;
  
  // Find the action bar (where like, retweet buttons are)
  const actionBar = tweet.querySelector('[role="group"]');
  if (!actionBar) return;
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'ai-analyze-container';
  
  const button = createAnalyzeButton();
  buttonContainer.appendChild(button);
  
  // Insert button into action bar
  actionBar.appendChild(buttonContainer);
  
  // Show button on tweet hover
  tweet.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
  });
  
  tweet.addEventListener('mouseleave', () => {
    button.style.opacity = '0';
  });
  
  // Button click handler
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Close existing modal if any
    if (activeModal) {
      closeModal(activeModal);
    }
    
    // Extract tweet text and Twitter name
    const tweetText = extractTweetText(tweet);
    const userName = extractUserName(tweet);
    
    console.log('=== Opening Reply Suggestion Modal ===');
    console.log('User Name:', userName);
    console.log('Tweet content:', tweetText);
    
    // Create and show modal
    const modal = createModal(tweet, tweetText, userName);
    document.body.appendChild(modal);
    activeModal = modal;
  });
  
  processedTweets.add(tweet);
}

// Extract text from tweet
function extractTweetText(tweet) {
  const textElement = tweet.querySelector('[data-testid="tweetText"]');
  return textElement ? textElement.innerText : '';
}

// Extract Twitter display name from tweet
function extractUserName(tweet) {
  // Try to find the display name in the tweet header
  const userElement = tweet.querySelector('[data-testid="User-Name"]');
  if (userElement) {
    // The display name is usually in a span within the user element
    const nameSpan = userElement.querySelector('span');
    if (nameSpan) {
      return nameSpan.innerText;
    }
  }
  return 'Unknown';
}

// Process all tweets on the page
function processTweets() {
  const tweets = findTweets();
  tweets.forEach(tweet => addButtonToTweet(tweet));
}

// Watch for new tweets loading (infinite scroll)
const observer = new MutationObserver((mutations) => {
  processTweets();
});

// Start observing
function init() {
  // Setup modal backdrop click handler
  setupModalBackdrop();
  
  // Process existing tweets
  processTweets();
  
  // Watch for new tweets
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('Tweet AI Analyzer loaded!');
}

// Wait for page to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}