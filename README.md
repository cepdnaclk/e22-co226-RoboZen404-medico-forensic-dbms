# 🏥 Medico Forensic Database Management System (MFDBMS)

A professional, full stack database management system meticulously engineered to digitalize and streamline the intricate workflows of forensic medical departments. This system robustly manages clinical cases, autopsies, court reports, and laboratory evidence, replacing antiquated paper based procedures with a secure, highly responsive digital solution.

## ✨ Key Features & Capabilities

* **Comprehensive Case Management:** Securely log and track both clinical and autopsy cases with deep data relational integrity.
* **Dynamic Internal Examinations:** Leverages advanced JSON structures to dynamically capture complex anatomical findings and forensic measurements.
* **Automated Court Report Generation:** Programmatically generate pixel perfect, standardized PDFs including Medico Legal Examination Forms (MLEF), Medico Legal Reports (MLR), Post Mortem Reports (PMR), and Detailed Internal Examination Reports.
* **Smart Notification System:** Real time dashboard notifications that instantly alert the relevant JMOs and medical staff when new cases are assigned to them.
* **Laboratory Evidence Tracking:** Manage forensic evidence, specimen storage, and lab requests seamlessly.
* **Secure Attachment Handling:** Direct file upload integration allowing lab staff to securely attach laboratory results and digital evidence to case files.
* **Real time Analytical Dashboard:** Instantly track active cases, pending lab reports, and upcoming court summons with interactive data visualization.
* **Role Based Access Control (RBAC):** Secure access levels specifically tailored for Judicial Medical Officers (JMOs), Medical Officers, and Lab Technicians.
* **Premium User Interface:** A highly polished, aesthetic, and responsive user experience built with modern glassmorphic design principles and interactive micro animations.

## 💻 Technology Stack

* **Frontend:** React, Vite, Recharts, Lucide Icons
* **Backend:** Node.js, Express.js, Multer (for file uploads)
* **Database:** MySQL (Structured Relational Data & Native JSON)
* **Document Generation:** html2canvas, jsPDF

***

## 🛠️ Local Development Setup Guide

If you are a team member pulling this repository, please follow these steps to set up the project locally.

### 1. Database Initialization

The database schema and relational structures are included in this repository.

1. Open **MySQL Workbench** or your preferred MySQL client.
2. Run the main schema file to create the tables:
   👉 `code/database/ForensicSys.sql`
3. Run the seed data script to populate the system with dummy data for testing:
   👉 `code/database/seed_data.sql`

### 2. Backend Configuration

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd code/backend
   ```
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `code/backend` folder with your local database credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=ForensicMedicalDB
   PORT=5000
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```

### 3. Frontend Initialization

1. Open a second terminal window and navigate to the frontend directory:
   ```bash
   cd code/frontend
   ```
2. Install the React dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. The application will be immediately available at `http://localhost:5173`.
