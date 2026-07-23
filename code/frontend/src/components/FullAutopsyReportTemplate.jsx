import React, { forwardRef } from 'react';

const FullAutopsyReportTemplate = forwardRef(({ report, caseDetail }, ref) => {
  if (!report || !caseDetail) return null;

  const causeOfDeath = caseDetail.causeOfDeath || {};
  const internalExam = caseDetail.internalExamination || {};
  const injuries = caseDetail.injuries || [];
  const inquestOrder = caseDetail.inquestOrder || null;
  const specimens = caseDetail.specimens || [];

  const pageStyle = {
    width: '210mm',
    padding: '15mm',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    boxSizing: 'border-box'
  };

  const SectionHeader = ({ title }) => (
    <div style={{ 
      backgroundColor: '#f3f4f6', 
      padding: '8px 12px', 
      fontWeight: 'bold', 
      fontSize: '12px', 
      color: '#1f2937',
      borderBottom: '2px solid #1f2937',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      marginTop: '20px',
      marginBottom: '10px'
    }}>
      {title}
    </div>
  );

  const cellStyle = { padding: '8px 12px', lineHeight: '1.5', fontSize: '11px', borderBottom: '1px solid #e5e7eb' };
  const labelStyle = { color: '#6b7280', display: 'block', fontSize: '9px', marginBottom: '2px', textTransform: 'uppercase' };
  const valueStyle = { color: '#111827', fontWeight: '600', fontSize: '12px' };

  return (
    <div ref={ref} style={pageStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '3px solid #111827', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '18px', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Post-Mortem Report</h1>
        <h2 style={{ fontSize: '14px', margin: '0', fontWeight: 'normal', color: '#4b5563' }}>Full Detailed Autopsy Examination</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div>
          <div style={cellStyle}><span style={labelStyle}>Inquest No / Case No</span><span style={valueStyle}>{inquestOrder ? inquestOrder.CaseNumber : 'N/A'}</span></div>
          <div style={cellStyle}><span style={labelStyle}>Name of Deceased</span><span style={valueStyle}>{caseDetail.DeceasedName}</span></div>
          <div style={cellStyle}><span style={labelStyle}>Date & Time of Death</span><span style={valueStyle}>{caseDetail.DateOfDeath ? new Date(caseDetail.DateOfDeath).toLocaleDateString() : 'N/A'} {caseDetail.TimeOfDeath || ''}</span></div>
          <div style={cellStyle}><span style={labelStyle}>Place of Death</span><span style={valueStyle}>{caseDetail.PlaceOfDeath || 'N/A'}</span></div>
        </div>
        <div>
          <div style={cellStyle}><span style={labelStyle}>PM Number</span><span style={valueStyle}>{caseDetail.PM_No}</span></div>
          <div style={cellStyle}><span style={labelStyle}>Age / Sex</span><span style={valueStyle}>{caseDetail.DateOfBirth ? Math.floor((new Date() - new Date(caseDetail.DateOfBirth)) / 31557600000) : 'N/A'} Yrs / {caseDetail.Gender}</span></div>
          <div style={cellStyle}><span style={labelStyle}>Medical Officer (JMO)</span><span style={valueStyle}>{caseDetail.JMOName}</span></div>
          <div style={cellStyle}><span style={labelStyle}>Inquirer / Magistrate</span><span style={valueStyle}>{inquestOrder ? inquestOrder.AuthorityName : 'N/A'}</span></div>
        </div>
      </div>

      <SectionHeader title="External Examination & Injuries" />
      {injuries.length === 0 ? (
        <div style={cellStyle}>No external injuries recorded.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb' }}>Type</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb' }}>Location</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb' }}>Dimensions</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {injuries.map((inj, i) => (
              <tr key={i}>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold' }}>{inj.Type}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{inj.Location}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{inj.Dimensions || 'N/A'}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{inj.Description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SectionHeader title="Internal Examination" />
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#374151' }}>15. Head</h4>
        <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderLeft: '3px solid #6b7280', fontSize: '11px', minHeight: '40px' }}>
          {internalExam.HeadDetails || 'No significant findings recorded.'}
        </div>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#374151' }}>17. Thorax</h4>
        <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderLeft: '3px solid #6b7280', fontSize: '11px', minHeight: '40px' }}>
          {internalExam.ThoraxDetails || 'No significant findings recorded.'}
        </div>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#374151' }}>18. Abdomen</h4>
        <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderLeft: '3px solid #6b7280', fontSize: '11px', minHeight: '40px' }}>
          {internalExam.AbdomenDetails || 'No significant findings recorded.'}
        </div>
      </div>

      <SectionHeader title="Laboratory Investigations" />
      {specimens.length === 0 ? (
        <div style={cellStyle}>No specimens retained for investigation.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb' }}>Specimen</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb' }}>Institution</th>
              <th style={{ padding: '8px', borderBottom: '2px solid #e5e7eb' }}>Results / Status</th>
            </tr>
          </thead>
          <tbody>
            {specimens.map((spec, i) => (
              <tr key={i}>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold' }}>{spec.SpecimenType}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>{spec.LabName || spec.StorageLocation}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                  {spec.ResultDetails ? (
                    <span>{spec.ResultDetails} <br/><span style={{ fontSize: '9px', color: '#6b7280' }}>Received: {new Date(spec.ReceivedDate).toLocaleDateString()}</span></span>
                  ) : (
                    <span style={{ color: '#d97706', fontStyle: 'italic' }}>{spec.LabStatus || 'Pending'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SectionHeader title="Cause of Death" />
      <div style={{ padding: '15px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', borderRadius: '4px' }}>
        <div style={{ display: 'flex', marginBottom: '8px' }}>
          <div style={{ width: '150px', fontWeight: 'bold', fontSize: '11px', color: '#4b5563' }}>Immediate Cause (1a):</div>
          <div style={{ flex: 1, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{causeOfDeath.ImmediateCause || 'Pending'}</div>
        </div>
        <div style={{ display: 'flex', marginBottom: '8px' }}>
          <div style={{ width: '150px', fontWeight: 'bold', fontSize: '11px', color: '#4b5563' }}>Antecedent (1b):</div>
          <div style={{ flex: 1, fontSize: '12px', textTransform: 'uppercase' }}>{causeOfDeath.AntecedentCause || '---'}</div>
        </div>
        <div style={{ display: 'flex', marginBottom: '8px' }}>
          <div style={{ width: '150px', fontWeight: 'bold', fontSize: '11px', color: '#4b5563' }}>Underlying (1c):</div>
          <div style={{ flex: 1, fontSize: '12px', textTransform: 'uppercase' }}>{causeOfDeath.UnderlyingCause || '---'}</div>
        </div>
        <div style={{ display: 'flex', marginBottom: '15px' }}>
          <div style={{ width: '150px', fontWeight: 'bold', fontSize: '11px', color: '#4b5563' }}>Contributory (II):</div>
          <div style={{ flex: 1, fontSize: '12px', textTransform: 'uppercase' }}>{causeOfDeath.ContributoryCause || '---'}</div>
        </div>
        
        {causeOfDeath.MaternalDeath && causeOfDeath.MaternalDeath !== 'None' && (
          <div style={{ marginBottom: '10px', fontSize: '11px', color: '#dc2626', fontWeight: 'bold' }}>
            * Maternal Death: Yes ({causeOfDeath.MaternalDeath})
          </div>
        )}
        
        {causeOfDeath.Comments && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #d1d5db', fontSize: '11px' }}>
            <span style={{ fontWeight: 'bold', color: '#4b5563' }}>Comments & Opinions: </span>
            {causeOfDeath.Comments}
          </div>
        )}
      </div>

      {/* Signature Block */}
      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', width: '220px' }}>
          <div style={{ borderBottom: '1px solid #111827', height: '40px', marginBottom: '5px' }}></div>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{caseDetail.JMOName}</div>
          <div style={{ fontSize: '10px', color: '#4b5563' }}>Judicial Medical Officer</div>
          <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '3px' }}>Signature & Official Stamp</div>
        </div>
      </div>
      
    </div>
  );
});

export default FullAutopsyReportTemplate;
