# Cody (Kazi Coder)

A VS Code sidebar chat assistant powered by Anthropic Claude or OpenAI's GPT models. You provide your own API key—we never store it on our servers.

## Quick Start

1. **Install** the extension in VS Code.
2. **Open the chat view** (`Kazi: Open Chat` or click the Kazi icon in the activity bar).
3. **Connect your API key** — click the "Connect API" button in the header to set up.
   - Choose a provider: Anthropic (Claude) or OpenAI (GPT)
   - Select your preferred model
   - Paste your API key (stored securely, never sent to us)
4. **Start chatting!** Your conversation memory is saved locally in `.cody_memory.md` per workspace.

## Supported Models

**Anthropic Claude:**
- Claude Opus 4.6 (most capable)
- Claude Sonnet 4.6 (balanced)
- Claude Haiku 4.5 (fast & lightweight)

**OpenAI:**
- GPT-5.4 (most capable)
- GPT-5.4 Mini (faster)
- GPT-5.4 Nano (lightweight)

## Commands

- **`Kazi: Configure`** — Reset API key and re-open setup UI
- **`Kazi: New Session`** — Start a fresh conversation thread
- **`Kazi: Open Chat`** — Focus the chat sidebar (keyboard: `Cmd+Shift+K`)

## Security & Privacy

✅ **Your keys stay private:**
- API keys are stored via VS Code's encrypted `SecretStorage` (backed by your OS keychain)
- Keys never leave your machine
- We never see or log your keys

✅ **Local memory:**
- Conversation history is saved locally in `.cody_memory.md` per workspace
- Your data stays on your computer

## Get Your API Key

- **Anthropic:** https://console.anthropic.com
- **OpenAI:** https://platform.openai.com/api-keys

## Notes

- You'll be billed by your chosen LLM provider based on tokens used
- Internet connection required for API calls
- Memory is persisted locally—clear `.cody_memory.md` to reset
