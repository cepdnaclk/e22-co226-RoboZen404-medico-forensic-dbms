const API_BASE = 'http://localhost:5001/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if ((res.status === 401 || res.status === 403) && endpoint !== '/auth/login') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  getDashboardStats: () => request('/dashboard/stats'),
  getRecentCases: () => request('/dashboard/recent-cases'),
  getAuditLog: () => request('/dashboard/audit-log'),

  getPatients: () => request('/patients'),
  getPatient: (id) => request(`/patients/${id}`),
  createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  getClinicalCases: () => request('/cases/clinical'),
  getClinicalCase: (id) => request(`/cases/clinical/${id}`),
  createClinicalCase: (data) => request('/cases/clinical', { method: 'POST', body: JSON.stringify(data) }),
  updateCaseStatus: (id, status) => request(`/cases/clinical/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateClinicalFindings: (id, data) => request(`/cases/clinical/${id}/findings`, { method: 'PUT', body: JSON.stringify(data) }),

  getAutopsyCases: () => request('/cases/autopsy'),
  getAutopsyCase: (id) => request(`/cases/autopsy/${id}`),
  createAutopsyCase: (data) => request('/cases/autopsy', { method: 'POST', body: JSON.stringify(data) }),
  updateAutopsyCaseStatus: (id, status) => request(`/cases/autopsy/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateAutopsyFindings: (id, data) => request(`/cases/autopsy/${id}/findings`, { method: 'PUT', body: JSON.stringify(data) }),
  getCaseDocuments: (caseId) => request(`/documents/${caseId}`),
  uploadCaseDocument: async (caseId, documentType, file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    
    const res = await fetch(`http://localhost:5001/api/documents/${caseId}`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },

  getSpecimens: () => request('/specimens'),
  getCaseSpecimens: (caseId) => request(`/specimens/case/${caseId}`),
  createSpecimen: (data) => request('/specimens', { method: 'POST', body: JSON.stringify(data) }),
  createLabRequest: (data) => request('/specimens/lab-request', { method: 'POST', body: JSON.stringify(data) }),
  addLabResult: (data) => request('/specimens/lab-result', { method: 'POST', body: JSON.stringify(data) }),
  updateLabResult: async (requestId, resultDetails, receivedDate, attachment) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('resultDetails', resultDetails);
    formData.append('receivedDate', receivedDate);
    if (attachment) formData.append('attachment', attachment);
    
    const res = await fetch(`${API_BASE}/specimens/${requestId}/result`, {
      method: 'PUT',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');
    return data;
  },
  getExternalLabs: () => request('/specimens/labs'),

  getReports: () => request('/reports'),
  createReport: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  getSummons: () => request('/reports/summons'),
  createSummons: (data) => request('/reports/summons', { method: 'POST', body: JSON.stringify(data) }),
  updateSummonsStatus: (id, status) => request(`/reports/summons/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getStaff: () => request('/staff'),
  createStaff: (data) => request('/staff', { method: 'POST', body: JSON.stringify(data) }),
  getWards: () => request('/staff/wards'),
  getAuthorities: () => request('/staff/authorities'),
  getNotifications: () => request('/notifications/unread'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),

  getDailyReport: () => request('/dashboard/daily-report'),
  getMonthlyReport: () => request('/dashboard/monthly-report'),
  getPendingCases: () => request('/dashboard/pending-cases'),
  getStatistics: () => request('/dashboard/statistics'),
};

export default api;
