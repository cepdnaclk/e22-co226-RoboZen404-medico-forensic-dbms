import React, { useEffect, useState } from 'react';
import { Plus, X, Eye, Printer, Upload } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';

export default function AutopsyCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [staff, setStaff] = useState([]);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: 'Male', nic: '',
    dateOfDeath: '', timeOfDeath: '', jmoStaffId: '', pmNo: '',
    placeOfDeath: '', autopsyDate: '',
    causeOfDeath: { immediate: '', antecedent: '', underlying: '', contributory: '' },
    internalExam: { head: '', thorax: '', abdomen: '' },
    documents: []
  });
  const [newDoc, setNewDoc] = useState({ type: '', file: null });

  const load = async () => {
    try {
      const [c, s] = await Promise.all([api.getAutopsyCases(), api.getStaff()]);
      setCases(c.sort((a,b) => b.AutopsyCaseID - a.AutopsyCaseID)); setStaff(s);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addFormDoc = () => {
    if (!newDoc.type || !newDoc.file) return;
    setForm({ ...form, documents: [...(form.documents || []), newDoc] });
    setNewDoc({ type: '', file: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createAutopsyCase(form);
      if (form.documents && form.documents.length > 0) {
        for (const doc of form.documents) {
          await api.uploadCaseDocument(res.caseId, doc.type, doc.file);
        }
      }
      setShowForm(false);
      setToast('Autopsy case created with attachments');
      setForm({
        firstName: '', lastName: '', dob: '', gender: 'Male', nic: '',
        dateOfDeath: '', timeOfDeath: '', jmoStaffId: '', pmNo: '',
        placeOfDeath: '', autopsyDate: '',
        causeOfDeath: { immediate: '', antecedent: '', underlying: '', contributory: '' },
        internalExam: { head: '', thorax: '', abdomen: '' },
        documents: []
      });
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const viewDetail = async (id) => {
    try {
      const data = await api.getAutopsyCase(id);
      const docs = await api.getCaseDocuments(data.AutopsyCaseID);
      setShowDetail({ ...data, documents: docs });
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      await api.updateAutopsyCaseStatus(caseId, newStatus);
      setToast(`Case status updated to ${newStatus}`);
      setTimeout(() => setToast(''), 3000);
      setShowDetail(prev => ({ ...prev, Status: newStatus }));
      load();
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('');
  
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadType) return;
    try {
      await api.uploadCaseDocument(showDetail.AutopsyCaseID, uploadType, uploadFile);
      setToast('Document uploaded successfully');
      setTimeout(() => setToast(''), 3000);
      setUploadFile(null);
      setUploadType('');
      viewDetail(showDetail.AutopsyCaseID); // refresh documents
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const [showUpdateFindings, setShowUpdateFindings] = useState(false);
  const [findingsForm, setFindingsForm] = useState({
    internalExam: { head: '', thorax: '', abdomen: '' },
    causeOfDeath: { immediate: '', antecedent: '', underlying: '', contributory: '' }
  });

  const openUpdateFindings = () => {
    setFindingsForm({
      internalExam: {
        head: showDetail.internalExamination?.HeadDetails || '',
        thorax: showDetail.internalExamination?.ThoraxDetails || '',
        abdomen: showDetail.internalExamination?.AbdomenDetails || ''
      },
      causeOfDeath: {
        immediate: showDetail.causeOfDeath?.ImmediateCause || '',
        antecedent: showDetail.causeOfDeath?.AntecedentCause || '',
        underlying: showDetail.causeOfDeath?.UnderlyingCause || '',
        contributory: showDetail.causeOfDeath?.ContributoryCause || ''
      }
    });
    setShowUpdateFindings(true);
  };

  const handleUpdateFindings = async (e) => {
    e.preventDefault();
    try {
      await api.updateAutopsyFindings(showDetail.AutopsyCaseID, findingsForm);
      setToast('Findings updated successfully');
      setTimeout(() => setToast(''), 3000);
      setShowUpdateFindings(false);
      viewDetail(showDetail.AutopsyCaseID); // refresh details
      load();
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = user.role === 'Admin' || user.role === 'JMO';
  const canCreate = user.role === 'Admin' || user.role === 'Clerk';

  if (loading) return <div className="loading"><div className="spinner"></div>Loading autopsy cases...</div>;

  return (
    <div className="animate-in">
      <div className="section-header">
        <div><h1>Autopsy Cases</h1><p>Post-Mortem examination records</p></div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Autopsy</button>
        )}
      </div>

      <div className="card table-card">
        <table>
          <thead><tr><th>PM No</th><th>Deceased</th><th>JMO</th><th>Date of Death</th><th>Place of Death</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {cases.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No autopsy cases found.</td></tr>
            ) : cases.map(c => (
              <tr key={c.AutopsyCaseID}>
                <td>{c.PM_No}</td>
                <td>{c.DeceasedName}</td>
                <td>{c.JMOName}</td>
                <td>{c.DateOfDeath ? new Date(c.DateOfDeath).toLocaleDateString() : 'N/A'}</td>
                <td>{c.PlaceOfDeath || 'N/A'}</td>
                <td><span className={`badge ${c.Status?.toLowerCase()}`}>{c.Status}</span></td>
                <td><button className="btn btn-soft btn-sm" onClick={() => viewDetail(c.AutopsyCaseID)}><Eye size={14} /> View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Post-Mortem: {showDetail.PM_No}</h2><button onClick={() => setShowDetail(null)}><X size={14} /></button></div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="card detail-section">
                  <h3>Deceased Information</h3>
                  <div className="detail-row"><span className="label">Name</span><span className="value">{showDetail.DeceasedName}</span></div>
                  <div className="detail-row"><span className="label">NIC</span><span className="value">{showDetail.NIC || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Date of Death</span><span className="value">{showDetail.DateOfDeath ? new Date(showDetail.DateOfDeath).toLocaleDateString() : 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Time of Death</span><span className="value">{showDetail.TimeOfDeath || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Place</span><span className="value">{showDetail.PlaceOfDeath || 'N/A'}</span></div>
                </div>
                <div className="card detail-section">
                  <h3>Case Details</h3>
                  <div className="detail-row"><span className="label">Status</span><span className="value"><span className={`badge ${showDetail.Status?.toLowerCase()}`}>{showDetail.Status}</span></span></div>
                  <div className="detail-row"><span className="label">JMO</span><span className="value">{showDetail.JMOName}</span></div>
                </div>
              </div>

              {showDetail.causeOfDeath && (
                <div className="card detail-section" style={{ marginTop: '1rem' }}>
                  <h3>Cause of Death</h3>
                  <div className="detail-row"><span className="label">Immediate</span><span className="value">{showDetail.causeOfDeath.ImmediateCause}</span></div>
                  <div className="detail-row"><span className="label">Antecedent</span><span className="value">{showDetail.causeOfDeath.AntecedentCause || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Underlying</span><span className="value">{showDetail.causeOfDeath.UnderlyingCause || 'N/A'}</span></div>
                </div>
              )}

              {showDetail.internalExamination && (
                <div className="card detail-section" style={{ marginTop: '1rem' }}>
                  <h3>Internal Examination</h3>
                  <div className="detail-row"><span className="label">Head</span><span className="value">{showDetail.internalExamination.HeadDetails || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Thorax</span><span className="value">{showDetail.internalExamination.ThoraxDetails || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Abdomen</span><span className="value">{showDetail.internalExamination.AbdomenDetails || 'N/A'}</span></div>
                </div>
              )}

              {showDetail.specimens && showDetail.specimens.length > 0 && (
                <div className="card detail-section" style={{ marginTop: '1rem' }}>
                  <h3>Lab Specimens & Requests</h3>
                  {showDetail.specimens.map(s => (
                    <div key={s.SpecimenID} style={{ padding: '0.75rem', background: 'var(--system-bg)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600 }}>{s.SpecimenType} (SP-{s.SpecimenID})</span>
                        {s.LabStatus ? <span className={`badge ${s.LabStatus.toLowerCase()}`}>{s.LabStatus}</span> : <span style={{ fontSize: '0.75rem', color: 'var(--tertiary-label)' }}>Internal Storage</span>}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--secondary-label)' }}>
                        {s.LabName ? `Sent to: ${s.LabName}` : `Location: ${s.StorageLocation || 'N/A'}`}
                      </div>
                      {s.ResultDetails && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '4px', fontSize: '0.8125rem', border: '1px solid var(--separator)' }}>
                          <strong>Result:</strong> {s.ResultDetails}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="card detail-section" style={{ marginTop: '1rem' }}>
                <h3>Attachments & Documents</h3>
                <div style={{ marginBottom: '1rem' }}>
                  {showDetail.documents && showDetail.documents.length > 0 ? (
                    showDetail.documents.map(doc => (
                      <div key={doc.DocumentID} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--system-bg)', borderRadius: '4px', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, display: 'block' }}>{doc.DocumentType}</span>
                          <span style={{ color: 'var(--secondary-label)' }}>{doc.FileName}</span>
                        </div>
                        <a href={`http://localhost:5001${doc.FilePath}`} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm" style={{ padding: '0.25rem 0.5rem' }}>View</a>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--tertiary-label)' }}>No documents attached.</div>
                  )}
                </div>
                <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select className="form-select" style={{ width: '140px', padding: '0.4rem', fontSize: '0.8125rem' }} value={uploadType} onChange={e => setUploadType(e.target.value)} required>
                    <option value="">Select Type</option>
                    <option value="MLEF Copy">PMR Copy</option>
                    <option value="Photograph">Photograph</option>
                    <option value="Referral Report">Referral Report</option>
                    <option value="Summons">Summons</option>
                    <option value="Issued Report">Issued Report</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Other">Other</option>
                  </select>
                  <label className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0, fontWeight: 500 }}>
                    <Upload size={14} />
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {uploadFile ? uploadFile.name : 'Choose File'}
                    </span>
                    <input type="file" onChange={e => setUploadFile(e.target.files[0])} required style={{ display: 'none' }} />
                  </label>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.4rem 0.5rem' }} disabled={!uploadFile}>Upload</button>
                </form>
              </div>

              <div className="card qr-panel" style={{ marginTop: '1rem' }} id="qr-print-area">
                <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--tertiary-label)' }}>Evidence QR</h3>
                <div className="qr-bg"><QRCodeSVG value={`forensicsys://pm/${showDetail.PM_No}`} size={140} id={`qr-svg-${showDetail.PM_No}`} /></div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--tertiary-label)', marginBottom: '1rem' }}>{showDetail.PM_No}</p>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    const printWindow = window.open('', '', 'width=600,height=600');
                    printWindow.document.write('<html><head><title>Print QR</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">');
                    printWindow.document.write('<h2>Evidence QR</h2>');
                    printWindow.document.write(document.getElementById(`qr-svg-${showDetail.PM_No}`).outerHTML);
                    printWindow.document.write('<p>' + showDetail.PM_No + '</p>');
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
                  }}
                >
                  <Printer size={16} /> Print QR Label
                </button>
              </div>
            </div>
            <div className="modal-footer">
              {(user.role === 'Admin' || (user.role === 'JMO' && showDetail.JMO_StaffID === user.staffId)) && showDetail.Status === 'Open' && (
                <button className="btn btn-secondary" onClick={openUpdateFindings}>Update Findings</button>
              )}
              {(user.role === 'Admin' || (user.role === 'JMO' && showDetail.JMO_StaffID === user.staffId)) && (
                showDetail.Status === 'Open' ? (
                  <button className="btn btn-primary" onClick={() => handleStatusChange(showDetail.AutopsyCaseID, 'Closed')}>Close Case</button>
                ) : (
                  <button className="btn btn-secondary" onClick={() => handleStatusChange(showDetail.AutopsyCaseID, 'Open')}>Reopen Case</button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showUpdateFindings && (
        <div className="modal-overlay" onClick={() => setShowUpdateFindings(false)}>
          <div className="modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Update Medical Findings</h2><button onClick={() => setShowUpdateFindings(false)}><X size={14} /></button></div>
            <form onSubmit={handleUpdateFindings}>
              <div className="modal-body">
                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Internal Examination</h3>
                  <div className="form-group"><label className="form-label">Head Details</label><input className="form-input" value={findingsForm.internalExam.head} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, head: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">Thorax Details</label><input className="form-input" value={findingsForm.internalExam.thorax} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">Abdomen Details</label><input className="form-input" value={findingsForm.internalExam.abdomen} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: e.target.value}})} /></div>
                </div>

                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Cause of Death</h3>
                  <div className="form-group"><label className="form-label">Immediate Cause</label><input className="form-input" value={findingsForm.causeOfDeath.immediate} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, immediate: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">Antecedent Cause</label><input className="form-input" value={findingsForm.causeOfDeath.antecedent} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, antecedent: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">Underlying Cause</label><input className="form-input" value={findingsForm.causeOfDeath.underlying} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, underlying: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">Contributory Cause</label><input className="form-input" value={findingsForm.causeOfDeath.contributory} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, contributory: e.target.value}})} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateFindings(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Findings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>New Autopsy Case</h2><button onClick={() => setShowForm(false)}><X size={14} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Deceased Details</h3>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">First Name</label><input className="form-input" placeholder="e.g. Nimal" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
                    <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" placeholder="e.g. Silva" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Date of Death</label><input type="date" className="form-input" value={form.dateOfDeath} onChange={e => setForm({...form, dateOfDeath: e.target.value})} required /></div>
                    <div className="form-group"><label className="form-label">Time of Death</label><input type="time" className="form-input" value={form.timeOfDeath} onChange={e => setForm({...form, timeOfDeath: e.target.value})} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">NIC</label><input className="form-input" placeholder="e.g. 195012345678" value={form.nic} onChange={e => setForm({...form, nic: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Case Information</h3>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">PM Number</label><input className="form-input" value={form.pmNo} onChange={e => setForm({...form, pmNo: e.target.value})} placeholder="e.g. PM/2025/001" required /></div>
                    <div className="form-group"><label className="form-label">Assigned JMO</label><select className="form-select" value={form.jmoStaffId} onChange={e => setForm({...form, jmoStaffId: e.target.value})} required><option value="">Select JMO</option>{staff.filter(s => s.RoleName === 'JMO').map(s => <option key={s.StaffID} value={s.StaffID}>{s.FirstName} {s.LastName}</option>)}</select></div>
                  </div>
                  <div className="form-group"><label className="form-label">Place of Death</label><input className="form-input" placeholder="e.g. National Hospital, Colombo" value={form.placeOfDeath} onChange={e => setForm({...form, placeOfDeath: e.target.value})} /></div>
                </div>

                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Cause of Death</h3>
                  <div className="form-group"><label className="form-label">Immediate Cause</label><input className="form-input" placeholder="e.g. Acute Myocardial Infarction" value={form.causeOfDeath.immediate} onChange={e => setForm({...form, causeOfDeath: {...form.causeOfDeath, immediate: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">Antecedent Cause</label><input className="form-input" placeholder="e.g. Coronary Artery Disease" value={form.causeOfDeath.antecedent} onChange={e => setForm({...form, causeOfDeath: {...form.causeOfDeath, antecedent: e.target.value}})} /></div>
                </div>

                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Attachments</h3>
                  {form.documents && form.documents.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--separator)', fontSize: '0.875rem' }}>
                      <span>{doc.type} - {doc.file.name}</span>
                      <button type="button" style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => setForm({...form, documents: form.documents.filter((_, j) => j !== i)})}>Remove</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <select className="form-select" style={{ fontSize: '0.8125rem', flex: 1 }} value={newDoc.type} onChange={e => setNewDoc({...newDoc, type: e.target.value})}>
                      <option value="">Select Type</option>
                      <option value="PMR Copy">PMR Copy</option>
                      <option value="Photograph">Photograph</option>
                      <option value="Referral Report">Referral Report</option>
                      <option value="Summons">Summons</option>
                      <option value="Issued Report">Issued Report</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Other">Other</option>
                    </select>
                    <label className="btn btn-secondary" style={{ padding: '0.45rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0, fontWeight: 500, fontSize: '0.8125rem' }}>
                      <Upload size={14} />
                      <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {newDoc.file ? newDoc.file.name : 'Choose File'}
                      </span>
                      <input type="file" onChange={e => setNewDoc({...newDoc, file: e.target.files[0]})} style={{ display: 'none' }} />
                    </label>
                    <button type="button" className="btn btn-secondary" onClick={addFormDoc} style={{ padding: '0.5rem' }}><Plus size={14} /></button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Autopsy Case</button>
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
