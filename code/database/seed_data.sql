-- Forensic Medical Department - Database Seed Data
-- Run this AFTER the main ForensicDB_Implementation.sql

USE ForensicMedicalDB;

-- Clear existing sample data
DELETE FROM AuditLog;
DELETE FROM Notification;
DELETE FROM LabResult;
DELETE FROM LabRequest;
DELETE FROM Specimen;
DELETE FROM CauseOfDeath;
DELETE FROM InternalExamination;
DELETE FROM SexualAssaultExam;
DELETE FROM IntoxicationRecord;
DELETE FROM CaseWeapon;
DELETE FROM Weapon;
DELETE FROM Injury;
DELETE FROM InquestOrder;
DELETE FROM AutopsyCase;
DELETE FROM ClinicalCase;
DELETE FROM Case_Table;
DELETE FROM Deceased;
DELETE FROM Patient;
DELETE FROM Person;
DELETE FROM Staff;
DELETE FROM UserAccount;
DELETE FROM Role;
DELETE FROM Ward;
DELETE FROM Department;
DELETE FROM ExternalAuthority;

-- Roles
INSERT INTO Role (RoleID, RoleName, Permissions) VALUES
(1, 'Admin', 'Full system access'),
(2, 'JMO', 'Case management, report generation'),
(3, 'Clerk', 'Data entry, record viewing'),
(4, 'Doctor', 'Ward patient assessment and referral'),
(5, 'Lab Staff', 'Laboratory testing and result entry');

-- Departments
INSERT INTO Department (DeptID, DeptName, Location) VALUES
(1, 'Forensic Medicine', 'Teaching Hospital Peradeniya, 2nd Floor');

-- User Accounts (passwords are bcrypt hashes for: password)
INSERT INTO UserAccount (UserID, RoleID, Username, PasswordHash, IsActive) VALUES
(1, 1, 'admin', '$2b$10$WSFrrMS8Itt7Ka4OE9hBDejxXlutd3ZYUko/cTACjVvuzlT5Iq5kq', TRUE),
(2, 2, 'dr_nimal', '$2b$10$WSFrrMS8Itt7Ka4OE9hBDejxXlutd3ZYUko/cTACjVvuzlT5Iq5kq', TRUE),
(3, 2, 'dr_anura', '$2b$10$WSFrrMS8Itt7Ka4OE9hBDejxXlutd3ZYUko/cTACjVvuzlT5Iq5kq', TRUE),
(4, 3, 'clerk_saman', '$2b$10$WSFrrMS8Itt7Ka4OE9hBDejxXlutd3ZYUko/cTACjVvuzlT5Iq5kq', TRUE),
(5, 4, 'dr_kamal', '$2b$10$WSFrrMS8Itt7Ka4OE9hBDejxXlutd3ZYUko/cTACjVvuzlT5Iq5kq', TRUE),
(6, 5, 'lab_kasun', '$2b$10$WSFrrMS8Itt7Ka4OE9hBDejxXlutd3ZYUko/cTACjVvuzlT5Iq5kq', TRUE);

-- Staff
INSERT INTO Staff (StaffID, UserID, DeptID, FirstName, LastName, Designation) VALUES
(1, 1, 1, 'System', 'Administrator', 'IT Head'),
(2, 2, 1, 'Nimal', 'Bandara', 'Consultant JMO'),
(3, 3, 1, 'Anura', 'Perera', 'Acting JMO'),
(4, 4, 1, 'Saman', 'Kumara', 'Medical Clerk'),
(5, 5, 1, 'Kamal', 'Fernando', 'Ward Doctor'),
(6, 6, 1, 'Kasun', 'Silva', 'Lab Technician');

-- Wards
INSERT INTO Ward (WardID, Name, HospitalLocation) VALUES
(1, 'Trauma Ward 5', 'East Wing'),
(2, 'ICU', 'Main Block, Ground Floor'),
(3, 'General Ward 3', 'North Wing'),
(4, 'Surgical Ward 7', 'West Wing');

