# Medico-Forensic DBMS 🏥🔍

A comprehensive database management system designed to streamline and digitize the workflows of forensic medical departments. This system effectively manages clinical cases, autopsies, court reports, and laboratory evidence, replacing outdated paper-based procedures.

## 🚀 Key Features

* **Clinical & Autopsy Case Management:** Securely log and track patient cases, injuries, and post-mortem examinations.
* **Automated Court Reports:** Generate standardized Medico-Legal Examination Forms (MLEF) and Post-Mortem Reports (PMR) in ready-to-print PDF formats.
* **Laboratory Tracking:** Manage evidence, specimen storage, and lab requests seamlessly.
* **Real-time Dashboard:** Track active cases, pending lab reports, and upcoming court summons at a glance.
* **Role-Based Access Control:** Secure access levels tailored for JMOs, Medical Officers, and Lab Technicians.

## 💻 Tech Stack

* **Frontend:** React, Vite, Lucide Icons
* **Backend:** Node.js, Express.js
* **Database:** MySQL
* **Tools:** html2canvas, jsPDF (for report generation)

---

## 🛠️ Local Development Setup Guide

If you are a team member pulling this repository, please follow these steps to set up the project locally.

### 1. Database Setup
The database schema is included in this repository.

1. Open **MySQL Workbench** or your preferred MySQL client.
2. Run the main schema file to create the tables: 
   👉 `code/database/ForensicSys.sql`
3. Run the seed data script to populate the system with dummy data for testing: 
   👉 `code/database/seed_data.sql`

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
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

### 3. Frontend Setup
1. Open a second terminal window and navigate to the frontend folder:
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
4. The application will be available at `http://localhost:5173`.
