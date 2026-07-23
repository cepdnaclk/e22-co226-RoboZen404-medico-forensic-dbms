import React, { forwardRef } from 'react';

const MLEFTemplate = forwardRef(({ caseDetail }, ref) => {
  if (!caseDetail) return null;

  const { partB, sexualAssault, intoxicationRecords } = caseDetail;

  // Premium Checkbox Component
  const Checkbox = ({ checked, label }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', marginRight: '12px', marginBottom: '4px' }}>
      <div style={{
        width: '12px',
        height: '12px',
        border: '1.5px solid #333',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '6px',
        borderRadius: '2px',
        backgroundColor: checked ? '#333' : 'transparent',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 'bold'
      }}>
        {checked ? '✓' : ''}
      </div>
      <span style={{ fontSize: '10px', color: '#111' }}>{label}</span>
    </div>
  );

  const SectionHeader = ({ title }) => (
    <div style={{
      backgroundColor: '#f3f4f6',
      padding: '6px 10px',
      textAlign: 'center',
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
  const placeholderStyle = { color: '#d1d5db', letterSpacing: '2px' };

  return (
    <div ref={ref} style={{
      width: '210mm',
      minHeight: '297mm',
      padding: '10mm',
      backgroundColor: '#ffffff',
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px', position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 2px 0', color: '#111827', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Medico-Legal Examination Form
          </h2>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>Ministry of Health - Sri Lanka</div>
        </div>
        <div style={{ position: 'absolute', right: 0, top: '4px' }}>
          <span style={{ fontSize: '9px', color: '#9ca3af' }}>Form No. MLEF/01</span>
        </div>
      </div>

      {/* PART A */}
      <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
        <SectionHeader title="PART A : (1-8) To be filled by Police Officer issuing MLEF" />

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
            <span style={labelStyle}>1. Police Station</span>
            <span style={valueStyle}>{caseDetail.PoliceStationName || 'N/A'}</span>
          </div>
          <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
            <span style={labelStyle}>2. Date of Issue</span>
            <span style={valueStyle}>{caseDetail.DateOfIssue ? new Date(caseDetail.DateOfIssue).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>3. MLEF No.</span>
            <span style={valueStyle}>{caseDetail.MLEF_No}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 2, ...cellStyle, ...borderRight }}>
            <span style={labelStyle}>4. Full Name and Address of the Examinee</span>
            <span style={valueStyle}>{caseDetail.PatientName}</span><br />
            <span style={{ ...valueStyle, fontWeight: 'normal', color: '#4b5563', marginTop: '2px', display: 'block' }}>{caseDetail.Address || 'Address not provided'}</span>
          </div>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>5. Date of Birth</span>
            <span style={valueStyle}>{caseDetail.DOB ? new Date(caseDetail.DOB).toLocaleDateString() : '................'}</span>
            <div style={{ marginTop: '8px' }}>
              <span style={labelStyle}>6. Gender</span>
              <span style={valueStyle}>{caseDetail.Gender}</span>
            </div>
          </div>
        </div>

        <div style={{ ...cellStyle, ...borderBottom }}>
          <span style={labelStyle}>7. Reason for referring for examination</span>
          <span style={valueStyle}>{caseDetail.ReasonForExamination || '................................................................'}</span>
        </div>

        <div style={{ display: 'flex' }}>
          <div style={{ flex: 2, ...cellStyle, ...borderRight }}>
            <span style={labelStyle}>8. Police Officer Issuing</span>
            <div style={{ display: 'flex', marginTop: '4px' }}>
              <div style={{ width: '50%' }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Name:</span> <span style={valueStyle}>{caseDetail.PoliceOfficerName || 'N/A'}</span>
              </div>
              <div style={{ width: '50%' }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Rank/Reg No:</span> <span style={valueStyle}>{caseDetail.PoliceOfficerRank || ''} {caseDetail.PoliceOfficerRegNo || ''}</span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, ...cellStyle, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: '#6b7280', marginRight: '8px' }}>Signature:</span>
            <span style={placeholderStyle}>.........................</span>
          </div>
        </div>
      </div>

      {/* PART B */}
      <div style={{ border: '1.5px solid #1f2937', borderRadius: '6px', overflow: 'hidden' }}>
        <SectionHeader title="PART B : (9-22) To be filled by Medical Officer" />

        <div style={{ ...cellStyle, ...borderBottom }}>
          <span style={labelStyle}>9. Produced by</span>
          <span style={valueStyle}>{partB?.ProducedBy || '................................................................'}</span>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
            <span style={labelStyle}>10. Admission Date</span>
            <span style={valueStyle}>{caseDetail.AdmissionDate ? new Date(caseDetail.AdmissionDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
            <span style={labelStyle}>11. Examination Date & Place</span>
            <span style={valueStyle}>{partB?.ExaminationDate ? new Date(partB.ExaminationDate).toLocaleString() : 'N/A'}</span><br />
            <span style={{ ...valueStyle, fontWeight: 'normal', color: '#4b5563' }}>{partB?.ExaminationPlace || 'N/A'}</span>
          </div>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>12. Date of Discharge</span>
            <span style={valueStyle}>{partB?.DischargeDate ? new Date(partB.DischargeDate).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        <div style={{ ...cellStyle, ...borderBottom }}>
          <span style={labelStyle}>13. Nature of Bodily Harm</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px' }}>
            {['Abrasion', 'Contusion', 'Laceration', 'Stab', 'Cut', 'Fracture', 'Firearm inj.', 'Burns', 'Bite', 'Dislocation', 'Explosive inj.'].map(inj => {
              const isChecked = caseDetail.injuries && caseDetail.injuries.some(i => i.Type === inj || (inj === 'Firearm inj.' && i.Type === 'Firearm') || (inj === 'Explosive inj.' && i.Type === 'Explosive'));
              return <Checkbox key={inj} label={inj} checked={isChecked} />;
            })}
            <Checkbox label="None" checked={!caseDetail.injuries || caseDetail.injuries.length === 0} />
          </div>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#111', marginRight: '8px', fontWeight: 'bold' }}>Internal Injuries:</span>
            <span style={{ color: '#4b5563', flex: 1, borderBottom: '1px dotted #ccc' }}>
              {caseDetail.injuries?.filter(i => !['Abrasion', 'Contusion', 'Laceration', 'Stab', 'Cut', 'Fracture', 'Firearm inj.', 'Burns', 'Bite', 'Dislocation', 'Explosive inj.', 'Firearm', 'Explosive'].includes(i.Type)).map(i => `${i.Type} at ${i.Location}`).join(', ') || ''}
            </span>
          </div>
        </div>

        <div style={{ ...cellStyle, ...borderBottom }}>
          <span style={labelStyle}>14. Nature of Causative Weapon</span>
          <span style={valueStyle}>{partB?.CausativeWeapon || <span style={placeholderStyle}>................................................................</span>}</span>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
            <span style={labelStyle}>15. Category of Hurt</span>
            <span style={valueStyle}>{partB?.CategoryOfHurt || <span style={placeholderStyle}>................................</span>}</span>
          </div>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>If Grievous, does it endanger life?</span>
            <span style={valueStyle}>{partB?.EndangersLife === 1 ? 'Yes' : (partB?.EndangersLife === 0 ? 'No' : <span style={placeholderStyle}>...................</span>)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', ...borderBottom }}>
          <div style={{ flex: 1, ...cellStyle, ...borderRight }}>
            <span style={labelStyle}>16. Examination for Consumption of Alcohol</span>
            <div style={{ display: 'flex', marginTop: '4px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Breathing smelling:</span> <span style={valueStyle}>{intoxicationRecords?.some(r => r.SubstanceType === 'Alcohol') ? 'Yes' : 'No'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Under influence:</span> <span style={valueStyle}>{intoxicationRecords?.some(r => r.SubstanceType === 'Alcohol' && r.UnderInfluence) ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, ...cellStyle }}>
            <span style={labelStyle}>17. Examination for Consumption of Drugs</span>
            <div style={{ display: 'flex', marginTop: '4px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Consumed:</span> <span style={valueStyle}>{intoxicationRecords?.some(r => r.SubstanceType !== 'Alcohol') ? 'Yes' : 'No'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>Under influence:</span> <span style={valueStyle}>{intoxicationRecords?.some(r => r.SubstanceType !== 'Alcohol' && r.UnderInfluence) ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...cellStyle, ...borderBottom }}>
          <span style={labelStyle}>18. Examination of Alleged Sexual Assault</span>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '4px', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: '#111' }}>History:</span>
            <span style={valueStyle}>{sexualAssault?.OtherSigns || <span style={placeholderStyle}>................................................................</span>}</span>
            <span style={{ fontSize: '11px', color: '#111' }}>Vaginal/Hymen penetration:</span>
            <span style={valueStyle}>{sexualAssault?.HymenStatus || <span style={placeholderStyle}>................................................................</span>}</span>
            <span style={{ fontSize: '11px', color: '#111' }}>Anal penetration:</span>
            <span style={valueStyle}>{sexualAssault?.PenetrationSigns || <span style={placeholderStyle}>................................................................</span>}</span>
          </div>
        </div>

        <div style={{ ...cellStyle, ...borderBottom }}>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#111', fontWeight: 'bold' }}>19. Investigations:</span> <span style={valueStyle}>{partB?.Investigations || <span style={placeholderStyle}>................................................................</span>}</span>
          </div>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#111', fontWeight: 'bold' }}>20. Referrals:</span> <span style={valueStyle}>{partB?.Referrals || <span style={placeholderStyle}>................................................................</span>}</span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#111', fontWeight: 'bold' }}>21. Recommendations:</span> <span style={valueStyle}>{partB?.Recommendations || <span style={placeholderStyle}>................................................................</span>}</span>
          </div>
        </div>

        <div style={{ ...cellStyle }}>
          <span style={labelStyle}>22. Remarks</span>
          <span style={valueStyle}>{partB?.Remarks || <span style={placeholderStyle}>................................................................................................</span>}</span>
        </div>
      </div>

      {/* FOOTER SIGNATURES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>Date of Examination</span>
          <span style={valueStyle}>{partB?.ExaminationDate ? new Date(partB.ExaminationDate).toLocaleDateString() : <span style={placeholderStyle}>........................</span>}</span>

          <div style={{ marginTop: '12px' }}>
            <span style={labelStyle}>Ref No</span>
            <span style={placeholderStyle}>........................</span>
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={placeholderStyle}>........................................................</span>
          <span style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>Signature</span>

          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <span style={valueStyle}>{caseDetail.JMOName}</span><br />
            <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 'normal' }}>{caseDetail.Designation}</span><br />
            <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px', display: 'block' }}>Name, qualifications, SLMC Reg No.</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MLEFTemplate;

