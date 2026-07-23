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
  const [viewSpecimen, setViewSpecimen] = useState(null);
  
  // States for Lab Result Editing
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [resultDetails, setResultDetails] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [resultFile, setResultFile] = useState(null);
  
  const [form, setForm] = useState({
    caseId: '', specimenType: '', collectedDate: new Date().toISOString().split('T')[0],
    storageLocation: '', targetLabId: '', analysisRequired: ''
  });

  const load = async () => {
    try {
      const [data, clinicalCases, autopsyCases, auths] = await Promise.all([
        api.getSpecimens().catch(e => { console.error('Specimens err:', e); return []; }),
        api.getClinicalCases().catch(e => { console.error('Clinical err:', e); return []; }),
        api.getAutopsyCases().catch(e => { console.error('Autopsy err:', e); return []; }),
        api.getAuthorities().catch(e => { console.error('Auths err:', e); return []; })
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
          <thead><tr><th>Specimen ID</th><th>Case Ref</th><th>Collected</th><th>Case Status</th><th>Lab</th><th>Lab Status</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
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
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-soft btn-sm" onClick={() => {
                    setViewSpecimen(s);
                    setIsEditingResult(false);
                    setResultDetails(s.ResultDetails || '');
                    setReceivedDate(s.ReceivedDate ? new Date(s.ReceivedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                    setResultFile(null);
                  }}>View</button>
                </td>
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

      {viewSpecimen && (
        <div className="modal-overlay" onClick={() => setViewSpecimen(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Specimen SP-{viewSpecimen.SpecimenID} Details</h2>
              <button onClick={() => setViewSpecimen(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {!isEditingResult && (
                  <div className="card detail-section" style={{ margin: 0 }}>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>Specimen Information</h3>
                    <div className="detail-row"><span className="label">Case Reference</span><span className="value">{viewSpecimen.CaseReference || 'N/A'}</span></div>
                    <div className="detail-row"><span className="label">Specimen Type</span><span className="value">{viewSpecimen.SpecimenType || 'N/A'}</span></div>
                    <div className="detail-row"><span className="label">Collected Date</span><span className="value">{viewSpecimen.CollectedDate ? new Date(viewSpecimen.CollectedDate).toLocaleDateString() : 'N/A'}</span></div>
                    <div className="detail-row"><span className="label">Storage Location</span><span className="value">{viewSpecimen.StorageLocation || 'N/A'}</span></div>
                  </div>
                )}
                <div className="card detail-section" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>Lab Request</h3>
                  <div className="detail-row"><span className="label">Target Lab</span><span className="value">{viewSpecimen.LabName || 'Not Sent'}</span></div>
                  <div className="detail-row"><span className="label">Status</span><span className="value">{viewSpecimen.LabStatus ? <span className={`badge ${viewSpecimen.LabStatus?.toLowerCase()}`}>{viewSpecimen.LabStatus}</span> : 'No request'}</span></div>
                  {viewSpecimen.AnalysisRequired && (
                    <div className="detail-row"><span className="label">Analysis Req.</span><span className="value" style={{ whiteSpace: 'pre-wrap' }}>{viewSpecimen.AnalysisRequired}</span></div>
                  )}
                </div>
                
                {isEditingResult ? (
                  <div className="card detail-section" style={{ margin: 0 }}>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>Update Lab Results</h3>
                    <div className="form-group">
                      <label className="form-label">Received Date</label>
                      <input type="date" className="form-input" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Result Details</label>
                      <textarea className="form-input" value={resultDetails} onChange={e => setResultDetails(e.target.value)} rows={4} placeholder="Enter the findings/results returned by the lab..." required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Attachment (Optional)</label>
                      <input type="file" className="form-input" onChange={e => setResultFile(e.target.files[0])} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                      <button className="btn btn-primary btn-sm" onClick={async () => {
                        try {
                          await api.updateLabResult(viewSpecimen.RequestID, resultDetails, receivedDate, resultFile);
                          setToast('Lab result updated successfully');
                          setIsEditingResult(false);
                          setViewSpecimen(null);
                          load();
                          setTimeout(() => setToast(''), 3000);
                        } catch (err) {
                          setToast(err.message);
                          setTimeout(() => setToast(''), 3000);
                        }
                      }}>Mark as Completed</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingResult(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  viewSpecimen.ResultDetails && (
                    <div className="card detail-section" style={{ margin: 0 }}>
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>Lab Results</h3>
                      <div className="detail-row"><span className="label">Received Date</span><span className="value">{viewSpecimen.ReceivedDate ? new Date(viewSpecimen.ReceivedDate).toLocaleDateString() : 'N/A'}</span></div>
                      <div className="detail-row" style={{ alignItems: 'flex-start', marginTop: '0.5rem' }}><span className="label">Result Details</span><span className="value" style={{ whiteSpace: 'pre-wrap' }}>{viewSpecimen.ResultDetails}</span></div>
                      {viewSpecimen.AttachmentPath && (
                         <div className="detail-row" style={{ marginTop: '0.5rem' }}>
                           <span className="label">Attachment</span>
                           <span className="value"><a href={`http://localhost:5001/${viewSpecimen.AttachmentPath}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>View Attachment</a></span>
                         </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {canEdit && viewSpecimen.RequestID && !isEditingResult && (
                  <button className="btn btn-secondary" onClick={() => setIsEditingResult(true)}>Edit Results</button>
                )}
              </div>
              <button className="btn btn-soft" onClick={() => setViewSpecimen(null)}>Close</button>
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
