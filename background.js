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
    const systemPrompt = `You are an expert at crafting engaging Twitter/X replies. Generate 5 reply suggestions in English based on the user's intent.

Each reply should sound natural and conversational - like a real person typing in the moment. Avoid:
- Overly formal or corporate language
- Multiple sentences when one works better
- Excessive punctuation (!!!, ???)
- Emoji (unless specified in style)
- Generic/safe responses that could apply to any post

Style Guidelines:
1. "Chill" - Relaxed, casual tone. Short and relatable without trying too hard.
2. "Curious" - Ask thoughtful questions or share genuine interest. Sounds like an engaged builder/maker.
3. "Pushback" - Politely disagree or offer alternative perspective. Constructive, not hostile.
4. "Playful" - Light humor or wit. Internet-native but not cringe. Can use gentle sarcasm.
5. "Hot Take" - Confident, opinionated stance. Sounds experienced without being arrogant.

Important:
- Keep replies under 280 characters (Twitter limit)
- Match the energy level of the original post
- User input may be in any language - translate intent to natural English
- Return ONLY valid JSON, no markdown or explanations

JSON format:
{
  "replies": [
    {"style": "Chill", "text": "reply here"},
    {"style": "Curious", "text": "reply here"},
    {"style": "Pushback", "text": "reply here"},
    {"style": "Playful", "text": "reply here"},
    {"style": "Hot Take", "text": "reply here"}
  ]
}`;

    const userPrompt = `Original post by @${userName}:
"${tweetText}"

User wants to say: "${intent}"

Generate 5 natural, engaging replies in different styles.`;

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
