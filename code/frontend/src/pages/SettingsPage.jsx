import React, { useEffect, useState } from 'react';
import api from '../api';

export default function SettingsPage() {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAuditLog();
        setAuditLog(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div className="animate-in">
      <div className="section-header">
        <div><h1>Settings</h1><p>System configuration and audit trail</p></div>
      </div>

      <div className="card detail-section" style={{ marginBottom: '1.5rem' }}>
        <h3>Current User</h3>
        <div className="detail-row"><span className="label">Name</span><span className="value">{user.name}</span></div>
        <div className="detail-row"><span className="label">Username</span><span className="value">{user.username}</span></div>
        <div className="detail-row"><span className="label">Role</span><span className="value">{user.role}</span></div>
        <div className="detail-row"><span className="label">Designation</span><span className="value">{user.designation}</span></div>
      </div>

      <div className="card table-card">
        <div style={{ padding: '1rem 1.25rem 0' }}><h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Audit Log</h2></div>
        {loading ? <div className="loading"><div className="spinner"></div>Loading...</div> : (
          <table>
            <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Table</th><th>Record</th></tr></thead>
            <tbody>
              {auditLog.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No audit entries.</td></tr>
              ) : auditLog.map(a => (
                <tr key={a.LogID}>
                  <td>{new Date(a.Timestamp).toLocaleString()}</td>
                  <td>{a.Username}</td>
                  <td>{a.Action}</td>
                  <td>{a.TableName}</td>
                  <td>{a.RecordID}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
