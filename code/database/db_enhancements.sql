-- ==============================================================================
-- Medico-Forensic DBMS - Schema Enhancements & Advanced DB Concepts
-- ==============================================================================
-- This script implements EER Specialization/Generalization, Multivalued Attributes,
-- M:N Relationships, Advanced SQL Views, Stored Procedures, Triggers, and Indexes.
-- All changes are non-destructive and fully compatible with the existing backend.
-- ==============================================================================

USE `ForensicMedicalDB`;

-- ==========================================
-- 1. EER SPECIALIZATION & GENERALIZATION
-- ==========================================

-- Subclass: JMO Staff (Specialization of Staff superclass)
CREATE TABLE IF NOT EXISTS `JMOStaff` (
  `StaffID` int NOT NULL,
  `BoardCertificationNo` varchar(50) NOT NULL,
  `YearOfSeniority` int DEFAULT NULL,
  PRIMARY KEY (`StaffID`),
  CONSTRAINT `jmostaff_ibfk_1` FOREIGN KEY (`StaffID`) REFERENCES `Staff` (`StaffID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Subclass: Lab Staff (Specialization of Staff superclass)
CREATE TABLE IF NOT EXISTS `LabStaff` (
  `StaffID` int NOT NULL,
  `LabCertificationID` varchar(50) NOT NULL,
  PRIMARY KEY (`StaffID`),
  CONSTRAINT `labstaff_ibfk_1` FOREIGN KEY (`StaffID`) REFERENCES `Staff` (`StaffID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- 2. MULTIVALUED ATTRIBUTES
-- ==========================================

-- Multivalued Attribute: Person Phone Numbers (1NF Compliance for Person)
CREATE TABLE IF NOT EXISTS `PersonContact` (
  `PersonID` int NOT NULL,
  `PhoneNumber` varchar(20) NOT NULL,
  `ContactLabel` varchar(50) DEFAULT 'Primary',
  PRIMARY KEY (`PersonID`, `PhoneNumber`),
  CONSTRAINT `personcontact_ibfk_1` FOREIGN KEY (`PersonID`) REFERENCES `Person` (`PersonID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- 3. M:N RELATIONSHIPS
-- ==========================================

-- M:N Junction: Case Assistant (Mapping Case_Table to Staff for Assisting Officers)
CREATE TABLE IF NOT EXISTS `CaseAssistant` (
  `CaseID` int NOT NULL,
  `StaffID` int NOT NULL,
  `AssignedRole` varchar(100) DEFAULT 'Assistant',
  `AssignedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CaseID`, `StaffID`),
  CONSTRAINT `caseassistant_ibfk_1` FOREIGN KEY (`CaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE,
  CONSTRAINT `caseassistant_ibfk_2` FOREIGN KEY (`StaffID`) REFERENCES `Staff` (`StaffID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- 4. ADVANCED SQL VIEWS
-- ==========================================

-- View: PendingLabRequests (Fixes dummy placeholder view for Pending Lab Requests)
DROP VIEW IF EXISTS `PendingLabRequests`;
CREATE VIEW `PendingLabRequests` AS
SELECT 
  lr.RequestID,
  s.SpecimenType,
  lr.RequestDate,
  ea.Name AS LabName,
  lr.AnalysisRequired,
  ct.CaseID
FROM LabRequest lr
JOIN Specimen s ON lr.SpecimenID = s.SpecimenID
JOIN ExternalAuthority ea ON lr.TargetLabID = ea.AuthID
JOIN Case_Table ct ON s.CaseID = ct.CaseID
WHERE lr.Status = 'Pending';

-- View: mlr_dashboard (Consolidated live case report for Clinical & Autopsy dashboard)
DROP VIEW IF EXISTS `mlr_dashboard`;
CREATE VIEW `mlr_dashboard` AS
SELECT 
  ct.CaseID,
  ct.CaseDate,
  ct.Status,
  'Clinical' AS CaseType,
  c.MLEF_No AS ReferenceNo,
  CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
  CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
FROM Case_Table ct
JOIN ClinicalCase c ON ct.CaseID = c.ClinicalCaseID
JOIN Patient pat ON c.PatientID = pat.PatientID
JOIN Person p ON pat.PatientID = p.PersonID
JOIN Staff s ON c.JMO_StaffID = s.StaffID
UNION ALL
SELECT 
  ct.CaseID,
  ct.CaseDate,
  ct.Status,
  'Autopsy' AS CaseType,
  a.PM_No AS ReferenceNo,
  CONCAT(p.FirstName, ' ', p.LastName) AS SubjectName,
  CONCAT(s.FirstName, ' ', s.LastName) AS JMOName
FROM Case_Table ct
JOIN AutopsyCase a ON ct.CaseID = a.AutopsyCaseID
JOIN Deceased d ON a.DeceasedID = d.DeceasedID
JOIN Person p ON d.DeceasedID = p.PersonID
JOIN Staff s ON a.JMO_StaffID = s.StaffID;


-- ==========================================
-- 5. DATABASE AUTOMATION: STORED PROCEDURES
-- ==========================================

-- Stored Procedure: RegisterNewPatient (Atomic Patient & Person Registration)
DROP PROCEDURE IF EXISTS `RegisterNewPatient`;

DELIMITER $$

CREATE PROCEDURE `RegisterNewPatient`(
    IN p_FirstName VARCHAR(50),
    IN p_LastName VARCHAR(50),
    IN p_DOB DATE,
    IN p_Gender ENUM('Male','Female','Other'),
    IN p_NIC VARCHAR(20),
    IN p_Address VARCHAR(255),
    IN p_EmergencyContact VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
        -- 1. Insert into Person superclass
        INSERT INTO Person (FirstName, LastName, DOB, Gender, NIC)
        VALUES (p_FirstName, p_LastName, p_DOB, p_Gender, p_NIC);
        
        -- 2. Insert into Patient subclass using generated PersonID
        INSERT INTO Patient (PatientID, Address, EmergencyContact)
        VALUES (LAST_INSERT_ID(), p_Address, p_EmergencyContact);
    COMMIT;
END$$

DELIMITER ;


-- ==========================================
-- 6. DATABASE AUTOMATION: AFTER UPDATE TRIGGERS
-- ==========================================

-- Trigger: LabRequest Status Changes
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

-- Trigger: CourtSummons Status Changes
DROP TRIGGER IF EXISTS `trg_CourtSummons_AfterUpdate`;

DELIMITER $$
CREATE TRIGGER `trg_CourtSummons_AfterUpdate`
AFTER UPDATE ON `CourtSummons`
FOR EACH ROW
BEGIN
    IF OLD.Status <> NEW.Status THEN
        INSERT INTO AuditLog (UserID, Action, TableName, RecordID)
        VALUES (
            COALESCE(@current_user_id, 1),
            CONCAT('Court summons for Case "', NEW.CaseNo, '" updated: "', OLD.Status, '" -> "', NEW.Status, '"'),
            'CourtSummons',
            NEW.SummonsID
        );
    END IF;
END$$
DELIMITER ;

-- Trigger: IntoxicationRecord Modification
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
               '. Under influence: ', IF(NEW.UnderInfluence, 'Yes', 'No')),
        'IntoxicationRecord',
        NEW.RecordID
    );
END$$
DELIMITER ;


-- ==========================================
-- 7. DATABASE OPTIMIZATION: INDEXES
-- ==========================================

CREATE INDEX `idx_case_status` ON `Case_Table` (`Status`);
CREATE INDEX `idx_labrequest_status` ON `LabRequest` (`Status`);
CREATE INDEX `idx_courtsummons_status` ON `CourtSummons` (`Status`);
CREATE INDEX `idx_specimen_type` ON `Specimen` (`SpecimenType`);
