import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

function App() {
  const [code, setCode] = useState("print('Welcome to CodeArena! 🚀')");
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear errors when code changes
  useEffect(() => {
    setError('');
  }, [code]);

  const runCode = async () => {
    setIsLoading(true);
    setOutput('');
    let timeoutId = null;

    try {
      // Step 1: Submit code to backend
      const executeResponse = await fetch('http://localhost:5000/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!executeResponse.ok) {
        throw new Error(`Backend error: ${executeResponse.statusText}`);
      }

      const { token } = await executeResponse.json();

      // Step 2: Set timeout (10 seconds max)
      timeoutId = setTimeout(() => {
        setError('⌛ Timeout: Execution took too long');
        setIsLoading(false);
      }, 10000);

      // Step 3: Poll for results
      const intervalId = setInterval(async () => {
        try {
          const resultResponse = await fetch(
            `http://localhost:5000/results/${token}?base64_encoded=false`
          );

          if (!resultResponse.ok) {
            throw new Error(`Result fetch failed: ${resultResponse.statusText}`);
          }

          const resultData = await resultResponse.json();

          // Handle Judge0 errors
          if (resultData.stderr) {
            throw new Error(resultData.stderr);
          }

          // Exit conditions
          if (resultData.status.description !== 'Processing') {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            setOutput(resultData.stdout || '✅ Code executed successfully');
            setIsLoading(false);
          }
        } catch (err) {
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          setError(`❌ Error: ${err.message}`);
          setIsLoading(false);
        }
      }, 1000);

    } catch (err) {
      clearTimeout(timeoutId);
      setError(`🔥 Critical Error: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>CodeArena</h1>
      
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
  }
};

export default App;