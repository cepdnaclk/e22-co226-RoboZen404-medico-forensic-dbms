import React, { useEffect, useState, useRef } from 'react';
import { Plus, X, Eye, Printer, Upload, Download, FileText, Edit } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api';
import PMRTemplate from '../components/PMRTemplate';
import ExaminationTemplate from '../components/ExaminationTemplate';

export default function AutopsyCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [staff, setStaff] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: 'Male', nic: '',
    dateOfDeath: '', timeOfDeath: '', jmoStaffId: '', pmNo: '',
    placeOfDeath: '', autopsyDate: '',
    internalExam: {
      locus: '',
      external: { general: '', injuries: '' },
      measurements: { height: '', age: '', sex: '' },
      features: { eyes: '', hair: '', tongue: '', teeth: '' },
      signsOfDeath: { rigorMortis: '', hypostasis: '', putrefaction: '' },
      handsAndNails: '',
      naturalOpenings: '',
      neck: '',
      head: { softParts: '', bones: '', membranes: '', brain: '', vessels: '' },
      spinalCord: '',
      thorax: { bones: '', cavity: '', pericardium: '', heart: '', coronaryVessels: '', largeVessels: '', larynx: '', pleuraLungs: '', gullet: '' },
      abdomen: { position: '', peritoneum: '', diaphragm: '', liver: '', spleen: '', stomach: '', duodenum: '', largeIntestines: '', pancreas: '', kidneys: '', supraRenal: '' },
      pelvis: { bladder: '', generative: '', vessels: '', vertebrae: '' }
    },
    inquestOrder: { authorityId: '', caseNumber: '' },
    documents: []
  });
  const [newDoc, setNewDoc] = useState({ type: '', file: null });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const load = async () => {
    try {
      const [c, s, auth] = await Promise.all([api.getAutopsyCases(), api.getStaff(), api.getAuthorities()]);
      setCases(c.sort((a,b) => b.AutopsyCaseID - a.AutopsyCaseID)); 
      setStaff(s);
      setAuthorities(auth);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const pmrRef = useRef();

  const generatePDF = async () => {
    if (!pmrRef.current || !showDetail) return;
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(pmrRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PMR_${showDetail.PM_No.split('/').join('_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setToast('Failed to generate PDF');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const examRef = useRef();

  const generateExamPDF = async () => {
    if (!examRef.current || !showDetail) return;
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = examRef.current.querySelectorAll('.pdf-page');

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        const canvas = await html2canvas(pageEl, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Examination_${showDetail.PM_No.split('/').join('_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setToast('Failed to generate PDF');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsGeneratingPDF(false);
    }
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
        internalExam: {
          locus: '',
          external: { general: '', injuries: '' },
          measurements: { height: '', age: '', sex: '' },
          features: { eyes: '', hair: '', tongue: '', teeth: '' },
          signsOfDeath: { rigorMortis: '', hypostasis: '', putrefaction: '' },
          handsAndNails: '',
          naturalOpenings: '',
          neck: '',
          head: { softParts: '', bones: '', membranes: '', brain: '', vessels: '' },
          spinalCord: '',
          thorax: { bones: '', cavity: '', pericardium: '', heart: '', coronaryVessels: '', largeVessels: '', larynx: '', pleuraLungs: '', gullet: '' },
          abdomen: { position: '', peritoneum: '', diaphragm: '', liver: '', spleen: '', stomach: '', duodenum: '', largeIntestines: '', pancreas: '', kidneys: '', supraRenal: '' },
          pelvis: { bladder: '', generative: '', vessels: '', vertebrae: '' }
        },
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
      setFindingsForm({
        internalExam: data.internalExamination?.ExaminationData 
          ? (typeof data.internalExamination.ExaminationData === 'string' ? JSON.parse(data.internalExamination.ExaminationData) : data.internalExamination.ExaminationData)
          : {
            locus: '',
            external: { general: '', injuries: '' },
            measurements: { height: '', age: '', sex: '' },
            features: { eyes: '', hair: '', tongue: '', teeth: '' },
            signsOfDeath: { rigorMortis: '', hypostasis: '', putrefaction: '' },
            handsAndNails: '',
            naturalOpenings: '',
            neck: '',
            head: { softParts: '', bones: '', membranes: '', brain: '', vessels: '' },
            spinalCord: '',
            thorax: { bones: '', cavity: '', pericardium: '', heart: '', coronaryVessels: '', largeVessels: '', larynx: '', pleuraLungs: '', gullet: '' },
            abdomen: { position: '', peritoneum: '', diaphragm: '', liver: '', spleen: '', stomach: '', duodenum: '', largeIntestines: '', pancreas: '', kidneys: '', supraRenal: '' },
            pelvis: { bladder: '', generative: '', vessels: '', vertebrae: '' }
          },
        causeOfDeath: {
          immediate: data.causeOfDeath?.ImmediateCause || '',
          antecedent: data.causeOfDeath?.AntecedentCause || '',
          underlying: data.causeOfDeath?.UnderlyingCause || '',
          contributory: data.causeOfDeath?.ContributoryCause || '',
          maternalDeath: data.causeOfDeath?.MaternalDeath || 'None',
          comments: data.causeOfDeath?.Comments || ''
        }
      });
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

  const [reportFormMode, setReportFormMode] = useState(null); // 'edit' or 'view'
  const [examFormMode, setExamFormMode] = useState(null); // 'edit' or 'view'
  const [findingsForm, setFindingsForm] = useState({
    internalExam: { head: '', thorax: '', abdomen: '' },
    causeOfDeath: { immediate: '', antecedent: '', underlying: '', contributory: '', maternalDeath: 'None', comments: '' }
  });

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    try {
      await api.updateAutopsyFindings(showDetail.AutopsyCaseID, { causeOfDeath: findingsForm.causeOfDeath });
      setToast('Cause of Death updated successfully');
      setTimeout(() => setToast(''), 3000);
      setReportFormMode(null);
      viewDetail(showDetail.AutopsyCaseID);
      load();
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const handleUpdateExamination = async (e) => {
    e.preventDefault();
    try {
      await api.updateAutopsyFindings(showDetail.AutopsyCaseID, { internalExam: findingsForm.internalExam });
      setToast('Examination findings updated successfully');
      setTimeout(() => setToast(''), 3000);
      setExamFormMode(null);
      viewDetail(showDetail.AutopsyCaseID);
      load();
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canCreate = user.role === 'Admin' || user.role === 'Clerk';
  const isAssignedJMOOrAdmin = showDetail ? (user.role === 'Admin' || (user.role === 'JMO' && showDetail.JMO_StaffID === user.staffId)) : false;

  if (loading) return <div className="loading"><div className="spinner"></div>Loading autopsy cases...</div>;

  return (
    <div className="animate-in">
      {showDetail && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={pmrRef} style={{ width: '210mm', backgroundColor: 'white', padding: '20mm' }}>
            <PMRTemplate report={showDetail} caseDetail={showDetail} extraDetails={showDetail.internalExamination} />
          </div>
          <div ref={examRef} style={{ width: '210mm', backgroundColor: 'white', padding: '20mm' }}>
            <ExaminationTemplate caseDetail={showDetail} internalExam={showDetail.internalExamination} />
          </div>
        </div>
      )}
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
          <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Post-Mortem Report: {showDetail.PM_No}</h2><button onClick={() => setShowDetail(null)}><X size={14} /></button></div>
            <div className="modal-body">
              <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div className="card detail-section">
                  <h3>Deceased Information</h3>
                  <div className="detail-row"><span className="label">Name</span><span className="value">{showDetail.DeceasedName}</span></div>
                  <div className="detail-row"><span className="label">NIC</span><span className="value">{showDetail.NIC || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Gender</span><span className="value">{showDetail.Gender || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Date of Birth</span><span className="value">{showDetail.DateOfBirth ? new Date(showDetail.DateOfBirth).toLocaleDateString() : 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Date of Death</span><span className="value">{showDetail.DateOfDeath ? new Date(showDetail.DateOfDeath).toLocaleDateString() : 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Time of Death</span><span className="value">{showDetail.TimeOfDeath || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Place</span><span className="value">{showDetail.PlaceOfDeath || 'N/A'}</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="card detail-section">
                    <h3>Case Details</h3>
                    <div className="detail-row"><span className="label">Status</span><span className="value"><span className={`badge ${showDetail.Status?.toLowerCase()}`}>{showDetail.Status}</span></span></div>
                    <div className="detail-row"><span className="label">JMO</span><span className="value">{showDetail.JMOName}</span></div>
                  </div>
                  {showDetail.inquestOrder && (
                    <div className="card detail-section">
                      <h3>Inquest Details</h3>
                      <div className="detail-row"><span className="label">Authority</span><span className="value">{showDetail.inquestOrder.AuthType || 'N/A'}</span></div>
                      <div className="detail-row"><span className="label">Name</span><span className="value">{showDetail.inquestOrder.AuthName || 'N/A'}</span></div>
                      <div className="detail-row"><span className="label">Case No.</span><span className="value">{showDetail.inquestOrder.CaseNumber || 'N/A'}</span></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card detail-section" style={{ marginTop: '1rem' }}>
                <h3>Forms & Reports</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  
                  {/* Post-Mortem Report Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                      <span style={{ fontWeight: 500 }}>Post-Mortem Report (Health 14)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-soft btn-sm" onClick={() => setReportFormMode('view')}><Eye size={14} /> View</button>
                      {isAssignedJMOOrAdmin && showDetail.Status === 'Open' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setReportFormMode('edit')}><Edit size={14} /> Edit</button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={generatePDF} disabled={isGeneratingPDF}><Download size={14} /> PDF</button>
                    </div>
                  </div>

                  {/* Post-Mortem Examination Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                      <span style={{ fontWeight: 500 }}>Post-Mortem Examination</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-soft btn-sm" onClick={() => setExamFormMode('view')}><Eye size={14} /> View</button>
                      {isAssignedJMOOrAdmin && showDetail.Status === 'Open' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setExamFormMode('edit')}><Edit size={14} /> Edit</button>
                      )}
                      {/* Examination PDF placeholder, currently using same generatePDF if needed or disabled, leaving as just PDF button for now */}
                      <button className="btn btn-secondary btn-sm" onClick={generateExamPDF} disabled={isGeneratingPDF}><Download size={14} /> PDF</button>
                    </div>
                  </div>

                </div>
              </div>

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
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', padding: '1rem 1.5rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
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
        </div>
      )}

      {reportFormMode && (
        <div className="modal-overlay" onClick={() => setReportFormMode(null)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Post-Mortem Report</h2><button onClick={() => setReportFormMode(null)}><X size={14} /></button></div>
            <form onSubmit={handleUpdateReport}>
              <div className="modal-body">
                <fieldset disabled={reportFormMode === 'view'} style={{ border: 'none', padding: 0, margin: 0 }}>
                <div className="card detail-section" style={{ marginBottom: '15px' }}>
                  <h2 style={{ fontSize: '18px', textAlign: 'center', marginBottom: '15px' }}>POST-MORTEM REPORT (Health 14) - Cover Page</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group"><label className="form-label">Inquest No.</label><input className="form-input" defaultValue={showDetail.inquestOrder?.CaseNumber || ''} disabled /></div>
                    <div className="form-group"><label className="form-label">Name of Deceased</label><input className="form-input" defaultValue={showDetail.DeceasedName} disabled /></div>
                    <div className="form-group"><label className="form-label">Date of Death</label><input className="form-input" defaultValue={showDetail.DateOfDeath ? new Date(showDetail.DateOfDeath).toLocaleDateString() : ''} disabled /></div>
                    <div className="form-group"><label className="form-label">JMO Conducting Autopsy</label><input className="form-input" defaultValue={showDetail.JMOName} disabled /></div>
                    
                    <div className="form-group"><label className="form-label">Requesting Person</label><input className="form-input" defaultValue={showDetail.inquestOrder?.AuthName || ''} disabled /></div>
                    <div className="form-group"><label className="form-label">Court</label><input className="form-input" defaultValue={showDetail.inquestOrder?.AuthType === 'Magistrate' ? 'Magistrate Court' : ''} disabled /></div>

                    <div className="form-group"><label className="form-label">Place of Examination</label><input className="form-input" defaultValue="Teaching Hospital Peradeniya" /></div>
                    <div className="form-group"><label className="form-label">Identified By</label><input className="form-input" placeholder="Names of persons who identified body" /></div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Cause of Death</h3>
                  <div className="form-group"><label className="form-label">Immediate Cause (1a)</label><input className="form-input" value={findingsForm.causeOfDeath.immediate} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, immediate: e.target.value}})} required /></div>
                  <div className="form-group"><label className="form-label">Antecedent Cause (1b)</label><input className="form-input" value={findingsForm.causeOfDeath.antecedent} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, antecedent: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">Underlying Cause (1c)</label><input className="form-input" value={findingsForm.causeOfDeath.underlying} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, underlying: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">Contributory Cause (II)</label><input className="form-input" value={findingsForm.causeOfDeath.contributory} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, contributory: e.target.value}})} /></div>
                  <div className="form-group">
                    <label className="form-label">Maternal Death</label>
                    <select className="form-select" value={findingsForm.causeOfDeath.maternalDeath || 'None'} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, maternalDeath: e.target.value}})}>
                      <option value="None">No / None</option>
                      <option value="Direct">Yes - Direct</option>
                      <option value="Indirect">Yes - Indirect</option>
                      <option value="Incidental">Yes - Incidental</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Comments & Opinions</label><textarea className="form-input" style={{ minHeight: '60px' }} value={findingsForm.causeOfDeath.comments || ''} onChange={e => setFindingsForm({...findingsForm, causeOfDeath: {...findingsForm.causeOfDeath, comments: e.target.value}})} /></div>
                </div>
                </fieldset>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReportFormMode(null)}>Cancel</button>
                {reportFormMode === 'edit' && <button type="submit" className="btn btn-primary">Save Post-Mortem Report</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {examFormMode && (
        <div className="modal-overlay" onClick={() => setExamFormMode(null)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Post-Mortem Examination</h2><button onClick={() => setExamFormMode(null)}><X size={14} /></button></div>
            <form onSubmit={handleUpdateExamination}>
              <div className="modal-body">
                <fieldset disabled={examFormMode === 'view'} style={{ border: 'none', padding: 0, margin: 0 }}>
                <div className="card detail-section">
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>General & Identification</h3>
                  <div className="form-group"><label className="form-label">1. Examination of the locus</label><textarea className="form-input" value={findingsForm.internalExam.locus} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, locus: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">2. External Examination (clothing, nourishment, marks)</label><textarea className="form-input" value={findingsForm.internalExam.external?.general} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, external: {...findingsForm.internalExam.external, general: e.target.value}}})} /></div>
                  <div className="form-group"><label className="form-label">3. Injuries</label><textarea className="form-input" value={findingsForm.internalExam.external?.injuries} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, external: {...findingsForm.internalExam.external, injuries: e.target.value}}})} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div className="form-group"><label className="form-label">4. Height</label><input className="form-input" value={findingsForm.internalExam.measurements?.height} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, measurements: {...findingsForm.internalExam.measurements, height: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">5. Age</label><input className="form-input" value={findingsForm.internalExam.measurements?.age} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, measurements: {...findingsForm.internalExam.measurements, age: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">6. Sex</label><input className="form-input" value={findingsForm.internalExam.measurements?.sex} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, measurements: {...findingsForm.internalExam.measurements, sex: e.target.value}}})} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group"><label className="form-label">7. Eyes and pupils</label><input className="form-input" value={findingsForm.internalExam.features?.eyes} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, features: {...findingsForm.internalExam.features, eyes: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">8. Hair</label><input className="form-input" value={findingsForm.internalExam.features?.hair} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, features: {...findingsForm.internalExam.features, hair: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">9. Tongue</label><input className="form-input" value={findingsForm.internalExam.features?.tongue} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, features: {...findingsForm.internalExam.features, tongue: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">10. Teeth</label><input className="form-input" value={findingsForm.internalExam.features?.teeth} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, features: {...findingsForm.internalExam.features, teeth: e.target.value}}})} /></div>
                  </div>
                </div>

                <div className="card detail-section" style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>11. Signs of death</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div className="form-group"><label className="form-label">Rigor mortis</label><input className="form-input" value={findingsForm.internalExam.signsOfDeath?.rigorMortis} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, signsOfDeath: {...findingsForm.internalExam.signsOfDeath, rigorMortis: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Hypostasis</label><input className="form-input" value={findingsForm.internalExam.signsOfDeath?.hypostasis} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, signsOfDeath: {...findingsForm.internalExam.signsOfDeath, hypostasis: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Putrefaction</label><input className="form-input" value={findingsForm.internalExam.signsOfDeath?.putrefaction} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, signsOfDeath: {...findingsForm.internalExam.signsOfDeath, putrefaction: e.target.value}}})} /></div>
                  </div>
                </div>

                <div className="card detail-section" style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>Other Specific Areas</h3>
                  <div className="form-group"><label className="form-label">12. Hands and nails</label><input className="form-input" value={findingsForm.internalExam.handsAndNails} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, handsAndNails: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">13. Natural openings</label><input className="form-input" value={findingsForm.internalExam.naturalOpenings} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, naturalOpenings: e.target.value}})} /></div>
                  <div className="form-group"><label className="form-label">14. Neck</label><textarea className="form-input" value={findingsForm.internalExam.neck} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, neck: e.target.value}})} /></div>
                </div>

                <div className="card detail-section" style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>15. Head & 16. Spinal Cord</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group"><label className="form-label">Soft parts covering it</label><input className="form-input" value={findingsForm.internalExam.head?.softParts} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, head: {...findingsForm.internalExam.head, softParts: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Bones of skull</label><input className="form-input" value={findingsForm.internalExam.head?.bones} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, head: {...findingsForm.internalExam.head, bones: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Membranes and sinuses</label><input className="form-input" value={findingsForm.internalExam.head?.membranes} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, head: {...findingsForm.internalExam.head, membranes: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Brain substance</label><input className="form-input" value={findingsForm.internalExam.head?.brain} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, head: {...findingsForm.internalExam.head, brain: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Blood vessels of brain</label><input className="form-input" value={findingsForm.internalExam.head?.vessels} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, head: {...findingsForm.internalExam.head, vessels: e.target.value}}})} /></div>
                  </div>
                  <div className="form-group" style={{ marginTop: '15px' }}><label className="form-label">16. Spinal Cord</label><textarea className="form-input" value={findingsForm.internalExam.spinalCord} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, spinalCord: e.target.value}})} /></div>
                </div>

                <div className="card detail-section" style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>17. Thorax</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group"><label className="form-label">Bones (ribs, sternum, etc)</label><input className="form-input" value={findingsForm.internalExam.thorax?.bones} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, bones: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Chest cavity</label><input className="form-input" value={findingsForm.internalExam.thorax?.cavity} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, cavity: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Pericardium</label><input className="form-input" value={findingsForm.internalExam.thorax?.pericardium} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, pericardium: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Heart</label><input className="form-input" value={findingsForm.internalExam.thorax?.heart} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, heart: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Coronary vessels</label><input className="form-input" value={findingsForm.internalExam.thorax?.coronaryVessels} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, coronaryVessels: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Large blood vessels</label><input className="form-input" value={findingsForm.internalExam.thorax?.largeVessels} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, largeVessels: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Larynx, trachea and bronchi</label><input className="form-input" value={findingsForm.internalExam.thorax?.larynx} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, larynx: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Pleura and Lungs</label><input className="form-input" value={findingsForm.internalExam.thorax?.pleuraLungs} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, pleuraLungs: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Gullet</label><input className="form-input" value={findingsForm.internalExam.thorax?.gullet} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, thorax: {...findingsForm.internalExam.thorax, gullet: e.target.value}}})} /></div>
                  </div>
                </div>

                <div className="card detail-section" style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>18. Abdomen</h3>
                  <div className="form-group"><label className="form-label">Contents, vessels and position of organs</label><textarea className="form-input" value={findingsForm.internalExam.abdomen?.position} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, position: e.target.value}}})} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group"><label className="form-label">Peritoneum</label><input className="form-input" value={findingsForm.internalExam.abdomen?.peritoneum} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, peritoneum: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Diaphragm</label><input className="form-input" value={findingsForm.internalExam.abdomen?.diaphragm} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, diaphragm: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Liver and Gall Bladder</label><input className="form-input" value={findingsForm.internalExam.abdomen?.liver} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, liver: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Spleen</label><input className="form-input" value={findingsForm.internalExam.abdomen?.spleen} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, spleen: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Stomach</label><input className="form-input" value={findingsForm.internalExam.abdomen?.stomach} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, stomach: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Duodenum, jejunum, ileum</label><input className="form-input" value={findingsForm.internalExam.abdomen?.duodenum} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, duodenum: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Large intestines</label><input className="form-input" value={findingsForm.internalExam.abdomen?.largeIntestines} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, largeIntestines: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Pancreas</label><input className="form-input" value={findingsForm.internalExam.abdomen?.pancreas} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, pancreas: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Kidneys</label><input className="form-input" value={findingsForm.internalExam.abdomen?.kidneys} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, kidneys: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Supra-renal glands</label><input className="form-input" value={findingsForm.internalExam.abdomen?.supraRenal} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, abdomen: {...findingsForm.internalExam.abdomen, supraRenal: e.target.value}}})} /></div>
                  </div>
                </div>

                <div className="card detail-section" style={{ marginTop: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>19. Pelvis</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group"><label className="form-label">Urinary bladder, prostate</label><input className="form-input" value={findingsForm.internalExam.pelvis?.bladder} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, pelvis: {...findingsForm.internalExam.pelvis, bladder: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Generative organs</label><input className="form-input" value={findingsForm.internalExam.pelvis?.generative} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, pelvis: {...findingsForm.internalExam.pelvis, generative: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Blood vessels</label><input className="form-input" value={findingsForm.internalExam.pelvis?.vessels} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, pelvis: {...findingsForm.internalExam.pelvis, vessels: e.target.value}}})} /></div>
                    <div className="form-group"><label className="form-label">Vertebrae and pelvic bones</label><input className="form-input" value={findingsForm.internalExam.pelvis?.vertebrae} onChange={e => setFindingsForm({...findingsForm, internalExam: {...findingsForm.internalExam, pelvis: {...findingsForm.internalExam.pelvis, vertebrae: e.target.value}}})} /></div>
                  </div>
                </div>
                </fieldset>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setExamFormMode(null)}>Cancel</button>
                {examFormMode === 'edit' && <button type="submit" className="btn btn-primary">Save Examination</button>}
              </div>
            </form>
          </div>
        </div>
      )}      {showForm && (
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
                    <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">NIC</label><input className="form-input" placeholder="e.g. 195012345678" value={form.nic} onChange={e => setForm({...form, nic: e.target.value})} /></div>
                    <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Date of Death</label><input type="date" className="form-input" value={form.dateOfDeath} onChange={e => setForm({...form, dateOfDeath: e.target.value})} required /></div>
                    <div className="form-group"><label className="form-label">Time of Death</label><input type="time" className="form-input" value={form.timeOfDeath} onChange={e => setForm({...form, timeOfDeath: e.target.value})} /></div>
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
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Inquest Details (Optional)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Inquirer / Magistrate</label>
                      <select className="form-select" value={form.inquestOrder.authorityId} onChange={e => setForm({...form, inquestOrder: {...form.inquestOrder, authorityId: e.target.value}})}>
                        <option value="">Select Inquirer (Leave blank if none)</option>
                        {authorities.map(a => <option key={a.AuthID} value={a.AuthID}>{a.Name} ({a.Type})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Court Case No / Inquest No</label>
                      <input className="form-input" placeholder="e.g. MC/KND/123" value={form.inquestOrder.caseNumber} onChange={e => setForm({...form, inquestOrder: {...form.inquestOrder, caseNumber: e.target.value}})} />
                    </div>
                  </div>
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
