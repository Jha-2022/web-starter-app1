import { useState, useRef } from 'react';
import { ModelCategory } from '@runanywhere/web';
import { TTS } from '@runanywhere/web-onnx';
import { useModelLoader } from '../hooks/useModelLoader';

export function TextToAudioTab() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioStats, setAudioStats] = useState<{
    duration: number;
    generationTime: number;
    sampleRate: number;
  } | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const loader = useModelLoader(ModelCategory.SpeechSynthesis);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text to convert to audio');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioStats(null);

    // Stop any currently playing audio
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }

    try {
      const startTime = performance.now();
      
      // Generate speech from text
      const result = await TTS.synthesize(text, {
        speed: 1.0,
      });

      const generationTime = performance.now() - startTime;
      const duration = result.audioData.length / result.sampleRate;

      setAudioStats({
        duration,
        generationTime: generationTime / 1000,
        sampleRate: result.sampleRate,
      });

      // Play the audio
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioContext = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policies)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create audio buffer
      const audioBuffer = audioContext.createBuffer(
        1, // mono
        result.audioData.length,
        result.sampleRate
      );

      // Copy audio data to buffer
      audioBuffer.getChannelData(0).set(result.audioData);

      // Create and connect source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      audioSourceRef.current = source;

      // Play audio
      source.start(0);

      // Clear reference when done
      source.onended = () => {
        audioSourceRef.current = null;
      };

    } catch (err) {
      console.error('TTS generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
  };

  const loadSampleText = (sample: string) => {
    setText(sample);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>📖 Text-to-Audio Notes</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
          Convert your study notes to natural speech for audio learning
        </p>
      </div>

      {/* Sample Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => loadSampleText('The mitochondria is the powerhouse of the cell. It produces ATP through cellular respiration, converting glucose and oxygen into energy that powers all cellular processes.')}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
            background: '#444',
            border: '1px solid #666',
            borderRadius: '0.25rem',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Biology Sample
        </button>
        <button
          onClick={() => loadSampleText('The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides. This is expressed as a squared plus b squared equals c squared.')}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
            background: '#444',
            border: '1px solid #666',
            borderRadius: '0.25rem',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Math Sample
        </button>
        <button
          onClick={() => loadSampleText('The Industrial Revolution began in Britain during the late 18th century. It marked a major turning point in history as manufacturing processes transitioned from hand production to machines, leading to unprecedented economic growth.')}
          style={{
            padding: '0.5rem 0.75rem',
            fontSize: '0.85rem',
            background: '#444',
            border: '1px solid #666',
            borderRadius: '0.25rem',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          History Sample
        </button>
      </div>

      {/* Text Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your study notes here..."
        disabled={isGenerating || loader.state !== 'ready'}
        style={{
          flex: 1,
          padding: '0.75rem',
          fontSize: '1rem',
          fontFamily: 'inherit',
          background: '#222',
          border: '1px solid #444',
          borderRadius: '0.5rem',
          color: '#fff',
          resize: 'none',
          minHeight: '200px',
        }}
      />

      {/* Model Loading Status */}
      {loader.state !== 'ready' && (
        <div style={{ 
          padding: '1rem', 
          background: '#2a2a2a', 
          borderRadius: '0.5rem',
          border: '1px solid #444' 
        }}>
          {loader.state === 'idle' && (
            <div>
              <div style={{ marginBottom: '0.5rem' }}>TTS model not loaded</div>
              <button
                onClick={loader.ensure}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#ff6900',
                  border: 'none',
                  borderRadius: '0.25rem',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Load TTS Model
              </button>
            </div>
          )}
          {loader.state === 'downloading' && (
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                Downloading TTS model... {Math.round(loader.progress * 100)}%
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: '#444',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${loader.progress * 100}%`,
                  height: '100%',
                  background: '#ff6900',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}
          {loader.state === 'loading' && (
            <div>Loading TTS model into memory...</div>
          )}
          {loader.error && (
            <div style={{ color: '#ff4444' }}>Error: {loader.error}</div>
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

      {/* Stats Display */}
      {audioStats && (
        <div style={{
          padding: '0.75rem',
          background: '#2a2a2a',
          borderRadius: '0.5rem',
          border: '1px solid #444',
          fontSize: '0.9rem',
        }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ color: '#888' }}>Duration:</span>{' '}
              <span style={{ color: '#ff6900', fontWeight: 'bold' }}>
                {audioStats.duration.toFixed(2)}s
              </span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Generation:</span>{' '}
              <span style={{ color: '#ff6900', fontWeight: 'bold' }}>
                {audioStats.generationTime.toFixed(2)}s
              </span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Speed:</span>{' '}
              <span style={{ color: '#ff6900', fontWeight: 'bold' }}>
                {(audioStats.duration / audioStats.generationTime).toFixed(2)}x realtime
              </span>
            </div>
            <div>
              <span style={{ color: '#888' }}>Sample Rate:</span>{' '}
              <span style={{ color: '#ff6900', fontWeight: 'bold' }}>
                {(audioStats.sampleRate / 1000).toFixed(1)}kHz
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleGenerate}
          disabled={!text.trim() || isGenerating || loader.state !== 'ready'}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: loader.state === 'ready' && !isGenerating ? '#ff6900' : '#444',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#fff',
            cursor: loader.state === 'ready' && !isGenerating ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: 'bold',
            opacity: loader.state === 'ready' && !isGenerating ? 1 : 0.5,
          }}
        >
          {isGenerating ? '🎵 Generating Audio...' : '🎵 Convert to Audio'}
        </button>
        <button
          onClick={handleStop}
          disabled={!audioSourceRef.current}
          style={{
            padding: '0.75rem 1.5rem',
            background: audioSourceRef.current ? '#ff4444' : '#444',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#fff',
            cursor: audioSourceRef.current ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            fontWeight: 'bold',
            opacity: audioSourceRef.current ? 1 : 0.5,
          }}
        >
          ⏹️ Stop
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
          <li>Try the sample buttons to test different subjects</li>
          <li>Paste your study notes or lecture summaries</li>
          <li>Listen while commuting or exercising</li>
          <li>All processing happens on-device - your notes stay private!</li>
        </ul>
      </div>
    </div>
  );
}
