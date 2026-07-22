import React, { useEffect, useState, useRef } from 'react';
import { FileText, Plus, X, Scale } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import MLRTemplate from '../components/MLRTemplate';
import api from '../api';

export default function CourtReports() {
  const [reports, setReports] = useState([]);
  const [summons, setSummons] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Issue Report Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ caseId: '', reportType: '', signedByStaffId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [casesList, setCasesList] = useState([]);

  // Log Summons Modal State
  const [showSummonsModal, setShowSummonsModal] = useState(false);
  const [summonsFormData, setSummonsFormData] = useState({ caseNo: '', internalCaseRef: '', authorityId: '', staffId: '', requiredDate: '' });
  const [isSummonsSubmitting, setIsSummonsSubmitting] = useState(false);

  // PDF Generation State
  const mlrRef = useRef(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFormData, setPdfFormData] = useState({ magistrateCourt: '', courtCaseNo: '', dateOfTrial: '', dateOfDispatch: new Date().toISOString().split('T')[0] });
  const [reportToGenerate, setReportToGenerate] = useState(null);
  
  const [selectedReport, setSelectedReport] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const load = async () => {
    try {
      const [r, s, st, auth, cCases, aCases] = await Promise.all([
        api.getReports(), 
        api.getSummons(), 
        api.getStaff(),
        api.getAuthorities(),
        api.getClinicalCases(),
        api.getAutopsyCases()
      ]);
      setReports(r.sort((a,b) => b.ReportID - a.ReportID)); 
      setSummons(s);
      setStaffList(st);
      
      const courts = auth.filter(a => a.Type === 'Court');
      setAuthorities(courts);
      
      const combinedCases = [
        ...cCases.map(c => ({ id: c.ClinicalCaseID, label: `${c.MLEF_No} - ${c.PatientName} (Clinical)`, type: 'MLR', caseRef: c.MLEF_No })),
        ...aCases.map(a => ({ id: a.AutopsyCaseID, label: `${a.PM_No} - ${a.DeceasedName} (Autopsy)`, type: 'PMR', caseRef: a.PM_No }))
      ].sort((a, b) => b.id - a.id);
      
      setCasesList(combinedCases);

      if (st.length > 0) {
        setFormData(prev => ({ ...prev, signedByStaffId: st[0].StaffID, caseId: '', reportType: '' }));
      }
      if (st.length > 0 && courts.length > 0) {
        setSummonsFormData({ caseNo: '', internalCaseRef: '', authorityId: courts[0].AuthID, staffId: st[0].StaffID, requiredDate: '' });
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGeneratePDFClick = (r) => {
    if (r.ReportType === 'MLR') {
      setReportToGenerate(r);
      setShowPdfModal(true);
    } else {
      executePdfGeneration(r);
    }
  };

  const handlePdfModalSubmit = (e) => {
    e.preventDefault();
    setShowPdfModal(false);
    executePdfGeneration(reportToGenerate);
  };

  const executePdfGeneration = async (r) => {
    if (r.ReportType === 'MLR') {
      setIsGeneratingPDF(true);
      try {
        const detail = await api.getClinicalCase(r.CaseID);
        setSelectedReport(r);
        setCaseDetail(detail);
        
        // Wait for DOM to render the template
        setTimeout(async () => {
          try {
            if (mlrRef.current) {
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
              
              pdf.save(`${r.ReportType}_Report_${detail.PatientName ? detail.PatientName.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown'}_${r.CaseID}.pdf`);
            }
          } catch (e) {
            console.error('Canvas error:', e);
          } finally {
            setIsGeneratingPDF(false);
            setSelectedReport(null);
            setCaseDetail(null);
          }
        }, 300);
      } catch (err) {
        console.error('Failed to generate MLR:', err);
        setIsGeneratingPDF(false);
      }
      return;
    }

    // Fallback for PMR (Post-Mortem Report)
    const doc = new jsPDF();
    const isMLR = r.ReportType === 'MLR';
    
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('POST-MORTEM REPORT (PMR)', 105, 30, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text(`Report ID: RPT-${r.ReportID}`, 20, 45);
    doc.text(`Related Case ID: ${r.CaseID}`, 20, 52);
    doc.text(`Issue Date: ${new Date(r.IssueDate).toLocaleDateString()}`, 130, 45);
    doc.text(`Department: Forensic Medicine`, 130, 52);
    
    doc.setFont('times', 'bold');
    doc.text('1. SUBJECT DETAILS', 20, 70);
    doc.setFont('times', 'normal');
    doc.text(`Please refer to Case ID ${r.CaseID} for full subject demographics as recorded`, 25, 80);
    doc.text('in the system.', 25, 87);
    
    doc.setFont('times', 'bold');
    doc.text('2. EXAMINATION FINDINGS', 20, 105);
    doc.setFont('times', 'normal');
    const splitText = doc.splitTextToSize(`This report certifies that the subject associated with Case ID ${r.CaseID} was examined by the undersigned medical officer. Detailed records of injuries, biological specimens, and external/internal examinations are attached in the full forensic docket. Note to Judiciary: Laboratory findings associated with this case (if any) have been appended to the final case file.`, 165);
    doc.text(splitText, 25, 115);
    
    doc.setFont('times', 'bold');
    doc.text('3. CONCLUSION', 20, 150);
    doc.setFont('times', 'normal');
    const splitText2 = doc.splitTextToSize('This document serves as the official medical summary for court proceedings. Further inquiries should be directed to the Department of Forensic Medicine, Teaching Hospital Peradeniya.', 165);
    doc.text(splitText2, 25, 160);
    
    doc.text(`Generated By: Forensic Medical System`, 20, 250);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 20, 257);
    
    doc.setLineWidth(0.3);
    doc.line(130, 250, 190, 250);
    doc.setFont('times', 'bold');
    doc.text(`${r.SignedBy}`, 160, 255, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.text('Judicial Medical Officer', 160, 260, { align: 'center' });
    
    doc.save(`${r.ReportType}_Report_${r.CaseID}.pdf`);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createReport({
        caseId: parseInt(formData.caseId),
        reportType: formData.reportType,
        signedByStaffId: parseInt(formData.signedByStaffId)
      });
      setShowModal(false);
      await load(); 
    } catch (err) {
      alert(err.message || 'Failed to issue report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSummonsSubmit = async (e) => {
    e.preventDefault();
    setIsSummonsSubmitting(true);
    try {
      const finalCaseNo = summonsFormData.caseNo + (summonsFormData.internalCaseRef ? ` [${summonsFormData.internalCaseRef}]` : '');
      await api.createSummons({
        caseNo: finalCaseNo,
        authorityId: parseInt(summonsFormData.authorityId),
        staffId: parseInt(summonsFormData.staffId),
        requiredDate: summonsFormData.requiredDate
      });
      setShowSummonsModal(false);
      await load();
    } catch (err) {
      alert(err.message || 'Failed to log summons');
    } finally {
      setIsSummonsSubmitting(false);
    }
  };

  const handleSummonsStatusChange = async (id, newStatus) => {
    try {
      await api.updateSummonsStatus(id, newStatus);
      await load(); // Reload to reflect changes
    } catch (err) {
      alert(err.message || 'Failed to update summons status');
    }
  };

  const handleCaseChange = (e) => {
    const selectedId = e.target.value;
    const selectedCase = casesList.find(c => c.id.toString() === selectedId);
    if(selectedCase) {
      setFormData({...formData, caseId: selectedId, reportType: selectedCase.type});
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Loading court data...</div>;

  return (
    <div className="animate-in">
      {/* Hidden MLR Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <MLRTemplate ref={mlrRef} report={selectedReport} caseDetail={caseDetail} extraDetails={pdfFormData} />
      </div>

      <div className="section-header">
        <div><h1>Court Reports</h1><p>Medico-legal reports and court summons</p></div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowSummonsModal(true)}>
            <Scale size={18} /> Log Summons
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Issue Report
          </button>
        </div>
      </div>

      <div className="card table-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem 0' }}><h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Reports Issued</h2></div>
        <table>
          <thead><tr><th>Report ID</th><th>Type</th><th>Case No</th><th>Issued</th><th>Signed By</th><th>Action</th></tr></thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No reports issued yet.</td></tr>
            ) : reports.map(r => (
              <tr key={r.ReportID}>
                <td>RPT-{r.ReportID}</td>
                <td>{r.ReportType}</td>
                <td>{r.CaseNo || r.CaseID}</td>
                <td>{r.IssueDate ? new Date(r.IssueDate).toLocaleDateString() : 'N/A'}</td>
                <td>{r.SignedBy}</td>
                <td>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleGeneratePDFClick(r)}
                          disabled={isGeneratingPDF}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <FileText size={14} /> Generate PDF
                        </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card table-card">
        <div style={{ padding: '1rem 1.25rem 0' }}><h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Court Summons</h2></div>
        <table>
          <thead><tr><th>Case No</th><th>Court</th><th>Staff</th><th>Required Date</th><th>Status</th></tr></thead>
          <tbody>
            {summons.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No summons recorded.</td></tr>
            ) : summons.map(s => (
              <tr key={s.SummonsID}>
                <td>{s.CaseNo}</td>
                <td>{s.CourtName}</td>
                <td>{s.StaffName}</td>
                <td>{s.RequiredDate ? new Date(s.RequiredDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <select 
                    className={`form-select ${s.Status === 'Pending' ? 'text-warning' : s.Status === 'Attended' ? 'text-success' : 'text-danger'}`}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', width: 'auto', display: 'inline-block' }}
                    value={s.Status}
                    onChange={(e) => handleSummonsStatusChange(s.SummonsID, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Attended">Attended</option>
                    <option value="Dismissed">Dismissed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Issue Court Report</h2>
              <button onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleIssueSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label className="form-label">Select Case *</label>
                    <select className="form-select" required value={formData.caseId} onChange={handleCaseChange}>
                      <option value="" disabled>-- Select a Case --</option>
                      {casesList.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Report Type</label>
                    <input type="text" className="form-input" disabled value={formData.reportType === 'MLR' ? 'Medico-Legal Report (MLR)' : formData.reportType === 'PMR' ? 'Post-Mortem Report (PMR)' : ''} placeholder="Auto-inferred from case selection" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Signed By *</label>
                    <select className="form-select" required value={formData.signedByStaffId} onChange={e => setFormData({...formData, signedByStaffId: e.target.value})} disabled={!formData.caseId}>
                      {staffList.map(s => (
                        <option key={s.StaffID} value={s.StaffID}>{s.FirstName} {s.LastName} ({s.Designation})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !formData.caseId}>
                  {isSubmitting ? 'Issuing...' : 'Issue Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSummonsModal && (
        <div className="modal-overlay" onClick={() => setShowSummonsModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Court Summons</h2>
              <button onClick={() => setShowSummonsModal(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleSummonsSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label className="form-label">Related Internal Case (Optional)</label>
                    <select className="form-select" value={summonsFormData.internalCaseRef} onChange={e => setSummonsFormData({...summonsFormData, internalCaseRef: e.target.value})}>
                      <option value="">-- None --</option>
                      {casesList.map(c => (
                        <option key={c.id} value={c.caseRef}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Court's Case Number *</label>
                    <input type="text" className="form-input" required placeholder="e.g. HC/KDY/2025/0089" value={summonsFormData.caseNo} onChange={e => setSummonsFormData({...summonsFormData, caseNo: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Court *</label>
                    <select className="form-select" required value={summonsFormData.authorityId} onChange={e => setSummonsFormData({...summonsFormData, authorityId: e.target.value})}>
                      {authorities.map(a => (
                        <option key={a.AuthID} value={a.AuthID}>{a.Name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Summoned Staff *</label>
                    <select className="form-select" required value={summonsFormData.staffId} onChange={e => setSummonsFormData({...summonsFormData, staffId: e.target.value})}>
                      {staffList.map(s => (
                        <option key={s.StaffID} value={s.StaffID}>{s.FirstName} {s.LastName} ({s.Designation})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Required Date *</label>
                    <input type="date" className="form-input" required value={summonsFormData.requiredDate} onChange={e => setSummonsFormData({...summonsFormData, requiredDate: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSummonsModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSummonsSubmitting}>
                  {isSummonsSubmitting ? 'Logging...' : 'Log Summons'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Details Modal */}
      {showPdfModal && (
        <div className="modal-overlay" onClick={() => setShowPdfModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>PDF Report Details</h2>
              <button onClick={() => setShowPdfModal(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handlePdfModalSubmit}>
              <div className="modal-body">
                <div className="form-section">
                  <div className="form-group">
                    <label className="form-label">Magistrate's Court (Optional)</label>
                    <input type="text" className="form-input" value={pdfFormData.magistrateCourt} onChange={e => setPdfFormData({...pdfFormData, magistrateCourt: e.target.value})} placeholder="e.g. Peradeniya" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Court Case No. (Optional)</label>
                    <input type="text" className="form-input" value={pdfFormData.courtCaseNo} onChange={e => setPdfFormData({...pdfFormData, courtCaseNo: e.target.value})} placeholder="e.g. MC/123/2023" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Trial (Optional)</label>
                    <input type="date" className="form-input" value={pdfFormData.dateOfTrial} onChange={e => setPdfFormData({...pdfFormData, dateOfTrial: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Despatch</label>
                    <input type="date" className="form-input" value={pdfFormData.dateOfDispatch} onChange={e => setPdfFormData({...pdfFormData, dateOfDispatch: e.target.value})} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPdfModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isGeneratingPDF}>
                  {isGeneratingPDF ? 'Generating...' : 'Confirm & Download'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
