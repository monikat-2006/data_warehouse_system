function Test() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'Arial'
    }}>
      <h1>✅ React is Working!</h1>
      <p>If you see this, the frontend is running correctly.</p>
      <button onClick={() => window.location.href = '/register'}>
        Go to Register
      </button>
    </div>
  );
}

export default Test;