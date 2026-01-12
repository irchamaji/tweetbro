// Background service worker for API calls

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateReplies') {
    handleGenerateReplies(request.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Generate reply suggestions using OpenAI
async function handleGenerateReplies({ tweetText, userName, intent }) {
  try {
    // Get API key from storage
    const { openaiApiKey } = await chrome.storage.sync.get('openaiApiKey');
    
    if (!openaiApiKey) {
      return {
        success: false,
        error: 'API key not found. Please set your OpenAI API key in extension settings.'
      };
    }

    // Construct prompt for OpenAI
    const systemPrompt = `You are a helpful translator assistant that generates Twitter reply style suggestions in english based on what user want to say. 
Generate 5 different reply options in different styles based on the user's intent as a real person. 
(1) Chill & Relatable — calm, everyday scrolling energy that shows you genuinely relate without trying too hard; 
(2) Curious Builder — thoughtful, indie-hacker style replies that ask smart questions and invite discussion; 
(3) Light Skeptic — polite, non-aggressive disagreement that challenges the idea without sounding hostile; 
(4) Playful / Meme-ish — internet-native, casual, slightly humorous replies meant to boost engagement; 
(5) Confident Take — experienced, opinionated responses that sound assured but not arrogant.
Return ONLY a valid JSON object with this exact structure:
{
  "replies": [
    {"style": "Chill & Relatable", "text": "reply text here"},
    {"style": "Curious Builder", "text": "reply text here"},
    {"style": "Light Skeptic", "text": "reply text here"},
    {"style": "Playful / Meme-ish", "text": "reply text here"},
    {"style": "Confident Take", "text": "reply text here"}
  ]
}
Keep the tone natural, human, and suitable for social media, like an actual person replying in real time.
User will provide in non-english language or mixed with english. Your job is to understand the intent and generate appropriate english replies.
Keep each reply under 500 characters. Do not include any markdown, code blocks, emoji, dashes, or explanations - just the raw JSON.`;

    const userPrompt = `Original tweet by @${userName}: "${tweetText}"

User wants to say: "${intent}"

Generate 5 different reply style suggestions in english.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    let parsedContent;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[1]);
      } else {
        parsedContent = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse response:', content);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    if (!parsedContent.replies || !Array.isArray(parsedContent.replies)) {
      throw new Error('Invalid response format from AI');
    }

    return {
      success: true,
      replies: parsedContent.replies
    };

  } catch (error) {
    console.error('Error in handleGenerateReplies:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate replies'
    };
  }
}

// Set API key (can be called from popup/options page)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setApiKey') {
    chrome.storage.sync.set({ openaiApiKey: request.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
