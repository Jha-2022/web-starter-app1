import { useState } from 'react';
import { ModelCategory } from '@runanywhere/web';
import { TextGeneration } from '@runanywhere/web-llamacpp';
import { useModelLoader } from '../hooks/useModelLoader';

interface QuizQuestion {
  question: string;
  answer: string;
  explanation?: string;
}

export function QuizTab() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  const loader = useModelLoader(ModelCategory.Language);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic to generate questions about');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setQuestions([]);
    setShowAnswers({});

    try {
      const prompt = `Generate exactly ${numQuestions} ${difficulty} level quiz questions about "${topic}". 

For each question, provide:
1. The question
2. A clear, concise answer
3. A brief explanation (1-2 sentences)

Format each question like this:
Q: [question here]
A: [answer here]
E: [explanation here]

Keep questions educational and test understanding of key concepts.`;

      let fullResponse = '';
      
      const { stream } = await TextGeneration.generateStream(prompt, {
        maxTokens: 1024,
        temperature: 0.8,
        systemPrompt: 'You are a helpful educational tutor who creates effective quiz questions to test student understanding. Focus on clarity and educational value.',
      });

      for await (const token of stream) {
        fullResponse += token;
      }

      // Parse the response into questions
      const parsedQuestions = parseQuizResponse(fullResponse);
      
      if (parsedQuestions.length === 0) {
        setError('Failed to parse quiz questions. Please try again.');
      } else {
        setQuestions(parsedQuestions);
      }

    } catch (err) {
      console.error('Quiz generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const parseQuizResponse = (response: string): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    
    // Split by "Q:" to get individual questions
    const parts = response.split(/Q\d*:/).filter(p => p.trim());
    
    for (const part of parts) {
      // Extract question, answer, and explanation
      const lines = part.split('\n').map(l => l.trim()).filter(l => l);
      
      let question = '';
      let answer = '';
      let explanation = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('A:')) {
          answer = line.substring(2).trim();
          // Get rest of answer if it spans multiple lines
          let j = i + 1;
          while (j < lines.length && !lines[j].startsWith('E:') && !lines[j].startsWith('Q:')) {
            if (!lines[j].startsWith('A:')) {
              answer += ' ' + lines[j].trim();
            }
            j++;
          }
        } else if (line.startsWith('E:')) {
          explanation = line.substring(2).trim();
          // Get rest of explanation if it spans multiple lines
          let j = i + 1;
          while (j < lines.length && !lines[j].startsWith('Q:') && !lines[j].startsWith('A:')) {
            if (!lines[j].startsWith('E:')) {
              explanation += ' ' + lines[j].trim();
            }
            j++;
          }
        } else if (!question && !line.startsWith('A:') && !line.startsWith('E:')) {
          // This is part of the question
          if (question) {
            question += ' ' + line;
          } else {
            question = line;
          }
        }
      }
      
      if (question && answer) {
        questions.push({ question, answer, explanation });
      }
    }
    
    return questions;
  };

  const toggleAnswer = (index: number) => {
    setShowAnswers(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const loadSampleTopic = (sample: string) => {
    setTopic(sample);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>📝 Quiz Generator</h2>
        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
          Generate practice questions on any topic to test your knowledge
        </p>
      </div>

      {/* Sample Topics */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => loadSampleTopic('Photosynthesis')}
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
          🌱 Photosynthesis
        </button>
        <button
          onClick={() => loadSampleTopic('World War II')}
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
          🌍 World War II
        </button>
        <button
          onClick={() => loadSampleTopic('Chemical Bonds')}
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
          ⚗️ Chemical Bonds
        </button>
        <button
          onClick={() => loadSampleTopic('The Solar System')}
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
          🪐 Solar System
        </button>
      </div>

      {/* Quiz Configuration */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        gap: '0.75rem',
        alignItems: 'end',
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Photosynthesis, World War II..."
            disabled={isGenerating || loader.state !== 'ready'}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              fontFamily: 'inherit',
              background: '#222',
              border: '1px solid #444',
              borderRadius: '0.25rem',
              color: '#fff',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            disabled={isGenerating || loader.state !== 'ready'}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              fontFamily: 'inherit',
              background: '#222',
              border: '1px solid #444',
              borderRadius: '0.25rem',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
            Questions
          </label>
          <select
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            disabled={isGenerating || loader.state !== 'ready'}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              fontFamily: 'inherit',
              background: '#222',
              border: '1px solid #444',
              borderRadius: '0.25rem',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="7">7</option>
            <option value="10">10</option>
          </select>
        </div>
      </div>

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
              <div style={{ marginBottom: '0.5rem' }}>Language model not loaded</div>
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
                Load LLM Model
              </button>
            </div>
          )}
          {loader.state === 'downloading' && (
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                Downloading model... {Math.round(loader.progress * 100)}%
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
            <div>Loading model into memory...</div>
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

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!topic.trim() || isGenerating || loader.state !== 'ready'}
        style={{
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
        {isGenerating ? '⏳ Generating Questions...' : '✨ Generate Quiz'}
      </button>

      {/* Questions Display */}
      {questions.length > 0 && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#1a1a1a',
          borderRadius: '0.5rem',
          border: '1px solid #444',
          padding: '1rem',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #444',
          }}>
            <div style={{ fontWeight: 'bold' }}>
              {questions.length} Question{questions.length !== 1 ? 's' : ''} Generated
            </div>
            <div style={{ fontSize: '0.85rem', color: '#888' }}>
              Topic: {topic} • Difficulty: {difficulty}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((q, i) => (
              <div
                key={i}
                style={{
                  padding: '1rem',
                  background: '#2a2a2a',
                  borderRadius: '0.5rem',
                  border: '1px solid #444',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'start',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#ff6900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, paddingTop: '0.25rem' }}>
                    <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                      {q.question}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleAnswer(i)}
                  style={{
                    marginLeft: '43px',
                    padding: '0.4rem 0.75rem',
                    background: showAnswers[i] ? '#444' : '#ff6900',
                    border: 'none',
                    borderRadius: '0.25rem',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  {showAnswers[i] ? '🙈 Hide Answer' : '👁️ Show Answer'}
                </button>

                {showAnswers[i] && (
                  <div style={{
                    marginTop: '0.75rem',
                    marginLeft: '43px',
                    padding: '0.75rem',
                    background: '#1a1a1a',
                    borderRadius: '0.25rem',
                    borderLeft: '3px solid #4ade80',
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#4ade80', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      ✓ Answer:
                    </div>
                    <div style={{ marginBottom: '0.75rem', lineHeight: '1.5' }}>
                      {q.answer}
                    </div>
                    {q.explanation && (
                      <>
                        <div style={{ fontWeight: 'bold', color: '#888', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                          💡 Explanation:
                        </div>
                        <div style={{ color: '#aaa', lineHeight: '1.5', fontSize: '0.9rem' }}>
                          {q.explanation}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Tips */}
      {questions.length === 0 && (
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
            <li>Try the sample topics or enter your own</li>
            <li>Adjust difficulty based on your study level</li>
            <li>Use generated questions to test yourself before exams</li>
            <li>All processing happens on-device - your study topics stay private!</li>
          </ul>
        </div>
      )}
    </div>
  );
}
