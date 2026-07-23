-- ==============================================================================
-- Medico-Forensic DBMS - Schema Enhancements & Advanced DB Concepts
-- ==============================================================================
-- This script implements EER Specialization/Generalization, Multivalued Attributes,
-- M:N Relationships, Advanced SQL Views, Stored Procedures, Triggers, and Indexes.
--
-- Run Order: ForensicSys.sql → seed_data.sql → db_enhancements.sql
-- ==============================================================================

USE `ForensicMedicalDB`;

-- ==========================================
-- 1. EER SPECIALIZATION & GENERALIZATION
-- ==========================================
-- Staff superclass splits into two overlapping specializations:
--   JMOStaff  → for forensic physicians holding board certification
--   LabStaff  → for lab technicians holding lab certification
-- Both are optional (a staff member may or may not be in either subclass).

-- Subclass: JMO Staff
CREATE TABLE IF NOT EXISTS `JMOStaff` (
  `StaffID`              int         NOT NULL,
  `BoardCertificationNo` varchar(50) NOT NULL,
  `YearOfSeniority`      int         DEFAULT NULL,
  PRIMARY KEY (`StaffID`),
  CONSTRAINT `jmostaff_ibfk_1`
    FOREIGN KEY (`StaffID`) REFERENCES `Staff` (`StaffID`) ON DELETE CASCADE,
  CONSTRAINT `chk_jmo_seniority`
    CHECK (`YearOfSeniority` IS NULL OR (`YearOfSeniority` >= 0 AND `YearOfSeniority` <= 50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Subclass: Lab Staff
CREATE TABLE IF NOT EXISTS `LabStaff` (
  `StaffID`            int         NOT NULL,
  `LabCertificationID` varchar(50) NOT NULL,
  PRIMARY KEY (`StaffID`),
  CONSTRAINT `labstaff_ibfk_1`
    FOREIGN KEY (`StaffID`) REFERENCES `Staff` (`StaffID`) ON DELETE CASCADE,
  CONSTRAINT `chk_lab_cert`
    CHECK (LENGTH(`LabCertificationID`) >= 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- 2. MULTIVALUED ATTRIBUTES
-- ==========================================
-- Person.PhoneNumber is a multivalued attribute.
-- Normalizing to 1NF by separating it into its own table.

CREATE TABLE IF NOT EXISTS `PersonContact` (
  `PersonID`     int         NOT NULL,
  `PhoneNumber`  varchar(20) NOT NULL,
  `ContactLabel` varchar(50) DEFAULT 'Primary',
  PRIMARY KEY (`PersonID`, `PhoneNumber`),
  CONSTRAINT `personcontact_ibfk_1`
    FOREIGN KEY (`PersonID`) REFERENCES `Person` (`PersonID`) ON DELETE CASCADE,
  CONSTRAINT `chk_phone_length`
    CHECK (LENGTH(`PhoneNumber`) >= 7),
  CONSTRAINT `chk_contact_label`
    CHECK (`ContactLabel` IN ('Primary', 'Emergency', 'Work', 'Other'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- 3. M:N RELATIONSHIPS
-- ==========================================
-- A Case can have multiple assisting staff (besides the JMO).
-- A Staff member can assist on multiple cases.
-- This M:N relationship is mapped via junction table CaseAssistant.

CREATE TABLE IF NOT EXISTS `CaseAssistant` (
  `CaseID`       int          NOT NULL,
  `StaffID`      int          NOT NULL,
  `AssignedRole` varchar(100) DEFAULT 'Assistant',
  `AssignedAt`   datetime     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CaseID`, `StaffID`),
  CONSTRAINT `caseassistant_ibfk_1`
    FOREIGN KEY (`CaseID`)  REFERENCES `Case_Table` (`CaseID`)  ON DELETE CASCADE,
  CONSTRAINT `caseassistant_ibfk_2`
    FOREIGN KEY (`StaffID`) REFERENCES `Staff`      (`StaffID`) ON DELETE CASCADE,
  CONSTRAINT `chk_assigned_role`
    CHECK (`AssignedRole` IN ('Assistant', 'Witness', 'Consultant', 'Supervisor'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- 4. ADVANCED SQL VIEWS
-- ==========================================

-- ----------------------------------------------------------
-- View 1: PendingLabRequests
-- Purpose: Live list of all lab requests currently awaiting processing.
-- Joins: LabRequest → Specimen → ExternalAuthority → Case_Table
-- ----------------------------------------------------------
DROP VIEW IF EXISTS `pendinglabrequests`;
CREATE VIEW `pendinglabrequests` AS
SELECT
    lr.RequestID,
    s.SpecimenType,
    lr.RequestDate,
    ea.Name AS LabName,
    lr.AnalysisRequired,
    ct.CaseID
FROM LabRequest lr
JOIN Specimen          s  ON lr.SpecimenID  = s.SpecimenID
JOIN ExternalAuthority ea ON lr.TargetLabID = ea.AuthID
JOIN Case_Table        ct ON s.CaseID       = ct.CaseID
WHERE lr.Status = 'Pending';


-- ----------------------------------------------------------
-- View 2: mlr_dashboard
-- Purpose: Consolidated live case report combining both clinical and autopsy cases.
-- Joins: Case_Table + ClinicalCase/AutopsyCase + Person + Staff (UNION ALL)
-- ----------------------------------------------------------
DROP VIEW IF EXISTS `mlr_dashboard`;
CREATE VIEW `mlr_dashboard` AS
SELECT
    ct.CaseID,
    ct.CaseDate,
    ct.Status,
    'Clinical'  AS CaseType,
    c.MLEF_No   AS ReferenceNo,
    CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
    CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
FROM Case_Table ct
JOIN ClinicalCase c   ON ct.CaseID     = c.ClinicalCaseID
JOIN Patient      pat ON c.PatientID   = pat.PatientID
JOIN Person       p   ON pat.PatientID = p.PersonID
JOIN Staff        s   ON c.JMO_StaffID = s.StaffID
UNION ALL
SELECT
    ct.CaseID,
    ct.CaseDate,
    ct.Status,
    'Autopsy'   AS CaseType,
    a.PM_No     AS ReferenceNo,
    CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
    CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
FROM Case_Table ct
JOIN AutopsyCase a ON ct.CaseID     = a.AutopsyCaseID
JOIN Deceased    d ON a.DeceasedID  = d.DeceasedID
JOIN Person      p ON d.DeceasedID  = p.PersonID
JOIN Staff       s ON a.JMO_StaffID = s.StaffID;


-- ----------------------------------------------------------
-- View 3: v_CaseFullSummary
-- Purpose: Complete case overview joining 6 tables — subject details,
--          JMO assignment, referring authority, and specimen count.
-- ----------------------------------------------------------
DROP VIEW IF EXISTS `v_CaseFullSummary`;
CREATE VIEW `v_CaseFullSummary` AS
SELECT
    ct.CaseID,
    ct.CaseDate,
    ct.Status                                AS CaseStatus,
    COALESCE(cc.MLEF_No, ac.PM_No)           AS CaseReference,
    CASE
        WHEN cc.ClinicalCaseID IS NOT NULL THEN 'Clinical'
        WHEN ac.AutopsyCaseID  IS NOT NULL THEN 'Autopsy'
        ELSE 'Unknown'
    END                                      AS CaseType,
    CONCAT(p.FirstName, ' ', p.LastName)     AS SubjectName,
    p.NIC                                    AS SubjectNIC,
    CONCAT(s.FirstName, ' ', s.LastName)     AS JMOName,
    s.Designation                            AS JMODesignation,
    ea.Name                                  AS ReferringAuthority,
    COUNT(DISTINCT sp.SpecimenID)            AS SpecimenCount
FROM Case_Table ct
LEFT JOIN ClinicalCase      cc ON ct.CaseID          = cc.ClinicalCaseID
LEFT JOIN AutopsyCase       ac ON ct.CaseID          = ac.AutopsyCaseID
LEFT JOIN Patient          pat ON cc.PatientID       = pat.PatientID
LEFT JOIN Deceased           d ON ac.DeceasedID      = d.DeceasedID
LEFT JOIN Person             p ON COALESCE(pat.PatientID, d.DeceasedID) = p.PersonID
LEFT JOIN Staff              s ON COALESCE(cc.JMO_StaffID, ac.JMO_StaffID) = s.StaffID
LEFT JOIN ExternalAuthority ea ON cc.PoliceStationID = ea.AuthID
LEFT JOIN Specimen          sp ON ct.CaseID          = sp.CaseID
GROUP BY
    ct.CaseID, ct.CaseDate, ct.Status,
    cc.MLEF_No, ac.PM_No,
    cc.ClinicalCaseID, ac.AutopsyCaseID,
    p.FirstName, p.LastName, p.NIC,
    s.FirstName, s.LastName, s.Designation,
    ea.Name;


-- ----------------------------------------------------------
-- View 4: v_StaffWorkload
-- Purpose: JMO performance summary — clinical and autopsy case counts per staff member.
-- ----------------------------------------------------------
DROP VIEW IF EXISTS `v_StaffWorkload`;
CREATE VIEW `v_StaffWorkload` AS
SELECT
    s.StaffID,
    CONCAT(s.FirstName, ' ', s.LastName) AS JMOName,
    s.Designation,
    COUNT(DISTINCT cc.ClinicalCaseID)    AS ClinicalCasesHandled,
    COUNT(DISTINCT ac.AutopsyCaseID)     AS AutopsyCasesHandled,
    (COUNT(DISTINCT cc.ClinicalCaseID) +
     COUNT(DISTINCT ac.AutopsyCaseID))   AS TotalCasesHandled
FROM Staff s
LEFT JOIN ClinicalCase cc ON s.StaffID = cc.JMO_StaffID
LEFT JOIN AutopsyCase  ac ON s.StaffID = ac.JMO_StaffID
GROUP BY s.StaffID, s.FirstName, s.LastName, s.Designation;


-- ==========================================
-- 5. DATABASE AUTOMATION: STORED PROCEDURES
-- ==========================================

-- ----------------------------------------------------------
-- Procedure 1: RegisterNewPatient
-- Purpose: Atomic multi-table INSERT — Person (superclass) +
--          Patient (subclass) — wrapped in a transaction.
-- ----------------------------------------------------------
DROP PROCEDURE IF EXISTS `RegisterNewPatient`;

DELIMITER $$

CREATE PROCEDURE `RegisterNewPatient`(
    IN p_FirstName        VARCHAR(50),
    IN p_LastName         VARCHAR(50),
    IN p_DOB              DATE,
    IN p_Gender           ENUM('Male','Female','Other'),
    IN p_NIC              VARCHAR(20),
    IN p_Address          VARCHAR(255),
    IN p_EmergencyContact VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        -- Step 1: Insert into Person superclass
        INSERT INTO Person (FirstName, LastName, DOB, Gender, NIC)
        VALUES (p_FirstName, p_LastName, p_DOB, p_Gender, p_NIC);

        -- Step 2: Insert into Patient subclass using generated PersonID
        INSERT INTO Patient (PatientID, Address, EmergencyContact)
        VALUES (LAST_INSERT_ID(), p_Address, p_EmergencyContact);
    COMMIT;
END$$

DELIMITER ;


-- ----------------------------------------------------------
-- Procedure 2: CreateAutopsyCase
-- Purpose: Atomic creation of Person → Deceased → Case_Table →
--          AutopsyCase in a single transaction.
-- ----------------------------------------------------------
DROP PROCEDURE IF EXISTS `CreateAutopsyCase`;

DELIMITER $$

CREATE PROCEDURE `CreateAutopsyCase`(
    IN p_FirstName    VARCHAR(50),
    IN p_LastName     VARCHAR(50),
    IN p_DOB          DATE,
    IN p_Gender       ENUM('Male','Female','Other'),
    IN p_NIC          VARCHAR(20),
    IN p_DateOfDeath  DATE,
    IN p_TimeOfDeath  TIME,
    IN p_JMO_StaffID  INT,
    IN p_PM_No        VARCHAR(50),
    IN p_PlaceOfDeath VARCHAR(255),
    IN p_AutopsyDate  DATETIME,
    OUT p_NewCaseID   INT
)
BEGIN
    DECLARE v_PersonID INT;
    DECLARE v_CaseID   INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        -- Step 1: Register deceased individual in Person superclass
        INSERT INTO Person (FirstName, LastName, DOB, Gender, NIC)
        VALUES (p_FirstName, p_LastName, p_DOB, p_Gender, p_NIC);
        SET v_PersonID = LAST_INSERT_ID();

        -- Step 2: Create Deceased subclass record
        INSERT INTO Deceased (DeceasedID, DateOfDeath, TimeOfDeath)
        VALUES (v_PersonID, p_DateOfDeath, p_TimeOfDeath);

        -- Step 3: Create base Case_Table superclass record
        INSERT INTO Case_Table (CaseDate, Status)
        VALUES (CURDATE(), 'Open');
        SET v_CaseID = LAST_INSERT_ID();

        -- Step 4: Create AutopsyCase subclass record
        INSERT INTO AutopsyCase (AutopsyCaseID, DeceasedID, JMO_StaffID, PM_No, PlaceOfDeath, AutopsyDate)
        VALUES (v_CaseID, v_PersonID, p_JMO_StaffID, p_PM_No, p_PlaceOfDeath, p_AutopsyDate);

        -- Return the new CaseID to the caller
        SET p_NewCaseID = v_CaseID;
    COMMIT;
END$$

DELIMITER ;


-- ==========================================
-- 6. DATABASE AUTOMATION: TRIGGERS
-- ==========================================

-- ----------------------------------------------------------
-- Trigger 1: AFTER UPDATE — LabRequest
-- Logs a status change audit entry when a lab request status is updated.
-- ----------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_LabRequest_AfterUpdate`;

DELIMITER $$
CREATE TRIGGER `trg_LabRequest_AfterUpdate`
AFTER UPDATE ON `LabRequest`
FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO AuditLog (UserID, Action, TableName, RecordID)
        VALUES (
            COALESCE(@current_user_id, 1),
            CONCAT('Lab request status changed: "', OLD.Status, '" -> "', NEW.Status, '"'),
            'LabRequest',
            NEW.RequestID
        );
    END IF;
END$$
DELIMITER ;



-- ----------------------------------------------------------
-- Trigger 3: AFTER UPDATE — IntoxicationRecord
-- Logs substance and influence details whenever an intoxication record is modified.
-- ----------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_IntoxicationRecord_AfterUpdate`;

DELIMITER $$
CREATE TRIGGER `trg_IntoxicationRecord_AfterUpdate`
AFTER UPDATE ON `IntoxicationRecord`
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (UserID, Action, TableName, RecordID)
    VALUES (
        COALESCE(@current_user_id, 1),
        CONCAT('Intoxication record modified for CaseID ', NEW.CaseID,
               '. Substance: ', COALESCE(NEW.SubstanceType, 'None'),
               ', Under influence: ', IF(NEW.UnderInfluence, 'Yes', 'No')),
        'IntoxicationRecord',
        NEW.RecordID
    );
END$$
DELIMITER ;


-- ----------------------------------------------------------
-- Trigger 4: AFTER INSERT — Specimen
-- Logs chain-of-custody details whenever a new specimen is collected.
-- ----------------------------------------------------------
DROP TRIGGER IF EXISTS `trg_Specimen_AfterInsert`;

DELIMITER $$
CREATE TRIGGER `trg_Specimen_AfterInsert`
AFTER INSERT ON `Specimen`
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (UserID, Action, TableName, RecordID)
    VALUES (
        COALESCE(@current_user_id, 1),
        CONCAT('Specimen chain-of-custody initiated. Type: ', NEW.SpecimenType,
               ', Stored at: ', COALESCE(NEW.StorageLocation, 'Not specified'),
               ', Collected: ', DATE_FORMAT(NEW.CollectedDate, '%Y-%m-%d')),
        'Specimen',
        NEW.SpecimenID
    );
END$$
DELIMITER ;


-- ==========================================
-- 7. DATABASE OPTIMIZATION: INDEXES
-- ==========================================
-- Single-column indexes on high-frequency filter columns
-- to improve query performance on status and type lookups.

CREATE INDEX `idx_case_status`       ON `Case_Table` (`Status`);
CREATE INDEX `idx_labrequest_status` ON `LabRequest`  (`Status`);
CREATE INDEX `idx_specimen_type`     ON `Specimen`    (`SpecimenType`);


-- ==========================================
-- 8. SAMPLE DATA FOR NEW TABLES
-- ==========================================
-- References PersonIDs and StaffIDs inserted by seed_data.sql.
-- Must be run AFTER seed_data.sql.

-- JMOStaff: Specialization records for JMO-designated staff
INSERT INTO `JMOStaff` (StaffID, BoardCertificationNo, YearOfSeniority) VALUES
(2, 'SLMC/JMO/2010/4521', 14),   -- Dr. Nimal Bandara, Consultant JMO
(3, 'SLMC/JMO/2018/8834', 6);    -- Dr. Anura Perera, Acting JMO

-- LabStaff: Specialization records for laboratory-designated staff
INSERT INTO `LabStaff` (StaffID, LabCertificationID) VALUES
(6, 'GAD/LAB/2019/0076');        -- Kasun Silva, Lab Technician

-- PersonContact: Multivalued phone numbers mapped to persons
INSERT INTO `PersonContact` (PersonID, PhoneNumber, ContactLabel) VALUES
(1, '0771234567', 'Primary'),    -- Nimal Bandara
(1, '0112233445', 'Work'),
(2, '0769876543', 'Primary'),    -- Kamala Herath
(2, '0765551234', 'Emergency'),
(5, '0754321098', 'Primary'),    -- Ruwan Silva
(7, '0711122334', 'Primary'),    -- Kasun Rathnayake
(8, '0723344556', 'Primary');    -- Tharushi Perera

-- CaseAssistant: M:N mapping of staff assisting on cases
INSERT INTO `CaseAssistant` (CaseID, StaffID, AssignedRole) VALUES
(1, 4, 'Assistant'),             -- Saman Kumara assisting on Case 1
(2, 4, 'Assistant'),             -- Saman Kumara assisting on Case 2
(3, 4, 'Witness'),               -- Saman Kumara as witness on Case 3
(5, 5, 'Consultant');            -- Dr. Kamal Fernando consulting on Case 5
