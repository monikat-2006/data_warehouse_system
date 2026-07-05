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
      setError('❌ Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('❌ Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('Registering user:', formData.email);
      
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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
      setError('❌ Cannot connect to backend. Make sure it\'s running on port 5000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container" style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📝 Create Account</h1>
        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <input 
            name="fullName" 
            placeholder="👤 Full Name" 
            value={formData.fullName}
            onChange={handleChange} 
            required 
            style={styles.input} 
          />
          
          <input 
            name="email" 
            type="email" 
            placeholder="📧 Email" 
            value={formData.email}
            onChange={handleChange} 
            required 
            style={styles.input} 
          />
          
          <input 
            name="password" 
            type="password" 
            placeholder="🔑 Password (min 6 chars)" 
            value={formData.password}
            onChange={handleChange} 
            required 
            style={styles.input} 
          />
          
          <input 
            name="confirmPassword" 
            type="password" 
            placeholder="✅ Confirm Password" 
            value={formData.confirmPassword}
            onChange={handleChange} 
            required 
            style={styles.input} 
          />
          
          <input 
            name="employeeId" 
            placeholder="🆔 Employee ID" 
            value={formData.employeeId}
            onChange={handleChange} 
            required 
            style={styles.input} 
          />
          
          <select 
            name="role" 
            value={formData.role} 
            onChange={handleChange} 
            style={styles.input}
          >
            <option value="staff">👤 Staff</option>
            <option value="admin">👑 Admin</option>
          </select>
          
          <select 
            name="warehouseLocation" 
            value={formData.warehouseLocation}
            onChange={handleChange} 
            required 
            style={styles.input}
          >
            <option value="">🏭 Select Warehouse</option>
            <option value="Main Warehouse">🏗️ Main Warehouse</option>
            <option value="East Branch">🌅 East Branch</option>
            <option value="West Branch">🌇 West Branch</option>
            <option value="North Branch">🌄 North Branch</option>
            <option value="South Branch">🌊 South Branch</option>
          </select>
          
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Registering...' : '🚀 Register'}
          </button>
        </form>
        
        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '450px',
    animation: 'fadeInUp 0.5s ease',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: {
    textAlign: 'center',
    marginBottom: '25px',
    color: '#333',
    fontSize: '26px',
    fontWeight: '700',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    marginBottom: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    outline: 'none',
    background: '#f8f9fa',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  error: {
    background: '#fee',
    color: '#c0392b',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #fcc',
    fontSize: '14px',
  },
  success: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #c8e6c9',
    fontSize: '14px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#666',
    fontSize: '14px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

// Add animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  input:focus, select:focus {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    background: white !important;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
  
  select {
    appearance: auto;
    cursor: pointer;
  }
  
  ::-webkit-scrollbar {
    width: 6px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #667eea;
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #764ba2;
  }
`;
document.head.appendChild(styleSheet);

export default Register;