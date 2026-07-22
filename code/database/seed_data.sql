-- Forensic Medical Department - Database Seed Data
-- Run this AFTER the main ForensicDB_Implementation.sql

USE ForensicMedicalDB;

-- Clear existing sample data
DELETE FROM AuditLog;
DELETE FROM Notification;
DELETE FROM LabResult;
DELETE FROM LabRequest;
DELETE FROM Specimen;
DELETE FROM CourtReport;
DELETE FROM CourtSummons;
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
INSERT INTO ClinicalCase (ClinicalCaseID, PatientID, JMO_StaffID, WardID, PoliceStationID, MLEF_No, AdmissionDate) VALUES
(1, 1, 1, 1, 1, 'MLEF/2026/001', '2026-06-10 09:30:00'),
(2, 2, 2, 3, 1, 'MLEF/2026/002', '2026-06-20 14:15:00'),
(5, 5, 1, 2, 4, 'MLEF/2026/003', '2026-07-10 11:00:00'),
(6, 6, 2, 1, 1, 'MLEF/2026/004', '2026-07-15 16:45:00'),
(7, 7, 1, 1, 1, 'MLEF/2026/005', '2026-07-18 09:15:00'),
(8, 8, 2, 2, 1, 'MLEF/2026/006', '2026-07-19 14:30:00');

-- Autopsy Cases
INSERT INTO AutopsyCase (AutopsyCaseID, DeceasedID, JMO_StaffID, PM_No, PlaceOfDeath, AutopsyDate) VALUES
(3, 3, 1, 'PM/2026/001', 'Mahaweli River, Peradeniya', '2026-06-16 10:00:00'),
(4, 4, 2, 'PM/2026/002', 'Residence, 56 Dalada Veediya', '2026-07-02 09:00:00'),
(9, 9, 1, 'PM/2026/003', 'Roadside, Katugastota', '2026-07-20 11:00:00'),
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

-- Internal Examinations (Autopsy)
INSERT INTO InternalExamination (AutopsyCaseID, HeadDetails, ThoraxDetails, AbdomenDetails) VALUES
(3, 'No fractures of skull vault. Brain edematous.', 'Left lung collapsed. 200ml blood in left pleural cavity.', 'Liver and spleen normal.'),
(4, 'Subdural hemorrhage over right cerebral hemisphere.', 'Both lungs congested. No pleural effusion.', 'Stomach contained partially digested food.');

-- Cause of Death
INSERT INTO CauseOfDeath (AutopsyCaseID, ImmediateCause, AntecedentCause, UnderlyingCause, ContributoryCause) VALUES
(3, 'Hemorrhagic shock', 'Penetrating stab wound to left chest', 'Assault by sharp weapon', NULL),
(4, 'Subdural hemorrhage', 'Blunt force trauma to head', 'Fall from height', 'Chronic alcoholism');

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

-- Court Reports
INSERT INTO CourtReport (CaseID, ReportType, IssueDate, SignedByStaffID) VALUES
(1, 'MLR', '2026-06-25', 1),
(3, 'PMR', '2026-07-05', 1);

-- Court Summons
INSERT INTO CourtSummons (StaffID, AuthorityID, CaseNo, RequiredDate, Status) VALUES
(1, 2, 'MC/KDY/2026/1234', '2026-08-15', 'Pending'),
(2, 5, 'HC/KDY/2026/0089', '2026-09-01', 'Pending');

-- Audit Log
INSERT INTO AuditLog (UserID, Action, TableName, RecordID) VALUES
(2, 'Created clinical case MLEF/2026/001', 'ClinicalCase', 1),
(2, 'Created autopsy case PM/2026/001', 'AutopsyCase', 3),
(1, 'System initialized with seed data', 'System', 0);
