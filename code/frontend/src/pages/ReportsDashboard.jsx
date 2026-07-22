import React, { useEffect, useState } from 'react';
import { Calendar, BarChart3, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

const TABS = [
  { key: 'daily', label: 'Daily Case Report', icon: Calendar },
  { key: 'monthly', label: 'Monthly Report', icon: BarChart3 },
  { key: 'pending', label: 'Pending Cases', icon: Clock },
  { key: 'stats', label: 'Statistical Report', icon: TrendingUp },
];

export default function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [daily, monthly, pending, stats] = await Promise.all([
          api.getDailyReport(),
          api.getMonthlyReport(),
          api.getPendingCases(),
          api.getStatistics(),
        ]);
        setDailyData(daily);
        setMonthlyData(monthly);
        setPendingData(pending);
        setStatsData(stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div>Loading reports...</div>;
  if (error) return <div className="login-error">{error}</div>;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="animate-in" style={{ padding: '0 1rem' }}>
      <div className="section-header">
        <div>
          <h1>Report Generation</h1>
          <p>Generate and view analytical reports from the forensic database</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                background: activeTab === tab.key ? '#000' : 'white',
                color: activeTab === tab.key ? '#fff' : 'var(--label)',
                boxShadow: activeTab === tab.key ? 'none' : 'var(--shadow)',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Daily Case Report */}
      {activeTab === 'daily' && (
        <div className="card table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Daily Case Report</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--secondary-label)' }}>{today}</span>
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
              {dailyData.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No cases registered today.</td></tr>
              ) : dailyData.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{c.RefNo}</td>
                  <td><span className={`badge ${c.CaseType?.toLowerCase()}`}>{c.CaseType}</span></td>
                  <td>{c.SubjectName}</td>
                  <td>{c.JMOName}</td>
                  <td>{new Date(c.CaseDate).toLocaleDateString()}</td>
                  <td><span className={`badge ${c.Status?.toLowerCase()}`}>{c.Status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly Report */}
      {activeTab === 'monthly' && monthlyData && (
        <div>
          <div className="stat-grid">
            <div className="card stat-card">
              <div className="stat-value">{monthlyData.totalThisMonth}</div>
              <div className="stat-label">CASES THIS MONTH</div>
              <Calendar size={100} className="stat-bg-icon" />
            </div>
            <div className="card stat-card">
              <div className="stat-value">{monthlyData.totalPatients}</div>
              <div className="stat-label">TOTAL PATIENTS</div>
              <BarChart3 size={100} className="stat-bg-icon" />
            </div>
            <div className="card stat-card">
              <div className="stat-value">{monthlyData.totalSpecimens}</div>
              <div className="stat-label">SPECIMENS COLLECTED</div>
              <TrendingUp size={100} className="stat-bg-icon" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Cases by Status</h3>
              {monthlyData.byStatus.length === 0 ? (
                <p style={{ color: 'var(--tertiary-label)', fontSize: '0.875rem' }}>No data available.</p>
              ) : monthlyData.byStatus.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--separator)' }}>
                  <span style={{ fontWeight: 500 }}>{row.Status}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{row.Total}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Cases by Type</h3>
              {monthlyData.byType.length === 0 ? (
                <p style={{ color: 'var(--tertiary-label)', fontSize: '0.875rem' }}>No data available.</p>
              ) : monthlyData.byType.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--separator)' }}>
                  <span style={{ fontWeight: 500 }}>{row.CaseType}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{row.Total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Cases */}
      {activeTab === 'pending' && (
        <div className="card table-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Pending / Open Cases</h2>
            <span className="badge open" style={{ fontSize: '0.85rem' }}>{pendingData.length} Open</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Reference</th>
                <th>Type</th>
                <th>Subject</th>
                <th>JMO</th>
                <th>Opened On</th>
              </tr>
            </thead>
            <tbody>
              {pendingData.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tertiary-label)', padding: '2rem' }}>No pending cases found.</td></tr>
              ) : pendingData.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>#{c.CaseID}</td>
                  <td>{c.RefNo}</td>
                  <td><span className={`badge ${c.CaseType?.toLowerCase()}`}>{c.CaseType}</span></td>
                  <td>{c.SubjectName}</td>
                  <td>{c.JMOName}</td>
                  <td>{new Date(c.CaseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistical Report */}
      {activeTab === 'stats' && statsData && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Cases by Month</h3>
              {statsData.casesByMonth.length === 0 ? (
                <p style={{ color: 'var(--tertiary-label)', fontSize: '0.875rem' }}>No data available.</p>
              ) : (
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={statsData.casesByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="Month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: 'var(--hover-bg)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="Total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Injury Type Distribution</h3>
              {statsData.injuryTypes.length === 0 ? (
                <p style={{ color: 'var(--tertiary-label)', fontSize: '0.875rem' }}>No data available.</p>
              ) : statsData.injuryTypes.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--separator)' }}>
                  <span style={{ fontWeight: 500 }}>{row.Type}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: `${Math.min(row.Total * 30, 200)}px`, height: '10px', background: 'var(--red)', borderRadius: '5px' }}></div>
                    <span style={{ fontWeight: 700 }}>{row.Total}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Lab Request Status</h3>
              {statsData.labStatus.length === 0 ? (
                <p style={{ color: 'var(--tertiary-label)', fontSize: '0.875rem' }}>No data available.</p>
              ) : statsData.labStatus.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--separator)' }}>
                  <span style={{ fontWeight: 500 }}>{row.Status}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{row.Total}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Overall Case Status</h3>
              {statsData.caseStatus.length === 0 ? (
                <p style={{ color: 'var(--tertiary-label)', fontSize: '0.875rem' }}>No data available.</p>
              ) : statsData.caseStatus.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--separator)' }}>
                  <span style={{ fontWeight: 500 }}>{row.Status}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{row.Total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