-- External Authorities
INSERT INTO ExternalAuthority (AuthID, Name, Type, ContactInfo) VALUES
(1, 'Peradeniya Police Station', 'Police', '081-2388222'),
(2, 'Kandy Magistrate Court', 'Court', '081-2222333'),
(3, 'Government Analyst Department', 'Government Analyst', '011-2694373'),
(4, 'Gampola Police Station', 'Police', '081-2352222'),
(5, 'Kandy High Court', 'Court', '081-2233111');

-- Persons
INSERT INTO Person (PersonID, FirstName, LastName, DOB, Gender, NIC) VALUES
(1, 'Nimal', 'Bandara', '1985-03-15', 'Male', '198503156789'),
(2, 'Kamala', 'Herath', '1990-07-22', 'Female', '199007226543'),
(3, 'Sunil', 'Fernando', '1978-11-30', 'Male', '197811302345'),
(4, 'Malini', 'Jayawardena', '1965-01-10', 'Female', '196501103456'),
(5, 'Ruwan', 'Silva', '2000-06-05', 'Male', '200006054567'),
(6, 'Priya', 'Dissanayake', '1995-09-18', 'Female', '199509185678'),
(7, 'Kasun', 'Rathnayake', '1988-12-12', 'Male', '198812127890'),
(8, 'Tharushi', 'Perera', '2002-04-20', 'Female', '200204209012'),
(9, 'Saman', 'Wickrama', '1970-02-14', 'Male', '197002143456'),
(10, 'Nayani', 'Senanayake', '1982-10-05', 'Female', '198210052345');

-- Patients (living persons referred for clinical examination)
INSERT INTO Patient (PatientID, Address, EmergencyContact) VALUES
(1, '45 Temple Road, Peradeniya', '0771234567'),
(2, '12 Lake View, Kandy', '0769876543'),
(5, '78 Main Street, Gampola', '0754321098'),
(6, '23 Hill Crest, Kandy', '0781112233'),
(7, '12 School Lane, Katugastota', '0711122334'),
(8, '45 Kandy Road, Pilimathalawa', '0723344556');

-- Deceased
INSERT INTO Deceased (DeceasedID, DateOfDeath, TimeOfDeath) VALUES
(3, '2026-06-15', '14:30:00'),
(4, '2026-07-01', '08:15:00'),
(9, '2026-07-18', '22:00:00'),
(10, '2026-07-19', '05:45:00');

-- Case Table entries
INSERT INTO Case_Table (CaseID, CaseDate, Status) VALUES
(1, '2026-06-10', 'Closed'),
(2, '2026-06-20', 'Open'),
(3, '2026-06-15', 'Open'),
(4, '2026-07-01', 'Open'),
(5, '2026-07-10', 'Open'),
(6, '2026-07-15', 'Open'),
(7, '2026-07-18', 'Open'),
(8, '2026-07-19', 'Open'),
(9, "2026-07-22", 'Open'),
(10, "2026-07-22", 'Open');

-- Clinical Cases
INSERT INTO ClinicalCase (ClinicalCaseID, PatientID, JMO_StaffID, PoliceStationID, MLEF_No, AdmissionDate) VALUES
(1, 1, 1, 1, 'MLEF/2026/001', '2026-06-10 09:30:00'),
(2, 2, 2, 1, 'MLEF/2026/002', '2026-06-20 14:15:00'),
(5, 5, 1, 4, 'MLEF/2026/003', '2026-07-10 11:00:00'),
(6, 6, 2, 1, 'MLEF/2026/004', '2026-07-15 16:45:00'),
(7, 7, 1, 1, 'MLEF/2026/005', '2026-07-18 09:15:00'),
(8, 8, 2, 1, 'MLEF/2026/006', '2026-07-19 14:30:00');

