import { useState } from 'react';
import { User, Mail, Shield, Key, Save, CheckCircle } from 'lucide-react';
// import { userAPI } from '../../services/api'; // If there's an API for this

export default function Profile({ user }) {
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setSaving(true);
    setError('');
    
    // Placeholder for profile update API call
    setTimeout(() => {
      setSaving(false);
      setSuccess('Profile updated successfully');
      setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* Left Side: Profile Summary */}
        <div className="card">
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', 
              background: 'var(--grad-primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: 'white',
              margin: '0 auto 16px',
              boxShadow: 'var(--shadow-glow)'
            }}>
              {(user?.username || 'S')[0].toUpperCase()}
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>{user?.username}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
              <Mail size={14} /> {user?.email || 'staff@warehouse.com'}
            </div>
            <div style={{ marginTop: 16 }}>
              <span className="badge badge-info" style={{ padding: '6px 12px' }}>
                <Shield size={14} /> {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Edit Profile Details</span>
          </div>
          
          {success && <div className="alert alert-success"><CheckCircle size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input 
                  type="text" 
                  name="username"
                  value={form.username} 
                  onChange={handleChange}
                  style={{ paddingLeft: 42 }}
                  disabled
                />
              </div>
              <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Username cannot be changed</small>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input 
                  type="email" 
                  name="email"
                  value={form.email} 
                  onChange={handleChange}
                  style={{ paddingLeft: 42 }}
                  disabled
                />
              </div>
              <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Contact an admin to change your email</small>
            </div>

            <h3 style={{ fontSize: 16, marginTop: 32, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Change Password</h3>

            <div className="form-group">
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                <input 
                  type="password" 
                  name="currentPassword"
                  value={form.currentPassword} 
                  onChange={handleChange}
                  placeholder="Enter current password"
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    name="newPassword"
                    value={form.newPassword} 
                    onChange={handleChange}
                    placeholder="New password"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={form.confirmPassword} 
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}