import React, { useEffect, useState } from 'react';
import { Activity, FileText, AlertCircle, Users } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    async function load() {
      try {
        const [s, rc] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentCases()
        ]);
        setStats(s);
        const sortedRC = rc.sort((a, b) => new Date(b.CaseDate) - new Date(a.CaseDate)).slice(0, 8);
        setRecentCases(sortedRC);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div>Loading dashboard...</div>;
  if (error) return <div className="login-error">{error}</div>;

  return (
    <div className="animate-in" style={{ padding: '0 1rem' }}>
      <div className="section-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of the forensic department ecosystem</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-value">{stats?.activeCases || 0}</div>
          <div className="stat-label">ACTIVE CASES</div>
          <Activity size={100} className="stat-bg-icon" />
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats?.pendingReports || 0}</div>
          <div className="stat-label">PENDING LAB REPORTS</div>
          <FileText size={100} className="stat-bg-icon" />
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats?.courtDates || 0}</div>
          <div className="stat-label">COURT DATES</div>
          <AlertCircle size={100} className="stat-bg-icon" />
        </div>
        <div className="card stat-card">
          <div className="stat-value">{stats?.totalPatients || 0}</div>
          <div className="stat-label">TOTAL PATIENTS</div>
          <Users size={100} className="stat-bg-icon" />
        </div>
      </div>

      <div className="card table-card">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Activity</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Type</th>
              <th>Subject</th>
              <th>JMO</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentCases.filter(c => {
              if (user.role === 'Doctor' && c.CaseType === 'Autopsy') return false;
              return true;
            }).length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No recent activity.</td></tr>
            ) : recentCases.filter(c => {
              if (user.role === 'Doctor' && c.CaseType === 'Autopsy') return false;
              return true;
            }).map((c, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{c.RefNo}</td>
                <td>{c.CaseType}</td>
                <td>{c.SubjectName}</td>
                <td>{c.JMOName}</td>
                <td>{new Date(c.CaseDate).toLocaleDateString()}</td>
                <td><span className={`badge ${c.Status?.toLowerCase()}`}>{c.Status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