-- Autopsy Cases
INSERT INTO AutopsyCase (AutopsyCaseID, DeceasedID, JMO_StaffID, PM_No, PlaceOfDeath, AutopsyDate) VALUES
(3, 3, 1, 'PM/2026/001', 'Mahaweli River, Peradeniya', '2026-06-16 10:00:00'),
(4, 4, 2, 'PM/2026/002', 'Residence, 56 Dalada Veediya', '2026-07-02 09:00:00'),
(9, 9, 2, 'PM/2026/003', 'Roadside, Katugastota', '2026-07-20 11:00:00'),
(10, 10, 2, 'PM/2026/004', 'General Hospital Ward 3', '2026-07-21 14:00:00');

-- Injuries
INSERT INTO Injury (CaseID, Type, Dimensions, Location, Description) VALUES
(1, 'Laceration', '5cm x 2cm', 'Left forearm', 'Irregular wound with bruised edges'),
(1, 'Abrasion', '3cm x 3cm', 'Right knee', 'Superficial scraping of skin'),
(2, 'Contusion', '4cm x 4cm', 'Left temple', 'Bluish discoloration with swelling'),
(3, 'Stab wound', '2cm x 0.5cm', 'Left chest', 'Clean cut wound between 4th and 5th rib'),
(5, 'Fracture', 'N/A', 'Right radius', 'Closed fracture of distal radius');

-- Weapons
INSERT INTO Weapon (WeaponID, Type, Description) VALUES
(1, 'Sharp', 'Kitchen knife, 15cm blade'),
(2, 'Blunt', 'Wooden pole, approximately 1 meter');

INSERT INTO CaseWeapon (CaseID, WeaponID, Details) VALUES
(1, 2, 'Victim struck with wooden pole during altercation'),
(3, 1, 'Single stab wound inflicted with kitchen knife');

-- Intoxication Records
INSERT INTO IntoxicationRecord (CaseID, SubstanceType, Consumed, UnderInfluence) VALUES
(1, 'Alcohol', TRUE, TRUE),
(2, 'None', FALSE, FALSE);

