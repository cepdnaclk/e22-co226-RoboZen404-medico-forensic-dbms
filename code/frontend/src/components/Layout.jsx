import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, FileText, Users, FlaskConical, Scale, Settings, LogOut, Activity, Bell, ClipboardList, BarChart3 } from 'lucide-react';
import api from '../api';

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));

    api.getNotifications()
      .then(data => setNotifications(data))
      .catch(err => console.error("Failed to load notifications", err));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const markRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.filter(n => n.NotificationID !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Logo" />
        </div>

        <nav>
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} end>
            <Home size={20} /> <span className="nav-section-label">Dashboard</span>
          </NavLink>
          <NavLink to="/clinical" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <FileText size={20} /> <span className="nav-section-label">Clinical Cases</span>
          </NavLink>
          {user.role !== 'Doctor' && (
            <NavLink to="/autopsy" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Activity size={20} /> <span className="nav-section-label">Autopsy Cases</span>
            </NavLink>
          )}
          <NavLink to="/patients" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} /> <span className="nav-section-label">Patients</span>
          </NavLink>
          <NavLink to="/lab" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <FlaskConical size={20} /> <span className="nav-section-label">Lab Management</span>
          </NavLink>
          <NavLink to="/reports" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Scale size={20} /> <span className="nav-section-label">Court Reports</span>
          </NavLink>
          {user.role === 'Admin' && (
            <>
              <NavLink to="/staff" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <ClipboardList size={20} /> <span className="nav-section-label">Staff Management</span>
              </NavLink>
              <NavLink to="/report-dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                <BarChart3 size={20} /> <span className="nav-section-label">Report Generation</span>
              </NavLink>
            </>
          )}
          <NavLink to="/settings" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings size={20} /> <span className="nav-section-label">Settings</span>
          </NavLink>
        </nav>

        <div className="user-profile-widget" onClick={() => navigate('/settings')}>
          <div className="avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-profile-info">
            <div className="name">{user.username}</div>
            <div className="role">{user.role}</div>
          </div>
          <button className="logout-btn" onClick={(e) => { e.stopPropagation(); handleLogout(); }} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '2rem', right: '0', zIndex: 100 }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              width: '42px', height: '42px', borderRadius: '50%', 
              background: 'white', border: 'none', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: 'var(--shadow-hover)',
              position: 'relative', top: '3px', left: '-10px'
            }}
          >
            <Bell size={20} color="var(--label)" />
            {notifications.length > 0 && (
              <span style={{ 
                position: 'absolute', top: '0px', right: '0px', 
                width: '12px', height: '12px', backgroundColor: 'var(--red)', 
                borderRadius: '50%', border: '2px solid white' 
              }}></span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: '120%', right: 0, width: '320px', 
              background: 'white', borderRadius: 'var(--radius-md)', 
              boxShadow: 'var(--shadow-floating)', zIndex: 100,
              maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--separator)'
            }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--separator)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                <span>Notifications</span>
                <span style={{ fontSize: '0.75rem', background: 'var(--system-bg)', padding: '0.1rem 0.5rem', borderRadius: '10px' }}>{notifications.length} New</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', color: 'var(--secondary-label)', fontSize: '0.875rem', textAlign: 'center' }}>You're all caught up!</div>
              ) : (
                notifications.map(n => (
                  <div key={n.NotificationID} style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid var(--separator)', 
                    fontSize: '0.875rem',
                    background: 'var(--blue-50)',
                    borderLeft: '3px solid var(--blue)',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      color: 'var(--blue)', boxShadow: 'var(--shadow-sm)'
                    }}>
                      <Bell size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--blue-700)' }}>
                          {n.Message.includes('Autopsy') ? 'Autopsy Assignment' : n.Message.includes('Clinical') ? 'Clinical Assignment' : 'System Alert'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--tertiary-label)' }}>{new Date(n.CreatedAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: 'var(--secondary-label)', marginBottom: '0.75rem', lineHeight: '1.4' }}>{n.Message}</div>
                      <button 
                        onClick={() => markRead(n.NotificationID)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        Mark as read
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
