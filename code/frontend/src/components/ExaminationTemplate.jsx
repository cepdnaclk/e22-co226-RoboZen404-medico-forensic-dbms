import React from 'react';

const ExaminationTemplate = ({ caseDetail, internalExam }) => {
  if (!caseDetail) return null;

  const data = internalExam?.ExaminationData 
    ? (typeof internalExam.ExaminationData === 'string' ? JSON.parse(internalExam.ExaminationData) : internalExam.ExaminationData)
    : {};

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
    fontSize: '11px'
  };

  const borderRight = { borderRight: '1.5px solid #e5e7eb' };
  const borderBottom = { borderBottom: '1.5px solid #e5e7eb' };
  const labelStyle = { color: '#6b7280', display: 'block', fontSize: '9px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const valueStyle = { color: '#111827', fontWeight: '600', fontSize: '12px' };

  const FieldRow = ({ label, value, hideBottomBorder }) => (
    <div style={{ display: 'flex', ...(hideBottomBorder ? {} : borderBottom) }}>
      <div style={{ flex: 1, ...cellStyle, borderRight: '1.5px solid #e5e7eb', backgroundColor: '#f9fafb', maxWidth: '30%' }}>
        <span style={labelStyle}>{label}</span>
      </div>
      <div style={{ flex: 2, ...cellStyle }}>
        <span style={valueStyle}>{value || 'N/A'}</span>
      </div>
    </div>
  );

  const LongFieldRow = ({ label, value, subtitle, hideBottomBorder }) => (
    <div style={{ ...(hideBottomBorder ? {} : borderBottom) }}>
      <div style={{ ...cellStyle, backgroundColor: '#f9fafb', borderBottom: '1.5px solid #e5e7eb' }}>
        <span style={labelStyle}>{label}</span>
        {subtitle && <span style={{ fontSize: '9px', color: '#9ca3af', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>{subtitle}</span>}
      </div>
      <div style={{ ...cellStyle, minHeight: '40px' }}>
        <span style={valueStyle}>{value || 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f3f4f6' }}>
      {/* Page 1 */}
      <div className="pdf-page" style={pageStyle}>
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #111827', paddingBottom: '15px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', position: 'absolute', right: '15mm', top: '15mm' }}>Health 14</div>
          <h1 style={{ fontSize: '18px', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>POST-MORTEM EXAMINATION</h1>
          <h2 style={{ fontSize: '12px', margin: '0', fontWeight: 'normal', color: '#4b5563' }}>Case No: {caseDetail.PM_No}</h2>
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="1. Locus & External" />
          <LongFieldRow label="1. Examination of the locus" value={data.locus} />
          <LongFieldRow label="2. External Examination" subtitle="Clothing, condition of body, nourishment, marks of identification etc." value={data.external?.general} />
          <LongFieldRow label="3. Injuries" value={data.external?.injuries} hideBottomBorder={true} />
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="2. Measurements & Features" />
          <div style={{ display: 'flex', ...borderBottom }}>
            <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
              <span style={labelStyle}>4. Height</span><span style={valueStyle}>{data.measurements?.height || 'N/A'}</span>
            </div>
            <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
              <span style={labelStyle}>5. Age</span><span style={valueStyle}>{data.measurements?.age || 'N/A'}</span>
            </div>
            <div style={{ flex: 1, ...cellStyle }}>
              <span style={labelStyle}>6. Sex</span><span style={valueStyle}>{data.measurements?.sex || 'N/A'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', ...borderBottom }}>
            <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
              <span style={labelStyle}>7. Eyes & Pupils</span><span style={valueStyle}>{data.features?.eyes || 'N/A'}</span>
            </div>
            <div style={{ flex: 1, ...cellStyle }}>
              <span style={labelStyle}>8. Hair</span><span style={valueStyle}>{data.features?.hair || 'N/A'}</span>
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, ...borderRight, ...cellStyle }}>
              <span style={labelStyle}>9. Tongue</span><span style={valueStyle}>{data.features?.tongue || 'N/A'}</span>
            </div>
            <div style={{ flex: 1, ...cellStyle }}>
              <span style={labelStyle}>10. Teeth</span><span style={valueStyle}>{data.features?.teeth || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="3. Signs of Death & Other" />
          <FieldRow label="11(a) Rigor mortis" value={data.signsOfDeath?.rigorMortis} />
          <FieldRow label="11(b) Hypostasis" value={data.signsOfDeath?.hypostasis} />
          <FieldRow label="11(c) Putrefaction" value={data.signsOfDeath?.putrefaction} />
          <FieldRow label="12. Hands and nails" value={data.handsAndNails} />
          <FieldRow label="13. Natural openings" value={data.naturalOpenings} />
          <LongFieldRow label="14. Neck" value={data.neck} hideBottomBorder={true} />
        </div>
      </div>

      {/* Page 2 */}
      <div className="pdf-page" style={pageStyle}>
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #111827', paddingBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', margin: '0', fontWeight: 'normal', color: '#4b5563' }}>Case No: {caseDetail.PM_No} - Page 2</h2>
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="4. Head & Spine" />
          <FieldRow label="15(a) Soft parts" value={data.head?.softParts} />
          <FieldRow label="15(b) Bones of skull" value={data.head?.bones} />
          <FieldRow label="15(c) Membranes & sinuses" value={data.head?.membranes} />
          <FieldRow label="15(d) Brain substance" value={data.head?.brain} />
          <FieldRow label="15(e) Blood vessels" value={data.head?.vessels} />
          <LongFieldRow label="16. Spinal cord" value={data.spinalCord} hideBottomBorder={true} />
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="5. Thorax" />
          <FieldRow label="17(a) Bones (ribs, sternum)" value={data.thorax?.bones} />
          <FieldRow label="17(b) Chest cavity" value={data.thorax?.cavity} />
          <FieldRow label="17(c) Pericardium" value={data.thorax?.pericardium} />
          <FieldRow label="17(d) Heart" value={data.thorax?.heart} />
          <FieldRow label="17(e) Coronary vessels" value={data.thorax?.coronaryVessels} />
          <FieldRow label="17(f) Large blood vessels" value={data.thorax?.largeVessels} />
          <FieldRow label="17(g) Larynx, trachea" value={data.thorax?.larynx} />
          <FieldRow label="17(h) Pleura & Lungs" value={data.thorax?.pleuraLungs} />
          <FieldRow label="17(i) Gullet" value={data.thorax?.gullet} hideBottomBorder={true} />
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="6. Abdomen (Part 1)" />
          <LongFieldRow label="18. Position of organs" value={data.abdomen?.position} />
          <FieldRow label="18(a) Peritoneum" value={data.abdomen?.peritoneum} />
          <FieldRow label="18(b) Diaphragm" value={data.abdomen?.diaphragm} />
          <FieldRow label="18(c) Liver & Gall Bladder" value={data.abdomen?.liver} />
          <FieldRow label="18(d) Spleen" value={data.abdomen?.spleen} />
          <FieldRow label="18(e) Stomach" value={data.abdomen?.stomach} hideBottomBorder={true} />
        </div>
      </div>

      {/* Page 3 */}
      <div className="pdf-page" style={pageStyle}>
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #111827', paddingBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', margin: '0', fontWeight: 'normal', color: '#4b5563' }}>Case No: {caseDetail.PM_No} - Page 3</h2>
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="6. Abdomen (Part 2)" />
          <FieldRow label="18(f) Duodenum, jejunum, ileum" value={data.abdomen?.duodenum} />
          <FieldRow label="18(g) Large intestines" value={data.abdomen?.largeIntestines} />
          <FieldRow label="18(h) Pancreas" value={data.abdomen?.pancreas} />
          <FieldRow label="18(i) Kidneys" value={data.abdomen?.kidneys} />
          <FieldRow label="18(j) Supra-renal glands" value={data.abdomen?.supraRenal} hideBottomBorder={true} />
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="7. Pelvis" />
          <FieldRow label="19(a) Urinary bladder, prostate" value={data.pelvis?.bladder} />
          <FieldRow label="19(b) Generative organs" value={data.pelvis?.generative} />
          <FieldRow label="19(c) Blood vessels" value={data.pelvis?.vessels} />
          <FieldRow label="19(d) Vertebrae & pelvic bones" value={data.pelvis?.vertebrae} hideBottomBorder={true} />
        </div>

        <div style={{ border: '1.5px solid #1f2937', marginBottom: '20px' }}>
          <SectionHeader title="20. Cause of death and other relevant opinion" />
          <FieldRow label="Immediate Cause" value={caseDetail.causeOfDeath?.ImmediateCause} />
          <FieldRow label="Antecedent Cause" value={caseDetail.causeOfDeath?.AntecedentCause} />
          <FieldRow label="Underlying Cause" value={caseDetail.causeOfDeath?.UnderlyingCause} />
          <LongFieldRow label="Comments" value={caseDetail.causeOfDeath?.Comments} hideBottomBorder={true} />
        </div>
        
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '30%' }}>
            <div style={{ borderBottom: '1px solid #111827', marginBottom: '4px' }}></div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Date</div>
          </div>
          <div style={{ width: '40%', textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #111827', marginBottom: '4px', height: '40px' }}></div>
            <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Signature, qualifications & Designation of Medical Officer</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExaminationTemplate;
