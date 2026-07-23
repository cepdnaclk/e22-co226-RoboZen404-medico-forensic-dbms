import React, { forwardRef } from 'react';

const MLRTemplate = forwardRef(({ report, caseDetail, extraDetails }, ref) => {
  if (!report || !caseDetail) return null;

  const partB = caseDetail.partB || {};

  const intoxicationRecords = caseDetail.intoxicationRecords || [];

  const injuries = caseDetail.injuries || [];

  const pageStyle = {
    width: '210mm',
    minHeight: '297mm',
    padding: '10mm',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    boxSizing: 'border-box',
    position: 'relative'
  };

  const SectionHeader = ({ title }) => (
    <div style={{
      backgroundColor: '#f3f4f6',
      padding: '6px 10px',
      fontWeight: 'bold',
      fontSize: '11px',
      color: '#1f2937',
      borderBottom: '1.5px solid #1f2937',
      letterSpacing: '0.5px'
    }}>
      {title}
    </div>
  );

  const cellStyle = {
    padding: '6px 10px',
    lineHeight: '1.4',
    fontSize: '11px'
  };

  const borderRight = { borderRight: '1.5px solid #e5e7eb' };
  const borderBottom = { borderBottom: '1.5px solid #e5e7eb' };
  const labelStyle = { color: '#6b7280', display: 'block', fontSize: '9px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const valueStyle = { color: '#111827', fontWeight: '600', fontSize: '11px' };

  const Field = ({ label, value }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '6px 0', alignItems: 'center' }}>
      <div style={{ width: '250px', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ flex: 1, fontSize: '11px', fontWeight: '600', color: '#111827' }}>{value || <span style={{ color: '#d1d5db' }}>..........................................</span>}</div>
    </div>
  );

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f0f0f0' }}>
      {/* PAGE 1 */}
      <div style={pageStyle}>
        <div style={{ position: 'absolute', top: '10mm', right: '10mm', textAlign: 'right', fontSize: '9px', color: '#9ca3af' }}>
          Health 1135<br />(F*S., T. & E.) 04/ 76
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px', marginTop: '10px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 4px 0', color: '#111827', fontWeight: '800', letterSpacing: '-0.5px' }}>
            MEDICO-LEGAL REPORT
          </h2>
          <p style={{ fontSize: '9px', color: '#6b7280', fontStyle: 'italic', margin: 0 }}>
            (Diagrammatic Form 1135 A may be used to illustrate injuries and inserted into this report when necessary)
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ width: '48%' }}>
            <Field label="Serial No." value={report.ReportID} />
            <Field label="Magistrate's Court" value={extraDetails?.magistrateCourt} />
            <Field label="Case No." value={extraDetails?.courtCaseNo} />
            <Field label="Date of Trial" value={extraDetails?.dateOfTrial} />
          </div>
          <div style={{ width: '48%' }}>
            <Field label="Medico-Legal Form No." value={caseDetail.MLEF_No} />
            <Field label="Date of Issue" value={new Date(report.IssueDate).toLocaleDateString()} />
            <Field label="Police Station" value={caseDetail.PoliceStationName} />
          </div>
        </div>

        <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
          <SectionHeader title="A. IDENTIFICATION" />

          <div style={{ ...cellStyle, ...borderBottom }}>
            <span style={labelStyle}>Full Name</span>
            <span style={valueStyle}>{caseDetail.PatientName}</span>
          </div>

          <div style={{ display: 'flex', ...borderBottom }}>
            <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
              <span style={labelStyle}>Age</span>
              <span style={valueStyle}>{new Date().getFullYear() - new Date(caseDetail.DOB).getFullYear()} Years</span>
            </div>
            <div style={{ flex: 1, ...cellStyle }}>
              <span style={labelStyle}>Gender</span>
              <span style={valueStyle}>{caseDetail.Gender}</span>
            </div>
          </div>

          <div style={{ ...cellStyle, ...borderBottom }}>
            <span style={labelStyle}>Address</span>
            <span style={valueStyle}>{caseDetail.Address}</span>
          </div>

          <div style={{ display: 'flex', ...borderBottom }}>
            <div style={{ flex: 2, ...cellStyle, ...borderRight }}>
              <span style={labelStyle}>Place of Examination</span>
              <span style={valueStyle}>{partB?.ExaminationPlace}</span>
            </div>
            <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
              <span style={labelStyle}>Date</span>
              <span style={valueStyle}>{partB?.ExaminationDate ? new Date(partB.ExaminationDate).toLocaleDateString() : ''}</span>
            </div>
            <div style={{ flex: 1, ...cellStyle }}>
              <span style={labelStyle}>Time</span>
              <span style={valueStyle}>{partB?.ExaminationDate ? new Date(partB.ExaminationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
          </div>

          <div style={{ display: 'flex', ...borderBottom }}>
            <div style={{ flex: 2, ...cellStyle, ...borderRight }}>
              <span style={labelStyle}>Date of Admission to Hospital</span>
              <span style={valueStyle}>{caseDetail.AdmissionDate ? new Date(caseDetail.AdmissionDate).toLocaleDateString() : ''}</span>
            </div>
            <div style={{ flex: 1, ...cellStyle }}>
              <span style={labelStyle}>Time</span>
              <span style={valueStyle}>{caseDetail.AdmissionDate ? new Date(caseDetail.AdmissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
          </div>

          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
              <span style={labelStyle}>Date of Discharge</span>
              <span style={valueStyle}>{partB?.DischargeDate ? new Date(partB.DischargeDate).toLocaleDateString() : ''}</span>
            </div>
            <div style={{ flex: 1, ...cellStyle }}>
              <span style={labelStyle}>Bed Head Ticket No.</span>
              <span style={valueStyle}>{caseDetail.BHT_No || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden' }}>
          <SectionHeader title="B. SHORT HISTORY GIVEN BY PATIENT" />
          <div style={{ padding: '10px 12px', minHeight: '60px', fontSize: '11px', color: '#111827', lineHeight: '1.6' }}>
            {caseDetail.ReasonForExamination}
          </div>
        </div>
      </div>

      {/* PAGE 2 */}
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '10px', color: '#6b7280', fontWeight: 'bold' }}>— PAGE 2 —</div>

        <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
          <SectionHeader title="C. INJURIES" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1.5px solid #e5e7eb' }}>
                <th style={{ padding: '8px', width: '10%', textAlign: 'center', fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>No.</th>
                <th style={{ padding: '8px', width: '90%', textAlign: 'left', fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Nature, size, shape, disposition and site of injury</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i} style={{ borderBottom: i === 9 ? 'none' : '1px solid #e5e7eb', height: '35px' }}>
                  <td style={{ padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#4b5563', ...borderRight }}>{i < injuries.length ? i + 1 : ''}</td>
                  <td style={{ padding: '6px 10px', fontSize: '11px', color: '#111827' }}>
                    {i < injuries.length ? `${injuries[i].Type} measuring ${injuries[i].Dimensions} located at ${injuries[i].Location}. ${injuries[i].Description}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
          <SectionHeader title="SPECIAL INVESTIGATIONS (X-RAY ETC.)" />
          <div style={{ padding: '10px 12px', minHeight: '40px', fontSize: '11px', color: '#111827' }}>
            {partB?.Investigations || <span style={{ color: '#d1d5db' }}>..........................................</span>}
          </div>
        </div>

        <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden' }}>
          <SectionHeader title="D. OPINION" />

          <div style={{ display: 'flex', ...borderBottom, padding: '8px 12px', alignItems: 'center' }}>
            <div style={{ width: '250px', fontSize: '10px', color: '#4b5563', fontWeight: 'bold' }}>1. Non-grievous injuries (Nos.)</div>
            <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>
              {partB?.CategoryOfHurt === 'Non-grievous' ? injuries.map((_, i) => i + 1).join(', ') : 'None'}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1.5px solid #e5e7eb' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px', width: '33%', textAlign: 'left', fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', ...borderRight }}>2. Grievous injuries (Nos.)</th>
                <th style={{ padding: '8px', width: '33%', textAlign: 'center', fontSize: '9px', color: '#6b7280', textTransform: 'uppercase', ...borderRight }}>Limb under section 311 of Penal Code</th>
                <th style={{ padding: '8px', width: '33%', textAlign: 'center', fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Explanatory remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ height: '40px' }}>
                <td style={{ padding: '8px', ...borderRight, fontSize: '11px', fontWeight: 'bold' }}>{partB?.CategoryOfHurt === 'Grievous' ? injuries.map((_, i) => i + 1).join(', ') : ''}</td>
                <td style={{ padding: '8px', ...borderRight }}></td>
                <td style={{ padding: '8px' }}></td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', padding: '8px 12px', alignItems: 'center' }}>
            <div style={{ width: '400px', fontSize: '10px', color: '#4b5563', fontWeight: 'bold' }}>3. Injuries sufficient in the ordinary course of nature to cause death (Nos.)</div>
            <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>
              {partB?.CategoryOfHurt === 'Fatal' || partB?.EndangersLife === 1 ? injuries.map((_, i) => i + 1).join(', ') : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 3 */}
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '10px', color: '#6b7280', fontWeight: 'bold' }}>— PAGE 3 —</div>

        <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
          <SectionHeader title="4. INJURIES CAUSED BY" />

          <div style={{ display: 'flex', ...borderBottom, padding: '8px 12px' }}>
            <div style={{ width: '250px', fontSize: '11px', color: '#4b5563', fontWeight: 'bold' }}>(a) Blunt Weapon—Nos.</div>
            <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>{partB?.CausativeWeapon === 'Blunt' ? injuries.map((_, i) => i + 1).join(', ') : ''}</div>
          </div>

          <div style={{ ...borderBottom, padding: '8px 12px' }}>
            <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: 'bold', marginBottom: '8px' }}>(b) Sharp cutting instrument—</div>
            <div style={{ display: 'flex', paddingLeft: '20px', marginBottom: '4px' }}>
              <div style={{ width: '150px', fontSize: '11px', color: '#6b7280' }}>Cut—Nos.</div>
              <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>{injuries.map((inj, i) => inj.Type === 'Cut' ? i + 1 : null).filter(Boolean).join(', ')}</div>
            </div>
            <div style={{ display: 'flex', paddingLeft: '20px' }}>
              <div style={{ width: '150px', fontSize: '11px', color: '#6b7280' }}>Stab—Nos.</div>
              <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>{injuries.map((inj, i) => inj.Type === 'Stab' ? i + 1 : null).filter(Boolean).join(', ')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', ...borderBottom, padding: '8px 12px' }}>
            <div style={{ width: '250px', fontSize: '11px', color: '#4b5563', fontWeight: 'bold' }}>(c) Firearms—Nos.</div>
            <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>{injuries.map((inj, i) => inj.Type === 'Firearm' || inj.Type === 'Firearm inj.' ? i + 1 : null).filter(Boolean).join(', ')}</div>
          </div>

          <div style={{ display: 'flex', ...borderBottom, padding: '8px 12px' }}>
            <div style={{ width: '250px', fontSize: '11px', color: '#4b5563', fontWeight: 'bold' }}>(d) Burns—Nos.</div>
            <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>{injuries.map((inj, i) => inj.Type === 'Burns' ? i + 1 : null).filter(Boolean).join(', ')}</div>
          </div>

          <div style={{ display: 'flex', padding: '8px 12px' }}>
            <div style={{ width: '250px', fontSize: '11px', color: '#4b5563', fontWeight: 'bold' }}>(e) Bite marks—Nos.</div>
            <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>{injuries.map((inj, i) => inj.Type === 'Bite' ? i + 1 : null).filter(Boolean).join(', ')}</div>
          </div>
        </div>

        <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
          <SectionHeader title="FURTHER NOTICES" />
          <div style={{ padding: '8px 12px', fontSize: '9px', color: '#6b7280', fontStyle: 'italic', borderBottom: '1px solid #e5e7eb' }}>
            (Consider self-inflictions, caused by friendly hand suggestive of fall and whether injuries are compatible with history given by injured.)
          </div>
          <div style={{ padding: '10px 12px', minHeight: '50px', fontSize: '11px', color: '#111827', lineHeight: '1.6' }}>
            {partB?.Remarks}
          </div>
        </div>

        <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden', marginBottom: '30px' }}>
          <div style={{ display: 'flex', ...borderBottom, padding: '8px 12px', alignItems: 'center' }}>
            <div style={{ width: '250px', fontSize: '10px', color: '#4b5563', fontWeight: 'bold', textTransform: 'uppercase' }}>5. Patient smelling of liquor</div>
            <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>{intoxicationRecords?.some(r => r.SubstanceType === 'Alcohol') ? 'Yes' : 'No'}</div>
          </div>
          <div style={{ display: 'flex', padding: '8px 12px', alignItems: 'center' }}>
            <div style={{ width: '250px', fontSize: '10px', color: '#4b5563', fontWeight: 'bold', textTransform: 'uppercase' }}>Under influence of liquor</div>
            <div style={{ flex: 1, fontSize: '11px', fontWeight: '600' }}>{intoxicationRecords?.some(r => r.SubstanceType === 'Alcohol' && r.UnderInfluence) ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '20px' }}>
          <div style={{ flex: 1 }}>
            <Field label="Name of Medical Officer" value={report.SignedBy} />
            <Field label="Designation" value="Judicial Medical Officer" />
            <Field label="Station" value="Teaching Hospital Peradeniya" />
            <Field label="Date of despatch" value={extraDetails?.dateOfDispatch} />
          </div>
          <div style={{ width: '250px', marginLeft: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ borderBottom: '1px solid #111827', width: '100%', marginBottom: '6px' }}></div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Signature of Medical Officer</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MLRTemplate;
