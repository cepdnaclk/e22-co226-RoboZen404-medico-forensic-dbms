import React, { forwardRef } from 'react';

const PMRTemplate = forwardRef(({ report, caseDetail, extraDetails }, ref) => {
  if (!report || !caseDetail) return null;

  const causeOfDeath = caseDetail.causeOfDeath || {
    ImmediateCause: '',
    AntecedentCause: '',
    UnderlyingCause: '',
    ContributoryCause: '',
    MaternalDeath: 'None',
    Comments: ''
  };

  const inquestOrder = caseDetail.inquestOrder || null;

  const pageStyle = {
    width: '210mm',
    minHeight: '297mm',
    padding: '12mm 15mm',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
    position: 'relative'
  };

  const SectionHeader = ({ title }) => (
    <div style={{
      backgroundColor: '#f3f4f6',
      padding: '8px 12px',
      fontWeight: 'bold',
      fontSize: '12px',
      color: '#1f2937',
      borderBottom: '1.5px solid #1f2937',
      letterSpacing: '0.5px',
      textTransform: 'uppercase'
    }}>
      {title}
    </div>
  );

  const cellStyle = {
    padding: '8px 12px',
    lineHeight: '1.5',
    fontSize: '11px',
    minWidth: 0,
    wordWrap: 'break-word',
    overflowWrap: 'break-word'
  };

  const borderRight = { borderRight: '1.5px solid #e5e7eb' };
  const borderBottom = { borderBottom: '1.5px solid #e5e7eb' };
  const labelStyle = { color: '#6b7280', display: 'block', fontSize: '9px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'normal' };
  const valueStyle = { color: '#111827', fontWeight: '600', fontSize: '12px', whiteSpace: 'normal', wordWrap: 'break-word' };

  return (
    <div ref={ref} style={pageStyle}>

      {/* Document Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #111827', paddingBottom: '15px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', position: 'absolute', right: '15mm', top: '15mm' }}>Health 14</div>
        <h1 style={{ fontSize: '18px', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>POST-MORTEM REPORT</h1>
        <h2 style={{ fontSize: '12px', margin: '0', fontWeight: 'normal', color: '#4b5563' }}>(Cover Page & Cause of Death)</h2>
      </div>

      {/* Cover Page Details */}
      <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
        <SectionHeader title="Cover Page Details" />

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
            <span style={labelStyle}>Inquest No.</span>
            <span style={valueStyle}>{inquestOrder ? inquestOrder.CaseNumber : 'N/A'}</span>
          </div>
          <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
            <span style={labelStyle}>Place</span>
            <span style={valueStyle}>{caseDetail.PlaceOfDeath || 'N/A'}</span>
          </div>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>Courts</span>
            <span style={valueStyle}>{inquestOrder?.AuthorityType === 'Court' ? 'Magistrate Court' : (inquestOrder?.AuthorityType || 'N/A')}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
            <span style={labelStyle}>Date</span>
            <span style={valueStyle}>{new Date().toLocaleDateString()}</span>
          </div>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>Case No.</span>
            <span style={valueStyle}>{caseDetail.PM_No}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>Name of Deceased Person</span>
            <span style={valueStyle}>{caseDetail.DeceasedName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>Date and time of Death, (if known)</span>
            <span style={valueStyle}>
              {caseDetail.DateOfDeath ? new Date(caseDetail.DateOfDeath).toLocaleDateString() : 'N/A'}
              {caseDetail.TimeOfDeath ? ` at ${caseDetail.TimeOfDeath}` : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>Name of Medical Officer who conducted the Post-Mortem Examination</span>
            <span style={valueStyle}>{caseDetail.JMOName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>Date and time of Post-Mortem Examination</span>
            <span style={valueStyle}>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>Name and designation of the person who requested the Post-Mortem Examination</span>
            <span style={valueStyle}>
              {inquestOrder ? `${inquestOrder.AuthorityName} (${inquestOrder.AuthorityType})` : 'N/A'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
            <span style={labelStyle}>District</span>
            <span style={valueStyle}>Kandy</span>
          </div>
          <div style={{ flex: 2, ...cellStyle }}>
            <span style={labelStyle}>Place of Examination</span>
            <span style={valueStyle}>Teaching Hospital Peradeniya</span>
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, ...cellStyle, minHeight: '60px' }}>
            <span style={labelStyle}>Names and Addresses of persons who identified the body</span>
            <span style={valueStyle}>{caseDetail.IdentifiedBy || ''}</span>
          </div>
        </div>
      </div>

      {/* Cause of Death */}
      <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
        <SectionHeader title="Cause of Death" />

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ width: '150px', ...borderRight, ...cellStyle, backgroundColor: '#f9fafb' }}>
            <span style={labelStyle}>Immediate Cause</span>
            <span style={valueStyle}>1a.</span>
          </div>
          <div style={{ flex: 1, ...cellStyle, textTransform: 'uppercase' }}>
            <span style={valueStyle}>{causeOfDeath.ImmediateCause || 'Pending'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ width: '150px', ...borderRight, ...cellStyle, backgroundColor: '#f9fafb' }}>
            <span style={labelStyle}>Antecedent Cause</span>
            <span style={valueStyle}>1b.</span>
          </div>
          <div style={{ flex: 1, ...cellStyle, textTransform: 'uppercase' }}>
            <span style={valueStyle}>{causeOfDeath.AntecedentCause || '---'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ width: '150px', ...borderRight, ...cellStyle, backgroundColor: '#f9fafb' }}>
            <span style={labelStyle}>Underlying Cause</span>
            <span style={valueStyle}>1c.</span>
          </div>
          <div style={{ flex: 1, ...cellStyle, textTransform: 'uppercase' }}>
            <span style={valueStyle}>{causeOfDeath.UnderlyingCause || '---'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ width: '150px', ...borderRight, ...cellStyle, backgroundColor: '#f9fafb' }}>
            <span style={labelStyle}>Contributory Causes</span>
            <span style={valueStyle}>II.</span>
          </div>
          <div style={{ flex: 1, ...cellStyle, textTransform: 'uppercase' }}>
            <span style={valueStyle}>{causeOfDeath.ContributoryCause || '---'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
            <span style={labelStyle}>Maternal Death</span>
            <span style={valueStyle}>{causeOfDeath.MaternalDeath && causeOfDeath.MaternalDeath !== 'None' ? causeOfDeath.MaternalDeath : 'No'}</span>
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, ...cellStyle, minHeight: '60px' }}>
            <span style={labelStyle}>Comments & Opinions</span>
            <span style={valueStyle}>{causeOfDeath.Comments || 'No additional comments.'}</span>
          </div>
        </div>
      </div>

      {/* Footer / Signature Block */}
      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', width: '220px' }}>
          <div style={{ borderBottom: '1.5px solid #111827', height: '40px', marginBottom: '8px' }}></div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827' }}>{caseDetail.JMOName}</div>
          <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>Judicial Medical Officer</div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '15mm',
        left: '15mm',
        right: '15mm',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '8px',
        fontSize: '10px',
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Generated by Medi-Triage Forensic DBMS</span>
        <span>Case Ref: {caseDetail.PM_No}</span>
      </div>
    </div>
  );
});

export default PMRTemplate;
