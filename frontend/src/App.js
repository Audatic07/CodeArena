import { useEffect } from 'react';

function App() {
  useEffect(() => {
    fetch('http://localhost:5000')
      .then(response => response.text())
      .then(data => console.log(data));
  }, []);

  return (
    <div>
      <h1>CodeArena Fronten</h1>
    </div>
  );
}

export default App;