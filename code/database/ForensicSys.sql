-- ==============================================================================
-- Medico-Forensic DBMS - Database Schema
-- ==============================================================================
-- This script creates all the necessary tables, views, and relationships.
-- Run this script to initialize a fresh database structure.
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `ForensicMedicalDB`;
USE `ForensicMedicalDB`;

-- ==========================================
-- 1. TABLES
-- ==========================================

DROP TABLE IF EXISTS `AuditLog`;

CREATE TABLE `AuditLog` (
  `LogID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Action` varchar(255) NOT NULL,
  `TableName` varchar(50) NOT NULL,
  `RecordID` int DEFAULT NULL,
  `Timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`LogID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `auditlog_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `UserAccount` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `AutopsyCase`;

CREATE TABLE `AutopsyCase` (
  `AutopsyCaseID` int NOT NULL,
  `DeceasedID` int NOT NULL,
  `JMO_StaffID` int NOT NULL,
  `PM_No` varchar(50) DEFAULT NULL,
  `PlaceOfDeath` varchar(255) DEFAULT NULL,
  `AutopsyDate` datetime DEFAULT NULL,
  PRIMARY KEY (`AutopsyCaseID`),
  UNIQUE KEY `PM_No` (`PM_No`),
  KEY `DeceasedID` (`DeceasedID`),
  KEY `JMO_StaffID` (`JMO_StaffID`),
  CONSTRAINT `autopsycase_ibfk_1` FOREIGN KEY (`AutopsyCaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE,
  CONSTRAINT `autopsycase_ibfk_2` FOREIGN KEY (`DeceasedID`) REFERENCES `Deceased` (`DeceasedID`),
  CONSTRAINT `autopsycase_ibfk_3` FOREIGN KEY (`JMO_StaffID`) REFERENCES `Staff` (`StaffID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Case_Table`;

CREATE TABLE `Case_Table` (
  `CaseID` int NOT NULL AUTO_INCREMENT,
  `CaseDate` date NOT NULL,
  `Status` varchar(50) DEFAULT 'Open',
  PRIMARY KEY (`CaseID`),
  KEY `idx_case_date` (`CaseDate`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `CaseDocument`;

CREATE TABLE `CaseDocument` (
  `DocumentID` int NOT NULL AUTO_INCREMENT,
  `CaseID` int NOT NULL,
  `DocumentType` enum('MLEF Copy','Photograph','Referral Report','Summons','Issued Report','Receipt','Other') NOT NULL,
  `FileName` varchar(255) NOT NULL,
  `FilePath` varchar(255) NOT NULL,
  `UploadedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`DocumentID`),
  KEY `CaseID` (`CaseID`),
  CONSTRAINT `casedocument_ibfk_1` FOREIGN KEY (`CaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `CaseWeapon`;

CREATE TABLE `CaseWeapon` (
  `CaseWeaponID` int NOT NULL AUTO_INCREMENT,
  `CaseID` int NOT NULL,
  `WeaponID` int NOT NULL,
  `Details` text,
  PRIMARY KEY (`CaseWeaponID`),
  KEY `CaseID` (`CaseID`),
  KEY `WeaponID` (`WeaponID`),
  CONSTRAINT `caseweapon_ibfk_1` FOREIGN KEY (`CaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE,
  CONSTRAINT `caseweapon_ibfk_2` FOREIGN KEY (`WeaponID`) REFERENCES `Weapon` (`WeaponID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `CauseOfDeath`;

CREATE TABLE `CauseOfDeath` (
  `COD_ID` int NOT NULL AUTO_INCREMENT,
  `AutopsyCaseID` int NOT NULL,
  `ImmediateCause` varchar(255) NOT NULL,
  `AntecedentCause` varchar(255) DEFAULT NULL,
  `UnderlyingCause` varchar(255) DEFAULT NULL,
  `ContributoryCause` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`COD_ID`),
  UNIQUE KEY `AutopsyCaseID` (`AutopsyCaseID`),
  CONSTRAINT `causeofdeath_ibfk_1` FOREIGN KEY (`AutopsyCaseID`) REFERENCES `AutopsyCase` (`AutopsyCaseID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `ClinicalCase`;

CREATE TABLE `ClinicalCase` (
  `ClinicalCaseID` int NOT NULL,
  `PatientID` int NOT NULL,
  `JMO_StaffID` int NOT NULL,
  `PoliceStationID` int DEFAULT NULL,
  `MLEF_No` varchar(50) DEFAULT NULL,
  `AdmissionDate` datetime DEFAULT NULL,
  `DateOfIssue` date DEFAULT NULL,
  `ReasonForExamination` varchar(500) DEFAULT NULL,
  `PoliceOfficerName` varchar(255) DEFAULT NULL,
  `PoliceOfficerRank` varchar(100) DEFAULT NULL,
  `PoliceOfficerRegNo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ClinicalCaseID`),
  UNIQUE KEY `MLEF_No` (`MLEF_No`),
  KEY `PatientID` (`PatientID`),
  KEY `JMO_StaffID` (`JMO_StaffID`),
  KEY `PoliceStationID` (`PoliceStationID`),
  CONSTRAINT `clinicalcase_ibfk_1` FOREIGN KEY (`ClinicalCaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE,
  CONSTRAINT `clinicalcase_ibfk_2` FOREIGN KEY (`PatientID`) REFERENCES `Patient` (`PatientID`),
  CONSTRAINT `clinicalcase_ibfk_3` FOREIGN KEY (`JMO_StaffID`) REFERENCES `Staff` (`StaffID`),
  CONSTRAINT `clinicalcase_ibfk_5` FOREIGN KEY (`PoliceStationID`) REFERENCES `ExternalAuthority` (`AuthID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `CourtReport`;

CREATE TABLE `CourtReport` (
  `ReportID` int NOT NULL AUTO_INCREMENT,
  `CaseID` int NOT NULL,
  `ReportType` varchar(50) NOT NULL,
  `IssueDate` date DEFAULT NULL,
  `SignedByStaffID` int NOT NULL,
  `FilePath` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ReportID`),
  KEY `CaseID` (`CaseID`),
  KEY `SignedByStaffID` (`SignedByStaffID`),
  CONSTRAINT `courtreport_ibfk_1` FOREIGN KEY (`CaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE,
  CONSTRAINT `courtreport_ibfk_2` FOREIGN KEY (`SignedByStaffID`) REFERENCES `Staff` (`StaffID`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `CourtSummons`;

CREATE TABLE `CourtSummons` (
  `SummonsID` int NOT NULL AUTO_INCREMENT,
  `StaffID` int NOT NULL,
  `AuthorityID` int NOT NULL,
  `CaseNo` varchar(50) NOT NULL,
  `RequiredDate` date NOT NULL,
  `Status` enum('Pending','Attended','Dismissed') DEFAULT 'Pending',
  PRIMARY KEY (`SummonsID`),
  KEY `StaffID` (`StaffID`),
  KEY `AuthorityID` (`AuthorityID`),
  CONSTRAINT `courtsummons_ibfk_1` FOREIGN KEY (`StaffID`) REFERENCES `Staff` (`StaffID`),
  CONSTRAINT `courtsummons_ibfk_2` FOREIGN KEY (`AuthorityID`) REFERENCES `ExternalAuthority` (`AuthID`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Deceased`;

CREATE TABLE `Deceased` (
  `DeceasedID` int NOT NULL,
  `DateOfDeath` date DEFAULT NULL,
  `TimeOfDeath` time DEFAULT NULL,
  PRIMARY KEY (`DeceasedID`),
  CONSTRAINT `deceased_ibfk_1` FOREIGN KEY (`DeceasedID`) REFERENCES `Person` (`PersonID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Department`;

CREATE TABLE `Department` (
  `DeptID` int NOT NULL AUTO_INCREMENT,
  `DeptName` varchar(100) NOT NULL,
  `Location` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`DeptID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `ExternalAuthority`;

CREATE TABLE `ExternalAuthority` (
  `AuthID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Type` enum('Police','Court','Government Analyst','Other') NOT NULL,
  `ContactInfo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`AuthID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Injury`;

CREATE TABLE `Injury` (
  `InjuryID` int NOT NULL AUTO_INCREMENT,
  `CaseID` int NOT NULL,
  `Type` varchar(50) NOT NULL,
  `Dimensions` varchar(50) DEFAULT NULL,
  `Location` varchar(100) DEFAULT NULL,
  `Description` text,
  PRIMARY KEY (`InjuryID`),
  KEY `CaseID` (`CaseID`),
  CONSTRAINT `injury_ibfk_1` FOREIGN KEY (`CaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `InquestOrder`;

CREATE TABLE `InquestOrder` (
  `InquestID` int NOT NULL AUTO_INCREMENT,
  `AutopsyCaseID` int NOT NULL,
  `AuthorityID` int NOT NULL,
  `CaseNumber` varchar(50) DEFAULT NULL,
  `DateOfIssue` date DEFAULT NULL,
  PRIMARY KEY (`InquestID`),
  UNIQUE KEY `AutopsyCaseID` (`AutopsyCaseID`),
  KEY `AuthorityID` (`AuthorityID`),
  CONSTRAINT `inquestorder_ibfk_1` FOREIGN KEY (`AutopsyCaseID`) REFERENCES `AutopsyCase` (`AutopsyCaseID`),
  CONSTRAINT `inquestorder_ibfk_2` FOREIGN KEY (`AuthorityID`) REFERENCES `ExternalAuthority` (`AuthID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `InternalExamination`;

CREATE TABLE `InternalExamination` (
  `InternalExamID` int NOT NULL AUTO_INCREMENT,
  `AutopsyCaseID` int NOT NULL,
  `HeadDetails` text,
  `ThoraxDetails` text,
  `AbdomenDetails` text,
  PRIMARY KEY (`InternalExamID`),
  UNIQUE KEY `AutopsyCaseID` (`AutopsyCaseID`),
  CONSTRAINT `internalexamination_ibfk_1` FOREIGN KEY (`AutopsyCaseID`) REFERENCES `AutopsyCase` (`AutopsyCaseID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `IntoxicationRecord`;

CREATE TABLE `IntoxicationRecord` (
  `RecordID` int NOT NULL AUTO_INCREMENT,
  `CaseID` int NOT NULL,
  `SubstanceType` varchar(50) DEFAULT NULL,
  `Consumed` tinyint(1) DEFAULT '0',
  `UnderInfluence` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`RecordID`),
  KEY `CaseID` (`CaseID`),
  CONSTRAINT `intoxicationrecord_ibfk_1` FOREIGN KEY (`CaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `LabRequest`;

CREATE TABLE `LabRequest` (
  `RequestID` int NOT NULL AUTO_INCREMENT,
  `SpecimenID` int NOT NULL,
  `TargetLabID` int NOT NULL,
  `AnalysisRequired` text NOT NULL,
  `RequestDate` date NOT NULL,
  `Status` enum('Pending','Completed','Rejected') DEFAULT 'Pending',
  PRIMARY KEY (`RequestID`),
  KEY `SpecimenID` (`SpecimenID`),
  KEY `TargetLabID` (`TargetLabID`),
  CONSTRAINT `labrequest_ibfk_1` FOREIGN KEY (`SpecimenID`) REFERENCES `Specimen` (`SpecimenID`),
  CONSTRAINT `labrequest_ibfk_2` FOREIGN KEY (`TargetLabID`) REFERENCES `ExternalAuthority` (`AuthID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `LabResult`;

CREATE TABLE `LabResult` (
  `ResultID` int NOT NULL AUTO_INCREMENT,
  `RequestID` int NOT NULL,
  `ResultDetails` text NOT NULL,
  `ReceivedDate` date DEFAULT NULL,
  PRIMARY KEY (`ResultID`),
  UNIQUE KEY `RequestID` (`RequestID`),
  CONSTRAINT `labresult_ibfk_1` FOREIGN KEY (`RequestID`) REFERENCES `LabRequest` (`RequestID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `MLEF_PartB_Details`;

CREATE TABLE `MLEF_PartB_Details` (
  `DetailID` int NOT NULL AUTO_INCREMENT,
  `ClinicalCaseID` int NOT NULL,
  `ProducedBy` varchar(255) DEFAULT NULL,
  `ExaminationDate` datetime DEFAULT NULL,
  `ExaminationPlace` varchar(255) DEFAULT NULL,
  `DischargeDate` datetime DEFAULT NULL,
  `CausativeWeapon` varchar(255) DEFAULT NULL,
  `CategoryOfHurt` varchar(50) DEFAULT NULL,
  `EndangersLife` tinyint(1) DEFAULT '0',
  `Investigations` text,
  `Referrals` text,
  `Recommendations` text,
  `Remarks` text,
  PRIMARY KEY (`DetailID`),
  KEY `ClinicalCaseID` (`ClinicalCaseID`),
  CONSTRAINT `mlef_partb_details_ibfk_1` FOREIGN KEY (`ClinicalCaseID`) REFERENCES `ClinicalCase` (`ClinicalCaseID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `mlr_dashboard`;

/*!50001 CREATE VIEW `mlr_dashboard` AS SELECT 
 1 AS `CaseID`,
 1 AS `CaseDate`,
 1 AS `Status`,
 1 AS `CaseType`*/;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;

CREATE TABLE `Notification` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Message` text NOT NULL,
  `IsRead` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NotificationID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `UserAccount` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Patient`;

CREATE TABLE `Patient` (
  `PatientID` int NOT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `EmergencyContact` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`PatientID`),
  CONSTRAINT `patient_ibfk_1` FOREIGN KEY (`PatientID`) REFERENCES `Person` (`PersonID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `pendinglabrequests`;

/*!50001 CREATE VIEW `pendinglabrequests` AS SELECT 
 1 AS `RequestID`,
 1 AS `SpecimenType`,
 1 AS `RequestDate`,
 1 AS `LabName`*/;

--
-- Table structure for table `Person`
--

DROP TABLE IF EXISTS `Person`;

CREATE TABLE `Person` (
  `PersonID` int NOT NULL AUTO_INCREMENT,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `DOB` date DEFAULT NULL,
  `Gender` enum('Male','Female','Other') NOT NULL,
  `NIC` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`PersonID`),
  UNIQUE KEY `NIC` (`NIC`),
  KEY `idx_person_nic` (`NIC`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Role`;

CREATE TABLE `Role` (
  `RoleID` int NOT NULL AUTO_INCREMENT,
  `RoleName` varchar(50) NOT NULL,
  `Permissions` text,
  PRIMARY KEY (`RoleID`),
  UNIQUE KEY `RoleName` (`RoleName`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `SexualAssaultExam`;

CREATE TABLE `SexualAssaultExam` (
  `ExamID` int NOT NULL AUTO_INCREMENT,
  `ClinicalCaseID` int NOT NULL,
  `HymenStatus` varchar(255) DEFAULT NULL,
  `PenetrationSigns` varchar(255) DEFAULT NULL,
  `OtherSigns` text,
  PRIMARY KEY (`ExamID`),
  UNIQUE KEY `ClinicalCaseID` (`ClinicalCaseID`),
  CONSTRAINT `sexualassaultexam_ibfk_1` FOREIGN KEY (`ClinicalCaseID`) REFERENCES `ClinicalCase` (`ClinicalCaseID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Specimen`;

CREATE TABLE `Specimen` (
  `SpecimenID` int NOT NULL AUTO_INCREMENT,
  `CaseID` int NOT NULL,
  `SpecimenType` varchar(100) NOT NULL,
  `CollectedDate` date NOT NULL,
  `StorageLocation` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`SpecimenID`),
  KEY `CaseID` (`CaseID`),
  CONSTRAINT `specimen_ibfk_1` FOREIGN KEY (`CaseID`) REFERENCES `Case_Table` (`CaseID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Staff`;

CREATE TABLE `Staff` (
  `StaffID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `DeptID` int NOT NULL,
  `FirstName` varchar(50) NOT NULL,
  `LastName` varchar(50) NOT NULL,
  `Designation` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`StaffID`),
  UNIQUE KEY `UserID` (`UserID`),
  KEY `DeptID` (`DeptID`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `UserAccount` (`UserID`),
  CONSTRAINT `staff_ibfk_2` FOREIGN KEY (`DeptID`) REFERENCES `Department` (`DeptID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `UserAccount`;

CREATE TABLE `UserAccount` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `RoleID` int NOT NULL,
  `Username` varchar(50) NOT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Username` (`Username`),
  KEY `RoleID` (`RoleID`),
  CONSTRAINT `useraccount_ibfk_1` FOREIGN KEY (`RoleID`) REFERENCES `Role` (`RoleID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Ward`;

CREATE TABLE `Ward` (
  `WardID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(50) NOT NULL,
  `HospitalLocation` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`WardID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `Weapon`;

CREATE TABLE `Weapon` (
  `WeaponID` int NOT NULL AUTO_INCREMENT,
  `Type` enum('Blunt','Sharp','Firearm','Explosive','Other') NOT NULL,
  `Description` text,
  PRIMARY KEY (`WeaponID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