-- Internal Examinations
INSERT INTO InternalExamination (AutopsyCaseID, ExaminationData) VALUES
(3, '{"locus":"Body found in living room. Blood stains on carpet. No signs of forced entry.","external":{"general":"Well nourished adult male. Wearing blue t-shirt and jeans. No identifying marks or tattoos.","injuries":"Multiple stab wounds on chest and abdomen."},"measurements":{"height":"175 cm","age":"35 years","sex":"Male"},"features":{"eyes":"Pupils dilated, corneas cloudy","hair":"Short black hair","tongue":"Cyanotic, caught between teeth","teeth":"Intact, slight dental plaque"},"signsOfDeath":{"rigorMortis":"Present in all joints, fully established","hypostasis":"Fixed on the back, purplish-red","putrefaction":"No signs of decomposition"},"handsAndNails":"Defense wounds on forearms. Nailbeds cyanotic.","naturalOpenings":"No discharge from ears, nose or mouth.","neck":"No marks of strangulation. Trachea centrally placed.","head":{"softParts":"No bruising of scalp.","bones":"No fractures of skull vault.","membranes":"Intact, no epidural or subdural hemorrhage.","brain":"Brain edematous, weight 1350g.","vessels":"Circle of Willis intact, no aneurysms."},"spinalCord":"Not examined.","thorax":{"bones":"No rib fractures. Sternum intact.","cavity":"200ml fluid blood in left pleural cavity.","pericardium":"Intact, minimal serous fluid.","heart":"Weight 350g, no structural abnormalities.","coronaryVessels":"Patent, minimal atheroma.","largeVessels":"Aorta intact.","larynx":"Mucosa pale.","pleuraLungs":"Left lung collapsed due to hemothorax. Right lung congested.","gullet":"Empty, mucosa normal."},"abdomen":{"position":"Organs normally situated.","peritoneum":"Intact, no free fluid.","diaphragm":"Intact bilaterally.","liver":"Congested, weight 1500g. Gallbladder contains 20ml bile.","spleen":"Congested, weight 150g.","stomach":"Contains 100ml brownish fluid, smelling of alcohol.","duodenum":"Mucosa congested.","largeIntestines":"Contains formed feces.","pancreas":"Normal appearance, no fat necrosis.","kidneys":"Capsules strip easily. Corticomedullary junction distinct.","supraRenal":"Normal size and shape."},"pelvis":{"bladder":"Contains 50ml clear urine.","generative":"Normal male genitalia.","vessels":"Iliac vessels intact.","vertebrae":"Pelvic bones intact."}}'),
(4, '{"locus":"Hospital bed.","external":{"general":"Cachectic adult male. Surgical dressing on head.","injuries":"Surgical incision over right temporal region."},"measurements":{"height":"168 cm","age":"50 years","sex":"Male"},"features":{"eyes":"Pupils unequal, right larger than left","hair":"Grey, partially shaved for surgery","tongue":"Normal","teeth":"Multiple missing teeth"},"signsOfDeath":{"rigorMortis":"Developing in small joints","hypostasis":"Faint, unfixed on back","putrefaction":"None"},"handsAndNails":"Pale nailbeds. IV access marks on back of hands.","naturalOpenings":"Normal.","neck":"Normal.","head":{"softParts":"Surgical incision and suturing on right side.","bones":"Burr holes and craniotomy bone flap on right temporal bone.","membranes":"Subdural hemorrhage over right cerebral hemisphere.","brain":"Brain flattened, midline shift to the left.","vessels":"No aneurysms seen."},"spinalCord":"Not examined.","thorax":{"bones":"Intact.","cavity":"No abnormal fluid.","pericardium":"Normal.","heart":"Normal size.","coronaryVessels":"Mild atherosclerosis.","largeVessels":"Normal.","larynx":"Normal.","pleuraLungs":"Both lungs congested. No pleural effusion.","gullet":"Normal."},"abdomen":{"position":"Normal.","peritoneum":"Normal.","diaphragm":"Normal.","liver":"Fatty changes seen.","spleen":"Normal.","stomach":"Stomach contained partially digested food.","duodenum":"Normal.","largeIntestines":"Normal.","pancreas":"Normal.","kidneys":"Normal.","supraRenal":"Normal."},"pelvis":{"bladder":"Empty.","generative":"Normal.","vessels":"Normal.","vertebrae":"Normal."}}'),
(9, '{"locus":"Hospital bed.","external":{"general":"Obese adult male. Cast on left leg.","injuries":"Surgical incision on left thigh."},"measurements":{"height":"180 cm","age":"65 years","sex":"Male"},"features":{"eyes":"Arcus senilis present","hair":"White","tongue":"Normal","teeth":"Dentures present"},"signsOfDeath":{"rigorMortis":"Fully established","hypostasis":"Fixed on back","putrefaction":"None"},"handsAndNails":"Cyanotic nailbeds.","naturalOpenings":"Normal.","neck":"Normal.","head":{"softParts":"No abnormalities","bones":"Normal size and shape. No fractures","membranes":"Normal","brain":"Brain edematous","vessels":"Severe atherosclerosis of basal vessels"},"spinalCord":"Not examined.","thorax":{"bones":"Intact.","cavity":"No abnormal fluid.","pericardium":"Increased epicardial fat.","heart":"Heart enlarged (450g), left ventricular hypertrophy","coronaryVessels":"Coronary arteries show severe atherosclerosis. LAD 90% blocked.","largeVessels":"Severe atheroma in aorta.","larynx":"Normal.","pleuraLungs":"Pulmonary edema present.","gullet":"Normal."},"abdomen":{"position":"Normal.","peritoneum":"Normal.","diaphragm":"Normal.","liver":"Liver congested, nutmeg appearance.","spleen":"Normal.","stomach":"Stomach contains 100ml brownish fluid","duodenum":"Normal.","largeIntestines":"Normal.","pancreas":"Normal.","kidneys":"Benign nephrosclerosis.","supraRenal":"Normal."},"pelvis":{"bladder":"Normal.","generative":"Enlarged prostate.","vessels":"Atherosclerotic.","vertebrae":"Normal."}}');

