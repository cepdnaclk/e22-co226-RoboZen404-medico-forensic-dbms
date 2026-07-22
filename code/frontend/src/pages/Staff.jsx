import React, { useEffect, useState } from 'react';
import { Users, Shield, Building, Plus, X, Eye } from 'lucide-react';
import api from '../api';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [toast, setToast] = useState('');
  
  const [form, setForm] = useState({
    firstName: '', lastName: '', designation: '', 
    username: '', password: '', roleId: '2', deptId: '1'
  });

  const load = async () => {
    try {
      const data = await api.getStaff();
      const sortedData = data.sort((a, b) => b.StaffID - a.StaffID);
      setStaff(sortedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createStaff({
        ...form,
        roleId: parseInt(form.roleId),
        deptId: parseInt(form.deptId)
      });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', designation: '', username: '', password: '', roleId: '2', deptId: '1' });
      setToast('Staff member added successfully!');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.message || 'Failed to add staff member');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'Admin';

  if (loading) return <div className="loading"><div className="spinner"></div>Loading staff...</div>;
  if (error) return <div className="login-error">{error}</div>;

  const totalStaff = staff.length;
  const jmoCount = staff.filter(s => s.RoleName === 'JMO').length;
  const clerkCount = staff.filter(s => s.RoleName === 'Clerk').length;
  const adminCount = staff.filter(s => s.RoleName === 'Admin').length;
  const doctorCount = staff.filter(s => s.RoleName === 'Doctor').length;
  const labCount = staff.filter(s => s.RoleName === 'Lab Staff').length;

  return (
    <div className="animate-in" style={{ padding: '0 1rem' }}>
      <div className="section-header">
        <div>
          <h1>Staff Management</h1>
          <p>Overview of all registered medical and administrative personnel</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Staff Member
          </button>
        )}
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', overflowX: 'auto' }}>
        <div className="card stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value">{totalStaff}</div>
          <div className="stat-label">TOTAL STAFF</div>
        </div>
        <div className="card stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value">{jmoCount}</div>
          <div className="stat-label">JMO OFFICERS</div>
        </div>
        <div className="card stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value">{doctorCount}</div>
          <div className="stat-label">DOCTORS</div>
        </div>
        <div className="card stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value">{labCount}</div>
          <div className="stat-label">LAB STAFF</div>
        </div>
        <div className="card stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value">{clerkCount}</div>
          <div className="stat-label">CLERKS</div>
        </div>
        <div className="card stat-card" style={{ padding: '1rem' }}>
          <div className="stat-value">{adminCount}</div>
          <div className="stat-label">ADMINS</div>
        </div>
      </div>

      <div className="card table-card">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Staff Directory</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Role</th>
              <th>Username</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No staff records found.</td></tr>
            ) : staff.map(s => (
              <tr key={s.StaffID}>
                <td style={{ fontWeight: 600 }}>{s.StaffID}</td>
                <td>{s.FirstName} {s.LastName}</td>
                <td>{s.Designation || '—'}</td>
                <td>{s.DeptName}</td>
                <td><span className={`badge ${s.RoleName?.toLowerCase()}`}>{s.RoleName}</span></td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.Username}</td>
                <td><button className="btn btn-soft btn-sm" onClick={() => setSelectedStaff(s)}><Eye size={14} /> View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStaff && (
        <div className="modal-overlay" onClick={() => setSelectedStaff(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Details</h2>
              <button onClick={() => setSelectedStaff(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="card detail-section" style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Personal Information</h3>
                  <div className="detail-row"><span className="label">Staff ID</span><span className="value" style={{ fontWeight: 600 }}>{selectedStaff.StaffID}</span></div>
                  <div className="detail-row"><span className="label">Full Name</span><span className="value">{selectedStaff.FirstName} {selectedStaff.LastName}</span></div>
                  <div className="detail-row"><span className="label">Designation</span><span className="value">{selectedStaff.Designation || '—'}</span></div>
                  <div className="detail-row"><span className="label">Department</span><span className="value">{selectedStaff.DeptName}</span></div>
                </div>
                <div className="card detail-section" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Account Information</h3>
                  <div className="detail-row"><span className="label">System Role</span><span className="value"><span className={`badge ${selectedStaff.RoleName?.toLowerCase()}`}>{selectedStaff.RoleName}</span></span></div>
                  <div className="detail-row"><span className="label">Username</span><span className="value" style={{ fontFamily: 'monospace' }}>{selectedStaff.Username}</span></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedStaff(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showForm && isAdmin && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>Add Staff Member</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Personal Details</h3>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" placeholder="e.g. Nimal" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" placeholder="e.g. Bandara" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
                </div>
                <div className="form-group"><label className="form-label">Designation</label><input className="form-input" placeholder="e.g. Consultant JMO" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} /></div>
              </div>

              <div className="form-section">
                <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Account & Roles</h3>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Username *</label><input className="form-input" placeholder="e.g. dr_nimal" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Password *</label><input type="password" placeholder="Enter secure password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">System Role *</label>
                    <select className="form-select" value={form.roleId} onChange={e => setForm({...form, roleId: e.target.value})}>
                      <option value="1">System Administrator</option>
                      <option value="2">Judicial Medical Officer</option>
                      <option value="3">Clerical Officer</option>
                      <option value="4">Doctor</option>
                      <option value="5">Laboratory Staff</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select className="form-select" value={form.deptId} onChange={e => setForm({...form, deptId: e.target.value})} required>
                      <option value="1">Forensic Medicine</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Staff Member</button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
