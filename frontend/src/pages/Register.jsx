import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    employeeId: '',
    warehouseLocation: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('Registering user:', formData.email);
      
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          employeeId: formData.employeeId,
          branch: formData.warehouseLocation,
        })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        setMessage('✅ Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Cannot connect to backend. Make sure it\'s running on port 5000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <input name="fullName" placeholder="Full Name" onChange={handleChange} required style={styles.input} />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={styles.input} />
          <input name="password" type="password" placeholder="Password (min 6 chars)" onChange={handleChange} required style={styles.input} />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required style={styles.input} />
          <input name="employeeId" placeholder="Employee ID" onChange={handleChange} required style={styles.input} />
          
          <select name="role" onChange={handleChange} style={styles.input}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          
          <select name="warehouseLocation" onChange={handleChange} required style={styles.input}>
            <option value="">Select Warehouse</option>
            <option value="Main Warehouse">Main Warehouse</option>
            <option value="East Branch">East Branch</option>
            <option value="West Branch">West Branch</option>
          </select>
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p style={styles.footer}>Already have an account? <Link to="/login">Login</Link></p>
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
    width: '100%',
    maxWidth: '450px',
  },
  title: { textAlign: 'center', marginBottom: '20px', color: '#333' },
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
  },
  error: { background: '#fee', color: '#c00', padding: '10px', borderRadius: '5px', marginBottom: '15px' },
  success: { background: '#efe', color: '#0a0', padding: '10px', borderRadius: '5px', marginBottom: '15px' },
  footer: { textAlign: 'center', marginTop: '20px' },
};

export default Register;