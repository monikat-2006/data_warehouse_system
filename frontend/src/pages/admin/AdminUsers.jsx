import { useState, useEffect } from 'react';
import { Users, Edit, Trash2, UserPlus, Search, Shield, UserCheck } from 'lucide-react';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    branch: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  };

  const handleUpdateUser = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchUsers();
        setShowModal(false);
        alert('User updated successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          fetchUsers();
          alert('User deleted successfully!');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch
    });
    setShowModal(true);
  };

  return (
    <div className="admin-users">
      <div className="admin-users-header">
        <h2>User Management</h2>
        <div className="admin-stats-badge">
          <Users size={16} />
          <span>Total Users: {users.length}</span>
        </div>
      </div>

      <div className="admin-search-box">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search by name, email, or employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="admin-users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Employee ID</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.employee_id}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' ? <Shield size={12} /> : <UserCheck size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td>{user.branch}</td>
                  <td className="admin-actions">
                    <button className="admin-edit-btn" onClick={() => openEditModal(user)}>
                      <Edit size={16} /> Edit
                    </button>
                    <button className="admin-delete-btn" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit User</h3>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Branch</label>
              <select value={formData.branch} onChange={(e) => setFormData({...formData, branch: e.target.value})}>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="East Branch">East Branch</option>
                <option value="West Branch">West Branch</option>
                <option value="North Branch">North Branch</option>
                <option value="South Branch">South Branch</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="admin-save-btn" onClick={handleUpdateUser}>Save Changes</button>
              <button className="admin-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;