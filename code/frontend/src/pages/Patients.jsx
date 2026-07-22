import React, { useEffect, useState } from 'react';
import { Plus, X, Eye, UserPlus } from 'lucide-react';
import api from '../api';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toast, setToast] = useState('');
  
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', gender: 'Male', nic: '', address: '', emergencyContact: '' });

  const load = async () => {
    try {
      const data = await api.getPatients();
      setPatients(data.sort((a, b) => (b.PersonID || b.PatientID || 0) - (a.PersonID || a.PatientID || 0)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createPatient(form);
      setShowForm(false);
      setForm({ firstName: '', lastName: '', dob: '', gender: 'Male', nic: '', address: '', emergencyContact: '' });
      setToast('Patient registered successfully');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await api.deletePatient(patientToDelete);
      setToast('Patient deleted');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
    finally { setPatientToDelete(null); }
  };

  const openViewModal = async (id) => {
    try {
      const data = await api.getPatient(id);
      setSelectedPatient(data);
    } catch (err) {
      setToast(err.message || 'Failed to load patient details');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = user.role === 'Admin' || user.role === 'Clerk' || user.role === 'Doctor' || user.role === 'JMO';
  const canCreate = user.role === 'Admin' || user.role === 'Clerk';

  if (loading) return <div className="loading"><div className="spinner"></div>Loading patients...</div>;

  return (
    <div className="animate-in">
      <div className="section-header">
        <div>
          <h1>Patients</h1>
          <p>Manage patient records and demographics</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><UserPlus size={16} /> Register Patient</button>
        )}
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>NIC</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Emergency Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No patients registered yet.</td></tr>
            ) : patients.map(p => (
              <tr key={p.PersonID}>
                <td>{p.NIC || 'N/A'}</td>
                <td>{p.FirstName} {p.LastName}</td>
                <td>{p.Gender}</td>
                <td>{p.DOB ? new Date(p.DOB).toLocaleDateString() : 'N/A'}</td>
                <td>{p.EmergencyContact || 'N/A'}</td>
                <td style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-soft btn-sm" onClick={() => openViewModal(p.PersonID)}>
                    <Eye size={14} /> View
                  </button>
                  {user.role === 'Admin' && (
                    <button className="btn btn-danger btn-sm" onClick={() => setPatientToDelete(p.PersonID)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>Register New Patient</h2>
              <button type="button" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" placeholder="e.g. John" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" placeholder="e.g. Doe" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">NIC</label><input className="form-input" placeholder="e.g. 199012345678" value={form.nic} onChange={e => setForm({...form, nic: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
                </div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-input" placeholder="e.g. 123 Main St, Colombo 03" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Emergency Contact No.</label><input className="form-input" placeholder="e.g. 0771234567" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Register Patient</button>
            </div>
          </form>
        </div>
      )}

      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Patient Profile</h2>
              <button onClick={() => setSelectedPatient(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card detail-section">
                  <h3>Patient Information</h3>
                  <div className="detail-row"><span className="label">Full Name</span><span className="value">{selectedPatient.FirstName} {selectedPatient.LastName}</span></div>
                  <div className="detail-row"><span className="label">NIC</span><span className="value">{selectedPatient.NIC || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Gender</span><span className="value">{selectedPatient.Gender}</span></div>
                  <div className="detail-row"><span className="label">Date of Birth</span><span className="value">{selectedPatient.DOB ? new Date(selectedPatient.DOB).toLocaleDateString() : 'N/A'}</span></div>
                </div>
                <div className="card detail-section">
                  <h3>Contact Details</h3>
                  <div className="detail-row"><span className="label">Address</span><span className="value">{selectedPatient.Address || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Emergency Contact</span><span className="value">{selectedPatient.EmergencyContact || 'N/A'}</span></div>
                </div>
              </div>

              <div className="card detail-section">
                <h3>Clinical Case History</h3>
                {selectedPatient.cases && selectedPatient.cases.length > 0 ? (
                  <div style={{ marginTop: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ margin: 0 }}>
                      <thead>
                        <tr style={{ background: 'var(--grouped-bg)' }}>
                          <th style={{ padding: '0.5rem 1rem' }}>MLEF No.</th>
                          <th style={{ padding: '0.5rem 1rem' }}>Date</th>
                          <th style={{ padding: '0.5rem 1rem' }}>JMO In-Charge</th>
                          <th style={{ padding: '0.5rem 1rem' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPatient.cases.map(c => (
                          <tr key={c.CaseID}>
                            <td style={{ padding: '0.5rem 1rem', fontWeight: 500 }}>{c.MLEF_No}</td>
                            <td style={{ padding: '0.5rem 1rem' }}>{new Date(c.CaseDate).toLocaleDateString()}</td>
                            <td style={{ padding: '0.5rem 1rem' }}>Dr. {c.JMOName}</td>
                            <td style={{ padding: '0.5rem 1rem' }}><span className={`badge ${c.Status === 'Closed' ? 'closed' : 'open'}`}>{c.Status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.75rem', padding: '1.5rem', textAlign: 'center', background: 'var(--grouped-bg)', borderRadius: 'var(--radius-md)', color: 'var(--tertiary-label)' }}>
                    No case history found for this patient.
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedPatient(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {patientToDelete && (
        <div className="modal-overlay" onClick={() => setPatientToDelete(null)}>
          <div className="modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>Delete Patient</h3>
            <p style={{ color: 'var(--secondary-label)', marginBottom: '1.5rem' }}>Are you sure you want to delete this patient? This action cannot be undone and will cascade to all associated cases.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setPatientToDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
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
