# 🎓 StudyBuddy AI - Privacy-First Study Assistant

A completely private, offline-capable study companion built with [RunAnywhere Web SDK](https://docs.runanywhere.ai/web/introduction) that combines all on-device AI capabilities into powerful learning tools.

## ✨ Features

### 📝 Quiz Generator
Generate practice questions on any topic to test your knowledge:
- **Customizable difficulty**: Easy, Medium, or Hard
- **Flexible question count**: 3, 5, 7, or 10 questions
- **Instant feedback**: Show/hide answers with explanations
- **100% on-device**: Your study topics stay completely private

**Use Cases:**
- Pre-exam self-testing
- Quick knowledge checks
- Concept reinforcement
- Study group preparation

### 📖 Text-to-Audio Notes
Convert your study materials to natural speech for audio learning:
- **Natural voice synthesis**: High-quality TTS using Piper neural voices
- **Flexible playback**: Play/stop controls
- **Performance stats**: Generation speed and audio duration
- **Study on-the-go**: Perfect for commuting or exercising

**Use Cases:**
- Audiobook-style note review
- Hands-free studying while multitasking
- Accessibility support
- Auditory learning preference

### 🎤 Voice Q&A
Ask questions with your voice and get spoken answers:
- **Natural conversation**: VAD automatically detects when you stop speaking
- **Full pipeline**: Speech-to-Text → LLM → Text-to-Speech
- **Conversation history**: Review past Q&A exchanges
- **Hands-free learning**: Perfect for active study sessions

**Use Cases:**
- Interactive study sessions
- Quick concept clarification
- Conversational learning
- Accessibility support

### 💬 Chat (Bonus)
Text-based chat with on-device LLM for detailed explanations

### 📷 Vision (Bonus)
Point camera at notes or textbooks for visual analysis

### 🎙️ Voice Pipeline (Bonus)
Full voice conversation system with custom system prompts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern browser (Chrome 120+, Edge 120+ recommended)
- 4GB+ RAM recommended for larger models

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### First Run

1. Open the app in your browser
2. Click on any tab (Quiz, Text-to-Audio, or Voice Q&A)
3. Click "Load Model" when prompted
4. Wait for model download (only happens once - cached locally)
5. Start using the feature!

## 🏗️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **AI SDK**: RunAnywhere Web SDK v0.1.0-beta.9
  - `@runanywhere/web` - Core SDK
  - `@runanywhere/web-llamacpp` - LLM/VLM backend (WebAssembly)
  - `@runanywhere/web-onnx` - STT/TTS/VAD backend (ONNX Runtime)

## 🧠 AI Models Used

All models run **100% on-device** via WebAssembly:

| Feature | Model | Size | Framework |
|---------|-------|------|-----------|
| Quiz Generator | Liquid AI LFM2-350M (Q4) | 250MB | llama.cpp |
| Text-to-Audio | Piper TTS (US English) | 65MB | sherpa-onnx |
| Voice Q&A (LLM) | Liquid AI LFM2-350M (Q4) | 250MB | llama.cpp |
| Voice Q&A (STT) | Whisper Tiny English | 105MB | sherpa-onnx |
| Voice Q&A (TTS) | Piper TTS (US English) | 65MB | sherpa-onnx |
| Voice Q&A (VAD) | Silero VAD v5 | 5MB | sherpa-onnx |

Models are downloaded once and cached in the browser's Origin Private File System (OPFS).

## 🔒 Privacy & Security

**Your data never leaves your device:**
- ✅ All AI inference runs locally in the browser via WebAssembly
- ✅ No server calls or API keys required
- ✅ Study notes, questions, and conversations stay 100% private
- ✅ Works completely offline once models are downloaded
- ✅ Models cached locally in browser sandbox storage

## 🎯 Use Cases

### For Students
- **Exam Preparation**: Generate practice questions on any subject
- **Commute Learning**: Convert notes to audio for travel time
- **Quick Q&A**: Voice-based clarification of concepts
- **Late Night Study**: Hands-free voice interaction

### For Teachers
- **Quiz Creation**: Quickly generate test questions
- **Accessibility**: Provide audio versions of materials
- **Interactive Learning**: Voice-based classroom tools

### For Self-Learners
- **Topic Exploration**: Generate quizzes on new subjects
- **Multi-modal Learning**: Text, audio, and voice options
- **Privacy**: Learn sensitive topics without data leakage

## 📁 Project Structure

```
src/
├── components/
│   ├── QuizTab.tsx          # Quiz generator component
│   ├── TextToAudioTab.tsx   # Text-to-speech converter
│   ├── VoiceQATab.tsx        # Voice Q&A interface
│   ├── ChatTab.tsx           # Text chat component
│   ├── VisionTab.tsx         # Vision analysis component
│   └── VoiceTab.tsx          # Full voice pipeline
├── hooks/
│   └── useModelLoader.ts     # Model loading hook
├── workers/
│   └── vlm-worker.ts         # Vision model web worker
├── runanywhere.ts            # SDK initialization & config
├── App.tsx                   # Main app with tab navigation
└── main.tsx                  # React entry point
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Key Configuration Files

- `vite.config.ts` - Vite build config with WASM plugin
- `vercel.json` - Deployment config with CORS headers
- `src/runanywhere.ts` - SDK initialization and model catalog

### Cross-Origin Isolation

The app requires these headers for multi-threaded WASM:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

These are configured in:
- `vite.config.ts` for dev server
- `vercel.json` for production deployment

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel --prod
```

The `vercel.json` config automatically sets required CORS headers.

### Other Platforms

Ensure your hosting platform sets the COOP/COEP headers:
1. Add headers to `.htaccess` (Apache)
2. Configure `nginx.conf` (Nginx)
3. Use Cloudflare Workers for header injection

## 🤝 Contributing

This is a demo application showcasing RunAnywhere SDK capabilities. Feel free to:
- Add new features using other SDK capabilities
- Improve UI/UX
- Add more language models or voices
- Create new study tools

## 📚 Resources

- [RunAnywhere Web SDK Docs](https://docs.runanywhere.ai/web/introduction)
- [RunAnywhere GitHub](https://github.com/RunanywhereAI/runanywhere-sdks)
- [Example Apps](https://github.com/RunanywhereAI/runanywhere-sdks/tree/main/examples/web)

## 📄 License

MIT License - See LICENSE file for details

## 🎓 About

Built with ❤️ using RunAnywhere Web SDK to showcase the power of on-device AI for privacy-preserving educational applications.

**Key Advantages:**
- 🔒 Complete privacy - data never leaves device
- 🌐 Works offline after initial download
- ⚡ Fast inference with WebGPU acceleration
- 🎯 Purpose-built for learning and education
- 🔓 Open source and transparent

---

**Made with RunAnywhere SDK** • [Documentation](https://docs.runanywhere.ai) • [GitHub](https://github.com/RunanywhereAI/runanywhere-sdks)
