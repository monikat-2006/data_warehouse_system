import { useState, useEffect } from 'react';
import { User, Mail, IdCard, Building2, Calendar, Edit2, Save, X, Key } from 'lucide-react';

function Profile({ user, onUserUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    branch: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        name: user.name || '',
        branch: user.branch || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          branch: formData.branch
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update localStorage with new data
        const updatedUser = {
          ...currentUser,
          name: data.name,
          branch: data.branch
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update local state
        setCurrentUser(updatedUser);
        
        // Update parent component if callback provided
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }
        
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Update failed');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Update error:', error);
      setError('Failed to update profile. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setMessage('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password changed successfully!');
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Password change failed');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError('Failed to change password');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Profile Information</h2>
        <div className="profile-actions">
          {!isEditing && !isChangingPassword && (
            <>
              <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit Profile
              </button>
              <button className="btn-change-password" onClick={() => setIsChangingPassword(true)}>
                <Key size={16} /> Change Password
              </button>
            </>
          )}
          {(isEditing || isChangingPassword) && (
            <button className="btn-cancel" onClick={() => {
              setIsEditing(false);
              setIsChangingPassword(false);
              setError('');
              setMessage('');
              // Reset form data to original values
              setFormData({
                name: currentUser.name || '',
                branch: currentUser.branch || ''
              });
            }}>
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className="success-message" style={{background: '#d4edda', color: '#155724', padding: '10px', borderRadius: '5px', marginBottom: '15px'}}>
          {message}
        </div>
      )}
      {error && (
        <div className="error-message" style={{background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '15px'}}>
          {error}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-avatar">
          <div className="avatar-large">
            {currentUser.name?.charAt(0) || 'U'}
          </div>
          <div className="avatar-info">
            <p>{currentUser.role === 'admin' ? 'Administrator' : 'Staff Member'}</p>
          </div>
        </div>

        <div className="profile-info">
          {!isEditing ? (
            // View Mode - Show all fields
            <>
              <div className="info-row">
                <div className="info-label">
                  <User size={18} />
                  <span>Full Name</span>
                </div>
                <p>{currentUser.name || 'Not set'}</p>
                <span className="edit-hint">(Editable)</span>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <Mail size={18} />
                  <span>Email</span>
                </div>
                <p>{currentUser.email || 'Not set'}</p>
                <span className="readonly-hint">(Cannot be changed)</span>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <IdCard size={18} />
                  <span>Employee ID</span>
                </div>
                <p>{currentUser.employee_id || 'Not set'}</p>
                <span className="readonly-hint">(Cannot be changed)</span>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <Building2 size={18} />
                  <span>Branch</span>
                </div>
                <p>{currentUser.branch || 'Not set'}</p>
                <span className="edit-hint">(Editable)</span>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <Calendar size={18} />
                  <span>Role</span>
                </div>
                <p className="role-badge">{currentUser.role || 'Staff'}</p>
                <span className="readonly-hint">(Cannot be changed)</span>
              </div>
            </>
          ) : (
            // Edit Mode - Only Name and Branch can be edited
            <>
              <div className="info-row">
                <div className="info-label">
                  <User size={18} />
                  <span>Full Name</span>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="edit-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="info-row readonly-row">
                <div className="info-label">
                  <Mail size={18} />
                  <span>Email</span>
                </div>
                <p className="readonly-field">{currentUser.email}</p>
              </div>

              <div className="info-row readonly-row">
                <div className="info-label">
                  <IdCard size={18} />
                  <span>Employee ID</span>
                </div>
                <p className="readonly-field">{currentUser.employee_id}</p>
              </div>

              <div className="info-row">
                <div className="info-label">
                  <Building2 size={18} />
                  <span>Branch</span>
                </div>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  className="edit-select"
                >
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="East Branch">East Branch</option>
                  <option value="West Branch">West Branch</option>
                  <option value="North Branch">North Branch</option>
                  <option value="South Branch">South Branch</option>
                </select>
              </div>

              <div className="info-row readonly-row">
                <div className="info-label">
                  <Calendar size={18} />
                  <span>Role</span>
                </div>
                <p className="readonly-field">{currentUser.role}</p>
              </div>

              <div className="form-actions">
                <button 
                  className="btn-save" 
                  onClick={handleUpdateProfile} 
                  disabled={loading}
                >
                  <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="info-note">
                <p>💡 Note: Only Name and Branch can be edited. Contact admin to change Email, Employee ID, or Role.</p>
              </div>
            </>
          )}

          {isChangingPassword && (
            <div className="change-password-section">
              <h3>Change Password</h3>
              <div className="info-row">
                <div className="info-label">
                  <Key size={18} />
                  <span>Current Password</span>
                </div>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="edit-input"
                  placeholder="Enter current password"
                />
              </div>

              <div className="info-row">
                <div className="info-label">
                  <Key size={18} />
                  <span>New Password</span>
                </div>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="edit-input"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="info-row">
                <div className="info-label">
                  <Key size={18} />
                  <span>Confirm New Password</span>
                </div>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="edit-input"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="form-actions">
                <button 
                  className="btn-save" 
                  onClick={handleChangePassword} 
                  disabled={loading}
                >
                  <Save size={16} /> {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;