-- Cause Of Death
INSERT INTO CauseOfDeath (AutopsyCaseID, ImmediateCause, AntecedentCause, UnderlyingCause, ContributoryCause, MaternalDeath, Comments) VALUES
(3, 'Hemorrhagic shock', 'Penetrating stab wound to left chest', 'Assault by sharp weapon', NULL, 'None', 'No suspicious injuries noted on the rest of the body.'),
(4, 'Subdural hemorrhage', 'Blunt force trauma to head', 'Fall from height', 'Chronic alcoholism', 'None', 'Features of surgical intervention noted on the skull.'),
(9, 'Myocardial Infarction', 'Patient who underwent surgery for neck fracture', NULL, 'Hypertension, Ischaemic Heart Disease', 'None', 'No suspicious injuries noted on the body. Features of left femur fracture and surgical intervention noted.'),
(10, 'Septicemia', 'Severe burn injuries', 'Accidental fire', NULL, 'None', 'Burns cover approximately 40% of total body surface area.');

-- Inquest Orders
INSERT INTO InquestOrder (AutopsyCaseID, AuthorityID, CaseNumber, DateOfIssue) VALUES
(3, 2, 'MC/KDY/2026/1234', '2026-06-15'),
(4, 2, 'MC/KDY/2026/1567', '2026-07-01');

-- Specimens
INSERT INTO Specimen (SpecimenID, CaseID, SpecimenType, CollectedDate, StorageLocation) VALUES
(1, 1, 'Blood sample', '2026-06-10', 'Refrigerator A'),
(2, 3, 'Tissue sample (lung)', '2026-06-16', 'Formalin Jar B-3'),
(3, 3, 'Blood sample', '2026-06-16', 'Refrigerator A'),
(4, 5, 'Urine sample', '2026-07-10', 'Refrigerator B'),
(5, 7, 'Blood sample', '2026-07-18', 'Refrigerator A'),
(6, 8, 'Swab', '2026-07-19', 'Freezer 1'),
(7, 9, 'Liver tissue', "2026-07-22", 'Formalin Jar C-1'),
(8, 10, 'Gastric contents', "2026-07-22", 'Freezer 2');

-- Lab Requests
INSERT INTO LabRequest (RequestID, SpecimenID, TargetLabID, AnalysisRequired, RequestDate, Status) VALUES
(1, 1, 3, 'Blood alcohol level determination', '2026-06-11', 'Completed'),
(2, 2, 3, 'Histopathological examination of lung tissue', '2026-06-17', 'Pending'),
(3, 3, 3, 'Toxicology screening', '2026-06-17', 'Pending'),
(4, 5, 3, 'Blood alcohol test', '2026-07-18', 'Pending'),
(5, 6, 3, 'DNA profiling', '2026-07-19', 'Pending'),
(6, 7, 3, 'Poisons screening', "2026-07-22", 'Pending'),
(7, 8, 3, 'Chemical analysis', "2026-07-22", 'Pending');

-- Lab Results
INSERT INTO LabResult (RequestID, ResultDetails, ReceivedDate) VALUES
(1, 'Blood alcohol concentration: 180mg/dL. Above legal limit.', '2026-06-25');


-- Audit Log
INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES
(2, 'Created clinical case MLEF/2026/001', 'ClinicalCase', 1),
(2, 'Created autopsy case PM/2026/001', 'AutopsyCase', 3),
(1, 'System initialized with seed data', 'System', 0);


