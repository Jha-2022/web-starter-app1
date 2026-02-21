import { useState, useRef, useEffect } from 'react';
import { VoicePipeline, ModelCategory } from '@runanywhere/web';
import { AudioCapture, AudioPlayback, VAD, SpeechActivity } from '@runanywhere/web-onnx';
import { useModelLoader } from '../hooks/useModelLoader';

type PipelineState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

export function VoiceQATab() {
  const [pipelineState, setPipelineState] = useState<PipelineState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    text: string;
  }>>([]);

  const audioCaptureRef = useRef<AudioCapture | null>(null);
  const audioPlaybackRef = useRef<AudioPlayback | null>(null);
  const vadUnsubRef = useRef<(() => void) | null>(null);
  const pipelineRef = useRef<VoicePipeline | null>(null);

  // Load all required models (LLM, STT, TTS, VAD)
  const llmLoader = useModelLoader(ModelCategory.Language, true);
  const sttLoader = useModelLoader(ModelCategory.SpeechRecognition, true);
  const ttsLoader = useModelLoader(ModelCategory.SpeechSynthesis, true);
  const vadLoader = useModelLoader(ModelCategory.Audio, true);

  const allModelsReady = 
    llmLoader.state === 'ready' && 
    sttLoader.state === 'ready' && 
    ttsLoader.state === 'ready' && 
    vadLoader.state === 'ready';

  useEffect(() => {
    // Initialize pipeline and components when models are ready
    if (allModelsReady && !pipelineRef.current) {
      pipelineRef.current = new VoicePipeline();
      audioPlaybackRef.current = new AudioPlayback();
    }

    return () => {
      // Cleanup
      if (audioCaptureRef.current) {
        audioCaptureRef.current.stop();
      }
      if (vadUnsubRef.current) {
        vadUnsubRef.current();
      }
    };
  }, [allModelsReady]);

  const handleLoadModels = async () => {
    setError(null);
    try {
      await Promise.all([
        llmLoader.ensure(),
        sttLoader.ensure(),
        ttsLoader.ensure(),
        vadLoader.ensure(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    }
  };

  const startListening = async () => {
    if (!allModelsReady || pipelineState !== 'idle') return;

    setError(null);
    setPipelineState('listening');
    setTranscript('');
    setResponse('');

    try {
      // Initialize audio capture
      const mic = new AudioCapture({ sampleRate: 16000 });
      audioCaptureRef.current = mic;

      // Reset VAD state
      VAD.reset();

      // Listen for speech activity
      vadUnsubRef.current = VAD.onSpeechActivity((activity) => {
        if (activity === SpeechActivity.Ended) {
          const segment = VAD.popSpeechSegment();
          if (segment && segment.samples.length > 1600) {
            // User finished speaking, process the turn
            setPipelineState('transcribing');
            processTurn(segment.samples);
          }
        }
      });

      // Start microphone with VAD processing
      await mic.start((chunk) => {
        VAD.processSamples(chunk);
      });

    } catch (err) {
      console.error('Failed to start listening:', err);
      setError(err instanceof Error ? err.message : 'Failed to start listening');
      setPipelineState('idle');
    }
  };

  const stopListening = () => {
    if (audioCaptureRef.current) {
      audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
    }
    if (vadUnsubRef.current) {
      vadUnsubRef.current();
      vadUnsubRef.current = null;
    }
    VAD.reset();
    setPipelineState('idle');
  };

  const processTurn = async (audioData: Float32Array) => {
    if (!pipelineRef.current) return;

    try {
      const result = await pipelineRef.current.processTurn(
        audioData,
        {
          maxTokens: 150,
          temperature: 0.7,
          systemPrompt: `You are a helpful study assistant. Answer questions clearly and concisely. Focus on being educational and accurate. Keep responses brief and to the point.`,
        },
        {
          onTranscription: (text) => {
            setTranscript(text);
            setPipelineState('thinking');
          },
          onResponseToken: (_token, accumulated) => {
            setResponse(accumulated);
          },
          onResponseComplete: (text) => {
            setPipelineState('speaking');
            // Add to conversation history
            setConversationHistory(prev => [
              ...prev,
              { role: 'user', text: result.transcription || transcript },
              { role: 'assistant', text },
            ]);
          },
          onSynthesisComplete: async (audio, sampleRate) => {
            if (audioPlaybackRef.current) {
              await audioPlaybackRef.current.play(audio, sampleRate);
            }
            setPipelineState('idle');
          },
          onStateChange: (state) => {
            console.log('Pipeline state:', state);
          },
        }
      );

    } catch (err) {
      console.error('Pipeline failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to process voice input');
      setPipelineState('idle');
    }
  };

  const clearHistory = () => {
    setConversationHistory([]);
    setTranscript('');
    setResponse('');
  };

  const anyModelLoading = 
    llmLoader.state === 'downloading' || llmLoader.state === 'loading' ||
    sttLoader.state === 'downloading' || sttLoader.state === 'loading' ||
    ttsLoader.state === 'downloading' || ttsLoader.state === 'loading' ||
    vadLoader.state === 'downloading' || vadLoader.state === 'loading';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>🎤 Voice Q&A</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
          Ask questions with your voice, get spoken answers
        </p>
      </div>

      {/* Model Loading Status */}
      {!allModelsReady && (
        <div style={{ 
          padding: '1rem', 
          background: '#2a2a2a', 
          borderRadius: '0.5rem',
          border: '1px solid #444' 
        }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
            {anyModelLoading ? 'Loading models...' : 'Models not loaded'}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>LLM (Language Model):</span>
              <span style={{ color: llmLoader.state === 'ready' ? '#4ade80' : '#888' }}>
                {llmLoader.state === 'downloading' ? `${Math.round(llmLoader.progress * 100)}%` : llmLoader.state}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>STT (Speech-to-Text):</span>
              <span style={{ color: sttLoader.state === 'ready' ? '#4ade80' : '#888' }}>
                {sttLoader.state === 'downloading' ? `${Math.round(sttLoader.progress * 100)}%` : sttLoader.state}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TTS (Text-to-Speech):</span>
              <span style={{ color: ttsLoader.state === 'ready' ? '#4ade80' : '#888' }}>
                {ttsLoader.state === 'downloading' ? `${Math.round(ttsLoader.progress * 100)}%` : ttsLoader.state}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VAD (Voice Detection):</span>
              <span style={{ color: vadLoader.state === 'ready' ? '#4ade80' : '#888' }}>
                {vadLoader.state === 'downloading' ? `${Math.round(vadLoader.progress * 100)}%` : vadLoader.state}
              </span>
            </div>
          </div>

          {!anyModelLoading && (
            <button
              onClick={handleLoadModels}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                background: '#ff6900',
                border: 'none',
                borderRadius: '0.25rem',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                width: '100%',
              }}
            >
              Load All Models
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '0.75rem',
          background: '#ff444420',
          border: '1px solid #ff4444',
          borderRadius: '0.5rem',
          color: '#ff4444',
        }}>
          {error}
        </div>
      )}

      {/* Pipeline Status */}
      {allModelsReady && (
        <div style={{
          padding: '1rem',
          background: '#2a2a2a',
          borderRadius: '0.5rem',
          border: '1px solid #444',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: pipelineState === 'idle' ? '#888' : '#4ade80',
              animation: pipelineState !== 'idle' ? 'pulse 1.5s infinite' : 'none',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>
                {pipelineState === 'idle' && 'Ready to listen'}
                {pipelineState === 'listening' && '🎤 Listening... Speak now!'}
                {pipelineState === 'transcribing' && '📝 Transcribing your question...'}
                {pipelineState === 'thinking' && '🤔 Thinking...'}
                {pipelineState === 'speaking' && '🔊 Speaking answer...'}
              </div>
              {transcript && pipelineState !== 'idle' && (
                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>
                  You: {transcript}
                </div>
              )}
              {response && pipelineState !== 'idle' && (
                <div style={{ fontSize: '0.85rem', color: '#ff6900', marginTop: '0.25rem' }}>
                  AI: {response}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#1a1a1a',
          borderRadius: '0.5rem',
          border: '1px solid #444',
          padding: '1rem',
          minHeight: '200px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#888' }}>
              Conversation History
            </div>
            <button
              onClick={clearHistory}
              style={{
                padding: '0.25rem 0.75rem',
                background: '#444',
                border: '1px solid #666',
                borderRadius: '0.25rem',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {conversationHistory.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '0.75rem',
                  background: item.role === 'user' ? '#2a2a2a' : '#ff690015',
                  borderRadius: '0.5rem',
                  borderLeft: `3px solid ${item.role === 'user' ? '#4ade80' : '#ff6900'}`,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                  {item.role === 'user' ? '👤 You' : '🤖 AI'}
                </div>
                <div style={{ fontSize: '0.9rem' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={pipelineState === 'idle' ? startListening : stopListening}
          disabled={!allModelsReady}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: allModelsReady && pipelineState === 'idle' ? '#ff6900' : 
                       pipelineState === 'listening' ? '#ff4444' : '#444',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#fff',
            cursor: allModelsReady ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: 'bold',
            opacity: allModelsReady ? 1 : 0.5,
          }}
        >
          {pipelineState === 'idle' ? '🎤 Start Voice Q&A' : '⏹️ Stop Listening'}
        </button>
      </div>

      {/* Usage Tips */}
      <div style={{
        padding: '0.75rem',
        background: '#2a2a2a',
        borderRadius: '0.5rem',
        border: '1px solid #444',
        fontSize: '0.85rem',
        color: '#888',
      }}>
        <div style={{ marginBottom: '0.5rem', color: '#fff', fontWeight: 'bold' }}>💡 Tips:</div>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Click "Start Voice Q&A" and ask a question out loud</li>
          <li>Wait for the AI to finish speaking before asking the next question</li>
          <li>Try questions like: "What is photosynthesis?", "Explain Newton's laws", "Who was Einstein?"</li>
          <li>All processing happens on-device - completely private!</li>
        </ul>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
