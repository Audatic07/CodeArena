import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

function App() {
  const [code, setCode] = useState("print('Hello CodeArena!')");
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [xp, setXp] = useState(0);

  // XP persistence
  useEffect(() => {
    const savedXp = localStorage.getItem('codearena-xp');
    if (savedXp) setXp(Number(savedXp));
  }, []);

  useEffect(() => {
    localStorage.setItem('codearena-xp', xp);
  }, [xp]);

  const decodeBase64 = (str) => {
    try {
      return atob(str);
    } catch (e) {
      return str; // Return original if not base64
    }
  };

  const runCode = async () => {
    setIsLoading(true);
    setOutput('');
    setError('');
    let timeoutId = null;

    try {
      // Execute code
      const executeResponse = await fetch('http://localhost:5000/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      if (!executeResponse.ok) throw new Error('Backend error');
      const { token } = await executeResponse.json();

      // Timeout after 15 seconds
      timeoutId = setTimeout(() => {
        setError('⌛ Timeout: Execution took too long');
        setIsLoading(false);
      }, 15000);

      // Poll results
      const intervalId = setInterval(async () => {
        try {
          const resultResponse = await fetch(
            `http://localhost:5000/results/${token}?base64_encoded=true`
          );
          
          if (!resultResponse.ok) throw new Error('Result fetch failed');
          const resultData = await resultResponse.json();

          // Handle final state
          if (resultData.status?.description !== 'Processing') {
            clearInterval(intervalId);
            clearTimeout(timeoutId);

            // Decode base64 responses
            const decodedOutput = resultData.stdout 
              ? decodeBase64(resultData.stdout)
              : resultData.stderr
              ? decodeBase64(resultData.stderr)
              : 'No output';

            // Update state
            if (resultData.status?.id === 3) { // Success status
              setXp(prev => prev + 10);
              setOutput(decodedOutput);
            } else {
              setError(decodedOutput);
            }
            
            setIsLoading(false);
          }
        } catch (err) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          setError(err.message);
          setIsLoading(false);
        }
      }, 1000);

    } catch (err) {
      clearTimeout(timeoutId);
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>CodeArena</h1>
      <div style={styles.xpBadge}>XP: {xp}</div>

      <CodeMirror
        value={code}
        height="400px"
        extensions={[python()]}
        onChange={(value) => setCode(value)}
        style={styles.editor}
      />

      <button 
        onClick={runCode} 
        disabled={isLoading}
        style={styles.button}
      >
        {isLoading ? '🏃 Running...' : '⚡ Run Code'}
      </button>

      {error && (
        <div style={styles.errorBox}>
          <pre style={styles.errorText}>{error}</pre>
        </div>
      )}

      {output && (
        <div style={styles.outputBox}>
          <pre style={styles.outputText}>{output}</pre>
        </div>
      )}
    </div>
  );
}

// Styling (add to bottom of file)
const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '30px'
  },
  editor: {
    border: '2px solid #3498db',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  button: {
    background: '#3498db',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    width: '100%',
    marginBottom: '20px',
    ':disabled': {
      background: '#95a5a6',
      cursor: 'not-allowed'
    }
  },
  outputBox: {
    background: '#2c3e50',
    padding: '20px',
    borderRadius: '8px',
    color: '#ecf0f1',
    whiteSpace: 'pre-wrap'
  },
  errorBox: {
    background: '#e74c3c',
    padding: '20px',
    borderRadius: '8px',
    color: 'white',
    marginBottom: '20px'
  },
  outputText: {
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  errorText: {
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '14px'
  },
  xpBadge: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    position: 'absolute',
    top: '20px',
    right: '20px',
    fontWeight: 'bold',
    display: 'inline-block'  // Add this to ensure proper rendering
  }
};

export default App;