-- ==========================================
-- 1. COMPREHENSIVE CLINICAL CASE (MLR/MLEF)
-- ==========================================
-- Variables
SET @JMO_STAFF_ID = 2; -- Dr. Nimal Bandara
SET @POLICE_STATION_ID = 1; -- Kandy Police Station

-- Create Person
INSERT INTO Person (FirstName, LastName, NIC, DOB, Gender) 
VALUES ('John', 'Doe', CONCAT(FLOOR(RAND() * 900000000 + 100000000), 'V'), '1995-05-15', 'Male');
SET @PERSON_ID_1 = LAST_INSERT_ID();

-- Create Patient
INSERT INTO Patient (PatientID, Address, EmergencyContact) 
VALUES (@PERSON_ID_1, '123 Kandy Road, Peradeniya', '0771234567');
SET @PATIENT_ID_1 = LAST_INSERT_ID();

-- Create Case Record
INSERT INTO Case_Table (CaseDate, Status) 
VALUES (CURDATE(), 'Open');
SET @CASE_ID_1 = LAST_INSERT_ID();

-- Create Clinical Case
INSERT INTO ClinicalCase (ClinicalCaseID, PatientID, JMO_StaffID, PoliceStationID, MLEF_No, AdmissionDate, DateOfIssue, ReasonForExamination, PoliceOfficerName, PoliceOfficerRank, PoliceOfficerRegNo) 
VALUES (@CASE_ID_1, @PATIENT_ID_1, @JMO_STAFF_ID, @POLICE_STATION_ID, CONCAT('MLEF/2026/', FLOOR(RAND() * 10000)), DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), 'Patient complains of severe assault by multiple individuals using blunt and sharp weapons at a local bar.', 'Saman Silva', 'Sergeant', '67890');

-- Add Injuries
INSERT INTO Injury (CaseID, Type, Dimensions, Location, Description) VALUES 
(@CASE_ID_1, 'Laceration', '6cm x 2cm', 'Left Parietal Scalp', 'Deep laceration exposing the skull bone. Bleeding profusely upon admission.'),
(@CASE_ID_1, 'Contusion', '10cm x 8cm', 'Right Lateral Chest', 'Large bluish-purple bruise consistent with a heavy blunt force impact. Patient complains of pain on breathing.'),
(@CASE_ID_1, 'Abrasion', '4cm x 4cm', 'Both Knees', 'Irregular grazing of the skin with gravel embedded.'),
(@CASE_ID_1, 'Stab', '2.5cm x 0.5cm', 'Left Upper Arm', 'Clean cut stab wound, 4cm deep. Margins are regular. No major blood vessels damaged.'),
(@CASE_ID_1, 'Bite', '3cm diameter', 'Right Forearm', 'Semi-circular bite mark with distinct tooth impressions. Swelling present.');

-- Add Intoxication
INSERT INTO IntoxicationRecord (CaseID, SubstanceType, Consumed, UnderInfluence) 
VALUES (@CASE_ID_1, 'Alcohol', 1, 1);

-- Add Part B Details (Medical Officer details)
INSERT INTO MLEF_PartB_Details (ClinicalCaseID, ProducedBy, ExaminationDate, ExaminationPlace, DischargeDate, CausativeWeapon, CategoryOfHurt, EndangersLife, Investigations, Referrals, Recommendations, Remarks)
VALUES (@CASE_ID_1, 'Sergeant Saman Silva', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Trauma Unit - Bed 3', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Blunt and Sharp', 'Grievous', 0, 'X-Ray Chest (No rib fractures). CT Head (Normal, no intracranial hemorrhage).', 'Referred to Surgical Unit for suturing.', 'Rest for 7 days. Antibiotics prescribed.', 'The injuries are highly consistent with the history of assault given by the patient. The scalp wound is grievous due to disfigurement.');

