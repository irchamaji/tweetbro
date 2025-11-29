# X Reply Assistant

A Chrome extension that helps non-English speakers craft natural-sounding English replies to tweets using AI. (You can use it on other browsers too). Users can specify their intent and receive 5 differently-styled reply options to choose from.

## ✨ Features

- **Smart Reply Generation**: Uses OpenAI's GPT model to generate contextually appropriate replies
- **Multiple Styles**: Get 5 different reply styles (Clean & Simple, Casual & Friendly, Professional, Playful, Thoughtful)
- **One-Click Copy**: Copy any generated reply to clipboard instantly
- **Multilingual Input**: Enter your reply intent in any language - the extension generates English replies
- **Seamless Integration**: Adds a subtle "Rep" button to each tweet that appears on hover
- **Character Count**: Shows reply length to stay within Twitter's 280 character limit
- **API Key Management**: Secure popup interface for managing your OpenAI API key

## 🚀 Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "X Reply Assistant"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `extension` folder
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
1. **Navigate to X/Twitter** in your browser
2. **Hover over any tweet** - you'll see a purple "Rep" button appear
3. **Click the "Rep" button** - a modal will open
4. **Enter your reply intent** in the textarea (e.g., "I want to agree politely", "Je veux poser une question")
5. **Click "Generate Suggestions"** - watch the spinning loader while AI generates replies
6. **Choose your favorite reply** from the 5 options
7. **Click "Copy"** on any reply to copy it to clipboard
8. **Paste** the reply into Twitter's reply box

### Example Scenarios

**Agreeing with a tweet:**
- Input: "I want to agree and share my experience"
- Output: 5 different ways to express agreement

**Asking a question:**
- Input: "Je veux poser une question sur la technologie"
- Output: 5 polite question variations in English

**Disagreeing respectfully:**
- Input: "I want to disagree politely"
- Output: 5 diplomatic disagreement replies

## 🎨 Reply Styles

The extension generates 5 distinct reply styles:

1. **Clean & Simple** - Direct, professional, clear
2. **Casual & Friendly** - Warm, approachable, conversational
3. **Professional** - Formal, business-appropriate
4. **Playful** - Light, fun, witty
5. **Thoughtful** - Reflective, considerate, deep

## 🔒 Privacy & Security

- **API Key Storage**: Your OpenAI API key is stored locally in Chrome's secure storage
- **No Data Collection**: The extension only sends tweet text and your intent to OpenAI
- **Local Processing**: All UI interactions happen locally in your browser
- **Secure Communication**: Uses Chrome's extension messaging system

## 🛠️ Development

### Project Structure
```
extension/
├── manifest.json      # Extension configuration
├── background.js      # Service worker for API calls
├── content.js         # Main content script for Twitter integration
├── popup.html         # Settings popup interface
├── popup.js           # Settings popup functionality
└── styles.css         # UI styling
```

### Local Development
1. Clone the repository
2. Make changes to the files in the `extension/` folder
3. Reload the extension in `chrome://extensions/`
4. Test on x.com

### Building for Production
The extension is ready to use as-is. No build process required.
