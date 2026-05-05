import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'staff',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Sending login request...');
      
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.role === 'admin') {
          window.location.href = '/admin-dashboard';
        } else {
          window.location.href = '/staff-dashboard';
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Error connecting to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login to Dark Warehouse</h1>
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            style={styles.input}
          />
          
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
          />
          
          <select name="role" value={formData.role} onChange={handleChange} style={styles.input}>
            <option value="staff">Staff Member</option>
            <option value="admin">Administrator</option>
          </select>
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p style={styles.footer}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
        
        <div style={styles.demo}>
          <p><strong>Demo Credentials:</strong></p>
          <p>Admin: admin@warehouse.com / admin123</p>
          <p>Staff: (use registered email)</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
    fontSize: '24px',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
  },
  demo: {
    marginTop: '20px',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '5px',
    fontSize: '12px',
    textAlign: 'center',
  },
};

export default Login;