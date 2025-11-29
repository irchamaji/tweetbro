// Popup script for managing API key

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');
  
  // Load existing API key
  const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
  if (openaiApiKey) {
    apiKeyInput.value = openaiApiKey;
  }
  
  // Save API key
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }
    
    try {
      await chrome.storage.sync.set({ openaiApiKey: apiKey });
      showStatus('API key saved successfully!', 'success');
    } catch (error) {
      showStatus('Failed to save API key', 'error');
    }
  });
  
  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});
