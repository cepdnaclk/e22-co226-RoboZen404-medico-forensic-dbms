import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../api';

export default function LabManagement() {
  const [specimens, setSpecimens] = useState([]);
  const [cases, setCases] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  
  const [form, setForm] = useState({
    caseId: '', specimenType: '', collectedDate: new Date().toISOString().split('T')[0],
    storageLocation: '', targetLabId: '', analysisRequired: ''
  });

  const load = async () => {
    try {
      const [data, clinicalCases, autopsyCases, auths] = await Promise.all([
        api.getSpecimens(),
        api.getClinicalCases(),
        api.getAutopsyCases(),
        api.getAuthorities()
      ]);
      setSpecimens(data.sort((a,b) => b.SpecimenID - a.SpecimenID));
      setCases([...clinicalCases.map(c => ({ id: c.ClinicalCaseID, label: `Clinical: ${c.MLEF_No}` })), 
                ...autopsyCases.map(c => ({ id: c.AutopsyCaseID, label: `Autopsy: ${c.PM_No}` }))]);
      // Note: getAuthorities() might return 404, we'll use a fallback if needed
      setAuthorities(auths ? auths.filter(a => a.Type === 'Government Analyst' || a.Type === 'Hospital Lab') : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createSpecimen(form);
      setShowForm(false);
      setToast('Specimen recorded successfully');
      setForm({ caseId: '', specimenType: '', collectedDate: new Date().toISOString().split('T')[0], storageLocation: '', targetLabId: '', analysisRequired: '' });
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = user.role === 'Admin' || user.role === 'JMO' || user.role === 'Lab Staff';

  if (loading) return <div className="loading"><div className="spinner"></div>Loading lab data...</div>;

  return (
    <div className="animate-in">
      <div className="section-header">
        <div><h1>Lab Management</h1><p>Track specimens, lab requests, and results</p></div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Specimen</button>
        )}
      </div>

      <div className="card table-card">
        <div style={{ padding: '1.5rem 1.5rem 1rem' }}><h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>All Specimens</h2></div>
        <table>
          <thead><tr><th>Specimen ID</th><th>Case Ref</th><th>Collected</th><th>Case Status</th><th>Lab</th><th>Lab Status</th></tr></thead>
          <tbody>
            {specimens.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No specimens recorded yet.</td></tr>
            ) : specimens.map(s => (
              <tr key={s.SpecimenID}>
                <td>SP-{s.SpecimenID}</td>
                <td style={{ fontWeight: 500 }}>{s.CaseReference || 'N/A'}</td>
                <td>{s.CollectedDate ? new Date(s.CollectedDate).toLocaleDateString() : 'N/A'}</td>
                <td><span className={`badge ${s.CaseStatus?.toLowerCase()}`}>{s.CaseStatus}</span></td>
                <td>{s.LabName || 'Not sent'}</td>
                <td>{s.LabStatus ? <span className={`badge ${s.LabStatus?.toLowerCase()}`}>{s.LabStatus}</span> : <span style={{ color: 'var(--tertiary-label)', fontSize: '0.8125rem' }}>No request</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register New Specimen</h2>
              <button onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label className="form-label">Associated Case</label>
                    <select className="form-select" value={form.caseId} onChange={e => setForm({...form, caseId: e.target.value})} required>
                      <option value="">Select a case...</option>
                      {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Specimen Type</label>
                      <input className="form-input" value={form.specimenType} onChange={e => setForm({...form, specimenType: e.target.value})} placeholder="e.g. Blood, Tissue, Hair" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Collection Date</label>
                      <input type="date" className="form-input" value={form.collectedDate} onChange={e => setForm({...form, collectedDate: e.target.value})} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Storage Location (Internal)</label>
                    <input className="form-input" value={form.storageLocation} onChange={e => setForm({...form, storageLocation: e.target.value})} placeholder="e.g. Refrigerator A, Formalin Jar 3" />
                  </div>
                </div>

                <div className="form-section">
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>External Lab Request (Optional)</h3>
                  <div className="form-group">
                    <label className="form-label">Target Laboratory</label>
                    <select className="form-select" value={form.targetLabId} onChange={e => setForm({...form, targetLabId: e.target.value})}>
                      <option value="">Do not send out right now</option>
                      {authorities.map(a => <option key={a.AuthID} value={a.AuthID}>{a.Name}</option>)}
                    </select>
                  </div>
                  {form.targetLabId && (
                    <div className="form-group">
                      <label className="form-label">Analysis Required</label>
                      <textarea className="form-input" value={form.analysisRequired} onChange={e => setForm({...form, analysisRequired: e.target.value})} placeholder="Describe tests to be performed..." rows={3} required />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Specimen</button>
              </div>
            </form>
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
