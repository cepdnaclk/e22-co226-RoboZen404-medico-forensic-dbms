import React, { useEffect, useState, useRef } from 'react';
import { Plus, X, Eye, Printer, Upload, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import MLEFTemplate from '../components/MLEFTemplate';
import MLRTemplate from '../components/MLRTemplate';
import api from '../api';

export default function ClinicalCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [wards, setWards] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ 
    patientId: '', jmoStaffId: '', wardId: '', mlefNo: '', admissionDate: '', 
    policeStationId: '', dateOfIssue: '', reasonForExamination: '', 
    policeOfficerName: '', policeOfficerRank: '', policeOfficerRegNo: '', 
    injuries: [], documents: [] 
  });
  const [newInjury, setNewInjury] = useState({ type: '', location: '', dimensions: '', description: '' });
  const [newDoc, setNewDoc] = useState({ type: '', file: null });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const mlefRef = useRef();
  
  // MLR specific state
  const mlrRef = useRef();
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFormData, setPdfFormData] = useState({ magistrateCourt: '', courtCaseNo: '', dateOfTrial: '' });

  const load = async () => {
    try {
      const [c, p, s, w, a] = await Promise.all([
        api.getClinicalCases(), api.getPatients(), api.getStaff(), api.getWards(), api.getAuthorities()
      ]);
      setCases(c.sort((a,b) => b.ClinicalCaseID - a.ClinicalCaseID)); setPatients(p); setStaff(s); setWards(w);
      setPoliceStations(a.filter(auth => auth.Type === 'Police'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addInjury = () => {
    if (!newInjury.type) return;
    setForm({ ...form, injuries: [...form.injuries, { ...newInjury }] });
    setNewInjury({ type: '', location: '', dimensions: '', description: '' });
  };

  const addFormDoc = () => {
    if (!newDoc.type || !newDoc.file) return;
    setForm({ ...form, documents: [...(form.documents || []), newDoc] });
    setNewDoc({ type: '', file: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createClinicalCase(form);
      
      const docsToUpload = [...(form.documents || [])];
      if (newDoc.type && newDoc.file) {
        docsToUpload.push(newDoc);
      }

      if (docsToUpload.length > 0) {
        for (const doc of docsToUpload) {
          await api.uploadCaseDocument(res.caseId, doc.type, doc.file);
        }
      }
      
      setShowForm(false);
      setForm({ 
        patientId: '', jmoStaffId: '', wardId: '', mlefNo: '', admissionDate: '', 
        policeStationId: '', dateOfIssue: '', reasonForExamination: '', 
        policeOfficerName: '', policeOfficerRank: '', policeOfficerRegNo: '', 
        injuries: [], documents: [] 
      });
      setNewDoc({ type: '', file: null });
      setToast('Clinical case created with attachments');
      setTimeout(() => setToast(''), 3000);
      load();
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const viewDetail = async (id) => {
    try {
      const data = await api.getClinicalCase(id);
      const docs = await api.getCaseDocuments(data.ClinicalCaseID);
      setShowDetail({ ...data, documents: docs });
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const handleStatusChange = async (caseId, newStatus) => {
    try {
      await api.updateCaseStatus(caseId, newStatus);
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
      await api.uploadCaseDocument(showDetail.ClinicalCaseID, uploadType, uploadFile);
      setToast('Document uploaded successfully');
      setTimeout(() => setToast(''), 3000);
      setUploadFile(null);
      setUploadType('');
      viewDetail(showDetail.ClinicalCaseID); // refresh documents
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const [showUpdateFindings, setShowUpdateFindings] = useState(false);
  const [findingsForm, setFindingsForm] = useState({ 
    injuries: [], 
    intoxication: { substanceType: '', consumed: false, underInfluence: false },
    partB: { producedBy: '', examinationDate: '', examinationPlace: '', dischargeDate: '', causativeWeapon: '', categoryOfHurt: '', endangersLife: false, investigations: '', referrals: '', recommendations: '', remarks: '' },
    sexualAssault: { hymenStatus: '', penetrationSigns: '', otherSigns: '' }
  });
  const [updateInjury, setUpdateInjury] = useState({ type: '', location: '', dimensions: '', description: '' });

  const generateMLRPDF = async (e) => {
    e?.preventDefault();
    if (!mlrRef.current || !showDetail) return;
    setShowPdfModal(false);
    setIsGeneratingPDF(true);
    try {
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(mlrRef.current, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgHeight = (canvas.height * pdfWidth) / canvas.width;
          
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          pdf.save(`MLR_Report_${showDetail.PatientName ? showDetail.PatientName.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown'}_${showDetail.ClinicalCaseID}.pdf`);
        } catch (error) {
          console.error('Canvas error:', error);
          setToast('Failed to generate MLR PDF');
          setTimeout(() => setToast(''), 3000);
        } finally {
          setIsGeneratingPDF(false);
        }
      }, 300);
    } catch (err) {
      console.error('Failed to generate MLR PDF:', err);
      setIsGeneratingPDF(false);
    }
  };

  const openUpdateFindings = () => {
    const pB = showDetail.partB || {};
    const sa = showDetail.sexualAssault || {};
    const int = showDetail.intoxicationRecords?.[0] || {};
    
    // Convert ISO/DB dates to datetime-local format safely
    const toLocalInput = (d) => {
      if (!d) return '';
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '';
        return dt.toISOString().slice(0, 16);
      } catch { return ''; }
    };

    setFindingsForm({
      injuries: showDetail.injuries || [],
      intoxication: { 
        substanceType: int.SubstanceType || '', 
        consumed: int.Consumed || false, 
        underInfluence: int.UnderInfluence || false 
      },
      partB: { 
        producedBy: pB.ProducedBy || '', 
        examinationDate: toLocalInput(pB.ExaminationDate), 
        examinationPlace: pB.ExaminationPlace || '', 
        dischargeDate: toLocalInput(pB.DischargeDate), 
        causativeWeapon: pB.CausativeWeapon || '', 
        categoryOfHurt: pB.CategoryOfHurt || '', 
        endangersLife: pB.EndangersLife || false, 
        investigations: pB.Investigations || '', 
        referrals: pB.Referrals || '', 
        recommendations: pB.Recommendations || '', 
        remarks: pB.Remarks || '' 
      },
      sexualAssault: { 
        hymenStatus: sa.HymenStatus || '', 
        penetrationSigns: sa.PenetrationSigns || '', 
        otherSigns: sa.OtherSigns || '' 
      }
    });
    setShowUpdateFindings(true);
  };

  const addUpdateInjury = () => {
    if (!updateInjury.type) return;
    setFindingsForm({ ...findingsForm, injuries: [...findingsForm.injuries, { ...updateInjury }] });
    setUpdateInjury({ type: '', location: '', dimensions: '', description: '' });
  };

  const removeUpdateInjury = (index) => {
    const newInjuries = [...findingsForm.injuries];
    newInjuries.splice(index, 1);
    setFindingsForm({ ...findingsForm, injuries: newInjuries });
  };

  const handleUpdateFindings = async (e) => {
    e.preventDefault();
    try {
      await api.updateClinicalFindings(showDetail.ClinicalCaseID, findingsForm);
      setToast('Findings updated successfully');
      setTimeout(() => setToast(''), 3000);
      await viewDetail(showDetail.ClinicalCaseID); // wait for details to refresh
      load();
      setShowUpdateFindings(false); // close modal AFTER details are fully loaded
    } catch (err) { setToast(err.message); setTimeout(() => setToast(''), 3000); }
  };

  const generateMLEFPDF = async () => {
    if (!mlefRef.current || !showDetail) return;
    setIsGeneratingPDF(true);
    try {
      setTimeout(async () => {
        try {
          const canvas = await html2canvas(mlefRef.current, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          const imgHeight = (canvas.height * pdfWidth) / canvas.width;
          
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;
          }
          
          pdf.save(`MLEF_Report_${showDetail.PatientName ? showDetail.PatientName.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown'}_${showDetail.ClinicalCaseID}.pdf`);
        } catch (e) {
          console.error('Canvas error:', e);
          setToast('Failed to generate PDF');
          setTimeout(() => setToast(''), 3000);
        } finally {
          setIsGeneratingPDF(false);
        }
      }, 300);
    } catch (err) {
      console.error('Failed to generate MLR:', err);
      setIsGeneratingPDF(false);
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEdit = user.role === 'Admin' || user.role === 'Doctor';
  const canCreate = user.role === 'Admin' || user.role === 'Clerk';

  if (loading) return <div className="loading"><div className="spinner"></div>Loading clinical cases...</div>;

  return (
    <div className="animate-in">
      {/* Hidden MLEF Template for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <MLEFTemplate ref={mlefRef} caseDetail={showDetail} />
      </div>

      {/* Hidden MLR Template for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <MLRTemplate 
          ref={mlrRef} 
          report={{ ReportID: showDetail?.ClinicalCaseID, IssueDate: new Date().toISOString() }} 
          caseDetail={showDetail} 
          extraDetails={pdfFormData} 
        />
      </div>

      <div className="section-header">
        <div>
          <h1>Clinical Cases</h1>
          <p>Medico-Legal Examination cases</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Clinical Case</button>
        )}
      </div>

      <div className="card table-card">
        <table>
          <thead><tr><th>MLEF No</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {cases.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No clinical cases found.</td></tr>
            ) : cases.map(c => (
              <tr key={c.ClinicalCaseID}>
                <td>{c.MLEF_No}</td>
                <td>{c.PatientName}</td>
                <td>{c.JMOName}</td>

                <td>{new Date(c.CaseDate).toLocaleDateString()}</td>
                <td><span className={`badge ${c.Status?.toLowerCase()}`}>{c.Status}</span></td>
                <td><button className="btn btn-soft btn-sm" onClick={() => viewDetail(c.ClinicalCaseID)}><Eye size={14} /> View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Case: {showDetail.MLEF_No}</h2>
              <button onClick={() => setShowDetail(null)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="card detail-section">
                  <h3>Patient Information</h3>
                  <div className="detail-row"><span className="label">Name</span><span className="value">{showDetail.PatientName}</span></div>
                  <div className="detail-row"><span className="label">NIC</span><span className="value">{showDetail.NIC || 'N/A'}</span></div>
                  <div className="detail-row"><span className="label">Gender</span><span className="value">{showDetail.Gender}</span></div>
                  <div className="detail-row"><span className="label">Address</span><span className="value">{showDetail.Address || 'N/A'}</span></div>
                </div>
                <div className="card detail-section">
                  <h3>Case Details</h3>
                  <div className="detail-row"><span className="label">Status</span><span className="value"><span className={`badge ${showDetail.Status?.toLowerCase()}`}>{showDetail.Status}</span></span></div>
                  <div className="detail-row"><span className="label">Doctor</span><span className="value">{showDetail.JMOName}</span></div>

                  <div className="detail-row"><span className="label">Date</span><span className="value">{new Date(showDetail.CaseDate).toLocaleDateString()}</span></div>
                </div>
              </div>

              {showDetail.injuries && showDetail.injuries.length > 0 && (
                <div className="card detail-section" style={{ marginTop: '1rem' }}>
                  <h3>Injuries Recorded</h3>
                  {showDetail.injuries.map((inj, i) => (
                    <div key={i} className="detail-row">
                      <span className="label">{inj.Type} ({inj.Location})</span>
                      <span className="value">{inj.Dimensions || 'N/A'}</span>
                    </div>
                  ))}
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
                <h3>MLEF Details (Part A)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <p style={{ color: 'var(--secondary-label)', fontSize: '0.8125rem' }}>MLEF No</p>
                    <p style={{ fontWeight: 500 }}>{showDetail.MLEF_No}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--secondary-label)', fontSize: '0.8125rem' }}>Date of Issue</p>
                    <p style={{ fontWeight: 500 }}>{showDetail.DateOfIssue ? new Date(showDetail.DateOfIssue).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ color: 'var(--secondary-label)', fontSize: '0.8125rem' }}>Reason for Examination</p>
                    <p style={{ fontWeight: 500 }}>{showDetail.ReasonForExamination || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--secondary-label)', fontSize: '0.8125rem' }}>Police Station</p>
                    <p style={{ fontWeight: 500 }}>{showDetail.PoliceStationName || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--secondary-label)', fontSize: '0.8125rem' }}>Police Officer Issuing</p>
                    <p style={{ fontWeight: 500 }}>
                      {showDetail.PoliceOfficerName ? `${showDetail.PoliceOfficerName} (${showDetail.PoliceOfficerRank} - ${showDetail.PoliceOfficerRegNo})` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card detail-section" style={{ marginTop: '1rem' }}>
                <h3>Part II - Medical Examination (Clinical Findings) & Documents</h3>

                {showDetail.partB && (
                  <>
                    <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">Produced By (9)</span><span className="value">{showDetail.partB.ProducedBy || 'N/A'}</span></div>
                    <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">Exam Place (11)</span><span className="value">{showDetail.partB.ExaminationPlace || 'N/A'}</span></div>
                    <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">Exam Date (11)</span><span className="value">{showDetail.partB.ExaminationDate ? new Date(showDetail.partB.ExaminationDate).toLocaleString() : 'N/A'}</span></div>
                    <div className="detail-row" style={{marginBottom: '1.25rem'}}><span className="label">Discharge Date (12)</span><span className="value">{showDetail.partB.DischargeDate ? new Date(showDetail.partB.DischargeDate).toLocaleString() : 'N/A'}</span></div>

                    <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">Weapon (14)</span><span className="value" style={{fontWeight: 600}}>{showDetail.partB.CausativeWeapon || 'N/A'}</span></div>
                    <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">Category of Hurt (15)</span><span className="value" style={{fontWeight: 600}}>{showDetail.partB.CategoryOfHurt || 'N/A'}</span></div>
                    {showDetail.partB.CategoryOfHurt === 'Grievous' && (
                      <div className="detail-row" style={{marginBottom: '1.25rem'}}><span className="label">Endangers Life?</span><span className="value">{showDetail.partB.EndangersLife ? 'Yes' : 'No'}</span></div>
                    )}
                    {showDetail.partB.CategoryOfHurt !== 'Grievous' && <div style={{marginBottom: '1.25rem'}}></div>}
                  </>
                )}

                {showDetail.intoxicationRecords && showDetail.intoxicationRecords.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Intoxication (16-17)</h4>
                    {showDetail.intoxicationRecords.map(r => (
                      <div key={r.RecordID}>
                        <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">Substance</span><span className="value">{r.SubstanceType}</span></div>
                        <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">Consumed/Breathing</span><span className="value">{r.Consumed ? 'Yes' : 'No'}</span></div>
                        <div className="detail-row"><span className="label">Under Influence</span><span className="value">{r.UnderInfluence ? 'Yes' : 'No'}</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {showDetail.sexualAssault && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Sexual Assault Exam (18)</h4>
                    <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">History</span><span className="value" style={{whiteSpace: 'pre-wrap'}}>{showDetail.sexualAssault.OtherSigns || 'N/A'}</span></div>
                    <div className="detail-row" style={{marginBottom: '0.25rem'}}><span className="label">Vaginal/Hymen</span><span className="value">{showDetail.sexualAssault.HymenStatus || 'N/A'}</span></div>
                    <div className="detail-row"><span className="label">Anal Penetration</span><span className="value">{showDetail.sexualAssault.PenetrationSigns || 'N/A'}</span></div>
                  </div>
                )}

                {showDetail.partB && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>Medical Outcomes (19-22)</h4>
                    <div className="detail-row" style={{marginBottom: '0.25rem', alignItems: 'flex-start'}}><span className="label" style={{minWidth: '120px'}}>Investigations (19)</span><span className="value" style={{whiteSpace: 'pre-wrap'}}>{showDetail.partB.Investigations || 'N/A'}</span></div>
                    <div className="detail-row" style={{marginBottom: '0.25rem', alignItems: 'flex-start'}}><span className="label" style={{minWidth: '120px'}}>Referrals (20)</span><span className="value" style={{whiteSpace: 'pre-wrap'}}>{showDetail.partB.Referrals || 'N/A'}</span></div>
                    <div className="detail-row" style={{marginBottom: '0.25rem', alignItems: 'flex-start'}}><span className="label" style={{minWidth: '120px'}}>Recommendations (21)</span><span className="value" style={{whiteSpace: 'pre-wrap'}}>{showDetail.partB.Recommendations || 'N/A'}</span></div>
                    <div className="detail-row" style={{alignItems: 'flex-start'}}><span className="label" style={{minWidth: '120px'}}>Remarks (22)</span><span className="value" style={{whiteSpace: 'pre-wrap'}}>{showDetail.partB.Remarks || 'N/A'}</span></div>
                  </div>
                )}

                <h4 style={{ fontSize: '0.8125rem', marginBottom: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--separator)', paddingTop: '1rem' }}>Attached Documents</h4>
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
                    <option value="MLEF Copy">MLEF Copy</option>
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

              <div className="card detail-section" style={{ marginTop: '1rem' }}>
                <h3>Forms & Reports</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                      <span style={{ fontWeight: 500 }}>Medico-Legal Examination Form (MLEF)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {canEdit && showDetail.Status === 'Open' && (
                        <button className="btn btn-primary btn-sm" onClick={() => openUpdateFindings()}><FileText size={14} /> Edit</button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={generateMLEFPDF} disabled={isGeneratingPDF}>
                        <Printer size={14} /> PDF
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                      <span style={{ fontWeight: 500 }}>Medico-Legal Report (MLR)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowPdfModal(true)} disabled={isGeneratingPDF}>
                        <Printer size={14} /> PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card qr-panel" style={{ marginTop: '1rem' }} id="qr-print-area">
                <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--tertiary-label)' }}>Evidence QR</h3>
                <div className="qr-bg"><QRCodeSVG value={`forensicsys://mlef/${showDetail.MLEF_No}`} size={140} id={`qr-svg-${showDetail.MLEF_No}`} /></div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--tertiary-label)', marginBottom: '1rem' }}>{showDetail.MLEF_No}</p>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    const printWindow = window.open('', '', 'width=600,height=600');
                    printWindow.document.write('<html><head><title>Print QR</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">');
                    printWindow.document.write('<h2>Evidence QR</h2>');
                    printWindow.document.write(document.getElementById(`qr-svg-${showDetail.MLEF_No}`).outerHTML);
                    printWindow.document.write('<p>' + showDetail.MLEF_No + '</p>');
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
            <div className="modal-footer" style={{ borderTop: '1px solid var(--separator)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {/* Removed redundant Download PDF button */}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {(user.role === 'Admin' || ((user.role === 'Doctor' || user.role === 'JMO') && showDetail.JMO_StaffID === user.staffId)) && showDetail.Status === 'Open' && (
                  <button className="btn btn-secondary" onClick={openUpdateFindings}>Update MLEF Part II</button>
                )}
                {(user.role === 'Admin' || ((user.role === 'Doctor' || user.role === 'JMO') && showDetail.JMO_StaffID === user.staffId)) && (
                  showDetail.Status === 'Open' ? (
                    <button className="btn btn-primary" onClick={() => handleStatusChange(showDetail.ClinicalCaseID, 'Closed')}>Close Case</button>
                  ) : (
                    <button className="btn btn-secondary" onClick={() => handleStatusChange(showDetail.ClinicalCaseID, 'Open')}>Reopen Case</button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update MLEF Part II Modal */}
      {showUpdateFindings && (
        <div className="modal-overlay" onClick={() => setShowUpdateFindings(false)}>
          <div className="modal" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>MLEF Part B (9-22) - Medical Officer Findings</h2>
              <button onClick={() => setShowUpdateFindings(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleUpdateFindings}>
              <div className="modal-body">
                
                {/* Section 1: Examination Details */}
                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Examination Details</h3>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Produced By (9)</label><input className="form-input" value={findingsForm.partB.producedBy} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, producedBy: e.target.value}})} placeholder="Name of officer/person" /></div>
                    <div className="form-group"><label className="form-label">Examination Place (11)</label><input className="form-input" value={findingsForm.partB.examinationPlace} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, examinationPlace: e.target.value}})} placeholder="e.g. Ward 3, OPD" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Examination Date & Time (11)</label><input type="datetime-local" className="form-input" value={findingsForm.partB.examinationDate || ''} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, examinationDate: e.target.value}})} /></div>
                    <div className="form-group"><label className="form-label">Date of Discharge (12)</label><input type="datetime-local" className="form-input" value={findingsForm.partB.dischargeDate || ''} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, dischargeDate: e.target.value}})} /></div>
                  </div>
                </div>

                {/* Section 2: Injuries & Harm */}
                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Injuries & Nature of Harm (13-15)</h3>
                  
                  <div className="form-row" style={{ marginBottom: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Nature of Causative Weapon (14)</label>
                      <select className="form-select" value={findingsForm.partB.causativeWeapon} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, causativeWeapon: e.target.value}})}>
                        <option value="">Select Weapon Type...</option>
                        <option value="Blunt">Blunt</option>
                        <option value="Sharp">Sharp</option>
                        <option value="Firearm">Firearm</option>
                        <option value="Explosive devices">Explosive devices</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category of Hurt (15)</label>
                      <select className="form-select" value={findingsForm.partB.categoryOfHurt} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, categoryOfHurt: e.target.value}})}>
                        <option value="">Select Category...</option>
                        <option value="Non-grievous">Non-grievous</option>
                        <option value="Grievous">Grievous</option>
                        <option value="Fatal in ordinary course of nature">Fatal in ordinary course of nature</option>
                      </select>
                    </div>
                  </div>
                  
                  {findingsForm.partB.categoryOfHurt === 'Grievous' && (
                    <div className="form-row" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <input type="checkbox" checked={findingsForm.partB.endangersLife} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, endangersLife: e.target.checked}})} /> If Grievous, does it endanger life?
                      </label>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '0.5rem' }}><label className="form-label">Detailed Injuries List (13)</label></div>
                  {findingsForm.injuries.map((inj, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div><strong style={{fontSize: '0.75rem', color: 'var(--tertiary-label)'}}>TYPE</strong><br/>{inj.type || inj.Type}</div>
                        <div><strong style={{fontSize: '0.75rem', color: 'var(--tertiary-label)'}}>LOCATION</strong><br/>{inj.location || inj.Location}</div>
                        <div><strong style={{fontSize: '0.75rem', color: 'var(--tertiary-label)'}}>DIMENSIONS</strong><br/>{inj.dimensions || inj.Dimensions}</div>
                        <div><strong style={{fontSize: '0.75rem', color: 'var(--tertiary-label)'}}>DESCRIPTION</strong><br/>{inj.description || inj.Description}</div>
                      </div>
                      <button type="button" className="btn btn-secondary" onClick={() => removeUpdateInjury(i)} style={{ padding: '0.5rem' }}><X size={14} /></button>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                    <select className="form-select" value={updateInjury.type} onChange={e => setUpdateInjury({...updateInjury, type: e.target.value})}>
                      <option value="">Nature of bodily harm (Select type)</option>
                      <option value="Abrasion">Abrasion</option>
                      <option value="Contusion">Contusion</option>
                      <option value="Laceration">Laceration</option>
                      <option value="Stab">Stab</option>
                      <option value="Cut">Cut</option>
                      <option value="Fracture">Fracture</option>
                      <option value="Firearm inj.">Firearm inj.</option>
                      <option value="Burns">Burns</option>
                      <option value="Bite">Bite</option>
                      <option value="Dislocation/Subluxation">Dislocation/Subluxation</option>
                      <option value="Explosive inj.">Explosive inj.</option>
                      <option value="Internal Injuries">Internal Injuries</option>
                      <option value="Others">Others</option>
                    </select>
                    <input className="form-input" placeholder="Location (e.g. Left arm)" value={updateInjury.location} onChange={e => setUpdateInjury({...updateInjury, location: e.target.value})} />
                    <input className="form-input" placeholder="Dimensions (e.g. 5x2 cm)" value={updateInjury.dimensions} onChange={e => setUpdateInjury({...updateInjury, dimensions: e.target.value})} />
                    <input className="form-input" placeholder="Description" value={updateInjury.description} onChange={e => setUpdateInjury({...updateInjury, description: e.target.value})} />
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={addUpdateInjury} style={{ marginTop: '0.5rem', fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>Add Injury</button>
                </div>

                {/* Section 3: Intoxication */}
                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Intoxication (16-17)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Substance Tested For</label>
                      <select className="form-select" value={findingsForm.intoxication.substanceType} onChange={e => setFindingsForm({...findingsForm, intoxication: {...findingsForm.intoxication, substanceType: e.target.value}})}>
                        <option value="">Select...</option>
                        <option value="Alcohol">Alcohol (16)</option>
                        <option value="Drugs">Drugs (17)</option>
                      </select>
                    </div>
                  </div>
                  {findingsForm.intoxication.substanceType && (
                    <div className="form-row" style={{ gap: '2rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <input type="checkbox" checked={findingsForm.intoxication.consumed} onChange={e => setFindingsForm({...findingsForm, intoxication: {...findingsForm.intoxication, consumed: e.target.checked}})} /> 
                        {findingsForm.intoxication.substanceType === 'Alcohol' ? 'Breathing smelling (Consumed)' : 'Consumed'}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <input type="checkbox" checked={findingsForm.intoxication.underInfluence} onChange={e => setFindingsForm({...findingsForm, intoxication: {...findingsForm.intoxication, underInfluence: e.target.checked}})} /> Under Influence
                      </label>
                    </div>
                  )}
                </div>

                {/* Section 4: Sexual Assault */}
                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Sexual Assault Examination (18)</h3>
                  <div className="form-row" style={{ marginBottom: '1.25rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Brief history given by examinee (18.a)</label>
                      <textarea className="form-input" rows="2" value={findingsForm.sexualAssault.otherSigns} onChange={e => setFindingsForm({...findingsForm, sexualAssault: {...findingsForm.sexualAssault, otherSigns: e.target.value}})}></textarea>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Signs of vaginal / hymen penetration</label>
                      <select className="form-select" value={findingsForm.sexualAssault.hymenStatus} onChange={e => setFindingsForm({...findingsForm, sexualAssault: {...findingsForm.sexualAssault, hymenStatus: e.target.value}})}>
                        <option value="">Select...</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Signs of anal penetration</label>
                      <select className="form-select" value={findingsForm.sexualAssault.penetrationSigns} onChange={e => setFindingsForm({...findingsForm, sexualAssault: {...findingsForm.sexualAssault, penetrationSigns: e.target.value}})}>
                        <option value="">Select...</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 5: Medical Outcomes */}
                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Medical Outcomes (19-22)</h3>
                  <div className="form-row" style={{ marginBottom: '1.25rem' }}>
                    <div className="form-group"><label className="form-label">Investigations (19)</label><textarea className="form-input" rows="2" value={findingsForm.partB.investigations} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, investigations: e.target.value}})}></textarea></div>
                    <div className="form-group"><label className="form-label">Referrals (20)</label><textarea className="form-input" rows="2" value={findingsForm.partB.referrals} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, referrals: e.target.value}})}></textarea></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Other opinions / Recommendations (21)</label><textarea className="form-input" rows="2" value={findingsForm.partB.recommendations} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, recommendations: e.target.value}})}></textarea></div>
                    <div className="form-group"><label className="form-label">Remarks (22)</label><textarea className="form-input" rows="2" value={findingsForm.partB.remarks} onChange={e => setFindingsForm({...findingsForm, partB: {...findingsForm.partB, remarks: e.target.value}})}></textarea></div>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateFindings(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save MLEF Part II</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Clinical Case</h2>
              <button onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>MLEF Part A (1-8) - Issued by Police</h3>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Police Station (1)</label>
                    <select className="form-select" value={form.policeStationId} onChange={e => setForm({...form, policeStationId: e.target.value})}>
                      <option value="">Select police station</option>
                      {policeStations.map(p => <option key={p.AuthID} value={p.AuthID}>{p.Name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Date of Issue (2)</label>
                    <input type="date" className="form-input" value={form.dateOfIssue} onChange={e => setForm({...form, dateOfIssue: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">MLEF No. (3)</label>
                    <input className="form-input" value={form.mlefNo} onChange={e => setForm({...form, mlefNo: e.target.value})} placeholder="e.g. MLEF/2025/001" required />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Reason for referring for examination (7)</label>
                    <input className="form-input" value={form.reasonForExamination} onChange={e => setForm({...form, reasonForExamination: e.target.value})} placeholder="e.g. Assault, Traffic Accident" />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Issuing Officer Name (8)</label>
                    <input className="form-input" value={form.policeOfficerName} onChange={e => setForm({...form, policeOfficerName: e.target.value})} placeholder="e.g. Nimal Perera" />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Officer Rank</label>
                    <input className="form-input" value={form.policeOfficerRank} onChange={e => setForm({...form, policeOfficerRank: e.target.value})} placeholder="e.g. OIC" />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Reg No.</label>
                    <input className="form-input" value={form.policeOfficerRegNo} onChange={e => setForm({...form, policeOfficerRegNo: e.target.value})} placeholder="e.g. 54321" />
                  </div>
                </div>

                <div className="form-section">
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary-label)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>Hospital Admission Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Patient Examinee (4, 5, 6)</label>
                      <select className="form-select" value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} required>
                        <option value="">Select patient</option>
                        {patients.map(p => <option key={p.PersonID} value={p.PersonID}>{p.FirstName} {p.LastName} ({p.NIC})</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Assigned Doctor / JMO</label>
                      <select className="form-select" value={form.jmoStaffId} onChange={e => setForm({...form, jmoStaffId: e.target.value})} required>
                        <option value="">Select Doctor/JMO</option>
                        {staff.filter(s => s.RoleName === 'Doctor' || s.RoleName === 'JMO').map(s => <option key={s.StaffID} value={s.StaffID}>{s.FirstName} {s.LastName} ({s.RoleName})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Admission Date & Time</label>
                      <input type="datetime-local" className="form-input" value={form.admissionDate} onChange={e => setForm({...form, admissionDate: e.target.value})} />
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
                      <option value="MLEF Copy">MLEF Copy</option>
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
                <button type="submit" className="btn btn-primary">Create Case</button>
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

      {/* MLR PDF Form Modal */}
      {showPdfModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Generate MLR PDF</h2>
              <button onClick={() => setShowPdfModal(false)}><X size={14} /></button>
            </div>
            <form onSubmit={generateMLRPDF}>
              <div className="modal-body">
                <div className="form-section" style={{ margin: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Magistrate's Court</label>
                    <input type="text" className="form-input" value={pdfFormData.magistrateCourt} onChange={e => setPdfFormData({...pdfFormData, magistrateCourt: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Court Case No.</label>
                    <input type="text" className="form-input" value={pdfFormData.courtCaseNo} onChange={e => setPdfFormData({...pdfFormData, courtCaseNo: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Trial</label>
                    <input type="date" className="form-input" value={pdfFormData.dateOfTrial} onChange={e => setPdfFormData({...pdfFormData, dateOfTrial: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-soft" onClick={() => setShowPdfModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate PDF</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
