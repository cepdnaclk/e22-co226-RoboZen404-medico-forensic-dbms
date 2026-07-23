# Medico-Legal Database System - Frontend

This is the frontend application for the **Medico-Legal Database System (ForensicSys)**. It is built using modern web technologies to provide a clean, intuitive, and responsive interface for medical officers, clerks, and administrators to manage forensic cases, patient records, lab requests, and reports.

## 🛠 Technology Stack

- **Framework:** [React 18](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/) for lightning-fast HMR and optimized builds
- **Icons:** [Lucide React](https://lucide.dev/) for consistent, clean iconography
- **Styling:** Custom CSS with CSS Variables for a modern, unified design system
- **PDF Generation:** `html2canvas` and `jspdf` for generating printable forms like the Post-Mortem Report (Health 14)

## ✨ Key Features

- **Role-Based Dashboards:** Distinct views and permissions for Admins, JMOs (Judicial Medical Officers), and Clerks.
- **Patient Management:** Register and track demographics for both clinical and deceased patients.
- **Clinical Case (MLEF) Management:** Record injuries, weapons, and intoxication details with robust case tracking.
- **Autopsy Case Management:** Detailed internal examination forms (head, thorax, abdomen, pelvis) and comprehensive Post-Mortem Report generation.
- **Lab & Specimen Tracking:** Dispatch specimens to internal or external labs and track their status and results.
- **Audit Logging:** Admin dashboard features a read-only audit log tracking every major system action.
- **Evidence QR:** Automatically generate and print QR codes to tag case evidence and documents.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine. You also need to ensure that the **Backend Server** is running on `http://localhost:5001`.

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd code/frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

### Building for Production

To build the app for production, run:
```bash
npm run build
```
This will generate an optimized build in the `dist` folder, ready to be served by any static file server.

## 🔑 Default Logins

When testing the application locally with the provided `seed_data.sql` in the backend, you can use the following default credentials:

- **Admin User:** `admin` / `password`
- **JMO User:** `jmo_nimal` / `jmo123`
- **Clerk User:** `clerk_sunil` / `clerk123`
