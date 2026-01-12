# AI Reply Assistant for Threads & Twitter/X

A Chrome extension that helps you craft natural-sounding replies to posts on **Threads.net** and **Twitter/X** using AI. Users can specify their intent and receive 5 differently-styled reply options to choose from.

## ✨ Features

- **Multi-Platform Support**: Works seamlessly on both Threads (threads.net) and Twitter/X (x.com, twitter.com)
- **Smart Reply Generation**: Uses OpenAI's GPT-4o-mini model to generate contextually appropriate replies
- **Multiple Styles**: Get 5 different reply styles (Professional, Casual, Humorous, Supportive, Inquisitive)
- **One-Click Copy**: Copy any generated reply to clipboard instantly
- **Multilingual Input**: Enter your reply intent in any language - the extension generates replies accordingly
- **Platform-Aware**: Automatically detects which platform you're on and adjusts functionality
- **Seamless Integration**: Adds a subtle "Rep" button to each post that appears on hover
- **Character Count**: Shows reply length to stay within platform character limits
- **API Key Management**: Secure popup interface for managing your OpenAI API key
- **Smooth Animations**: Beautiful UI with anime.js animations

## 🚀 Installation

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `tweetbro` folder
5. The extension will be installed and ready to use

## 🔧 Setup

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (keep it secure!)

### 2. Configure the Extension
1. Click the extension icon in your Chrome toolbar
2. Paste your OpenAI API key in the input field
3. Click "Save API Key"
4. You're ready to use the extension!

## 📖 Usage

### Basic Usage
1. **Navigate to Threads.com or X.com/Twitter.com** in your browser
2. **Hover over any post** - you'll see a purple "Rep" button appear
3. **Click the "Rep" button** - a modal will open
4. **Enter your reply intent** in the textarea (e.g., "I want to agree politely", "Je veux poser une question")
5. **Click "Generate Suggestions"** - watch the spinning loader while AI generates replies
6. **Choose your favorite reply** from the 5 options
7. **Click "Copy"** to copy the reply to your clipboard
8. **Paste and send** your reply on the platform!

## 🔍 How It Works

The extension automatically detects which platform you're on (Threads or Twitter/X) and analyzes the post content along with your specified intent to generate contextually appropriate replies. It uses OpenAI's GPT-4o-mini model to understand both the original post and your reply goals, then creates 5 different reply styles:

- **Professional**: Formal and polished
- **Casual**: Relaxed and approachable
- **Humorous**: Fun and engaging with wit
- **Supportive**: Encouraging and empathetic
- **Inquisitive**: Curious and thought-provoking

## 🛠️ Technical Details

- **Manifest V3**: Uses the latest Chrome extension standards
- **Platform Detection**: Automatically detects Twitter/X or Threads based on hostname
- **Content Scripts**: Injects functionality into both Threads.com and X.com/Twitter.com pages
- **Background Service Worker**: Handles API communication securely
- **Local Storage**: Stores your API key securely in browser storage
- **Anime.js**: Provides smooth animations for better user experience

### Platform-Specific Implementation

**Platform Detection:**
```javascript
const isTwitter = window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com');
const isThreads = window.location.hostname.includes('threads.com');
```

**Twitter/X:**
- Uses CSS selector: `article[data-testid="tweet"]` to find tweets
- Adds button to action bar: `[role="group"]`
- Extracts text from: `[data-testid="tweetText"]`

**Threads:**
- Uses XPath to find posts container: `//*[@id="barcelona-page-layout"]/div/div/div[2]/div[1]/div[3]/div/div[1]`
- Supports multiple post types with different XPath patterns:
  - Posts with reply: `./div/div[1]/div/the current HTML structures of both Threads.com and Twitter/X. If either platform updates their interface, the selectors in `content.js` may need to be updated to continue working properly.

## 🔒 Privacy

- Your OpenAI API key is stored securely in Chrome's sync storage
- No data is collected or sent anywhere except to OpenAI's API
- All processing happens client-side
- The extension only runs on threads.com, x.com, and twitter.com

## 📄 License

This project is for educational and personal use. Please respect OpenAI's terms of service and both platform
## 🤝 Contributing

This extension is designed to work with Threads.com's current HTML structure. If Threads updates their interface, the selectors in `content.js` may need to be updated to continue working properly.

## 📄 License

This project is for educational and personal use. Please respect OpenAI's terms of service and Threads' community guidelines when using this extension.