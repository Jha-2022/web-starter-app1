import { useState, useEffect } from 'react';
import { initSDK, getAccelerationMode } from './runanywhere';
import { ChatTab } from './components/ChatTab';
import { VisionTab } from './components/VisionTab';
import { VoiceTab } from './components/VoiceTab';
import { TextToAudioTab } from './components/TextToAudioTab';
import { VoiceQATab } from './components/VoiceQATab';
import { QuizTab } from './components/QuizTab';

type Tab = 'chat' | 'vision' | 'voice' | 'text-to-audio' | 'voice-qa' | 'quiz';

export function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('quiz');

  useEffect(() => {
    initSDK()
      .then(() => setSdkReady(true))
      .catch((err) => setSdkError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (sdkError) {
    return (
      <div className="app-loading">
        <h2>SDK Error</h2>
        <p className="error-text">{sdkError}</p>
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <h2>Loading RunAnywhere SDK...</h2>
        <p>Initializing on-device AI engine</p>
      </div>
    );
  }

  const accel = getAccelerationMode();

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎓 StudyBuddy AI</h1>
        {accel && <span className="badge">{accel === 'webgpu' ? 'WebGPU' : 'CPU'}</span>}
        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
          Privacy-first study assistant • 100% on-device
        </div>
      </header>

      <nav className="tab-bar">
        <button className={activeTab === 'quiz' ? 'active' : ''} onClick={() => setActiveTab('quiz')}>
          📝 Quiz
        </button>
        <button className={activeTab === 'text-to-audio' ? 'active' : ''} onClick={() => setActiveTab('text-to-audio')}>
          📖 Text-to-Audio
        </button>
        <button className={activeTab === 'voice-qa' ? 'active' : ''} onClick={() => setActiveTab('voice-qa')}>
          🎤 Voice Q&A
        </button>
        <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
          💬 Chat
        </button>
        <button className={activeTab === 'vision' ? 'active' : ''} onClick={() => setActiveTab('vision')}>
          📷 Vision
        </button>
        <button className={activeTab === 'voice' ? 'active' : ''} onClick={() => setActiveTab('voice')}>
          🎙️ Voice Pipeline
        </button>
      </nav>

      <main className="tab-content">
        {activeTab === 'quiz' && <QuizTab />}
        {activeTab === 'text-to-audio' && <TextToAudioTab />}
        {activeTab === 'voice-qa' && <VoiceQATab />}
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'vision' && <VisionTab />}
        {activeTab === 'voice' && <VoiceTab />}
      </main>
    </div>
  );
}
