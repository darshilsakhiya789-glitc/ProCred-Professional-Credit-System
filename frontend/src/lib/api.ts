import axios from 'axios';

// In development, Vite proxy handles /api → localhost:5000
// In production (Vercel), VITE_API_URL must point to your Render backend URL
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('procred_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('procred_token');
      localStorage.removeItem('procred_user');
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data: object)              => api.post('/auth/register', data),
  login:         (data: object)              => api.post('/auth/login', data),
  getMe:         ()                          => api.get('/auth/me'),
  updateProfile: (data: FormData | object)   => {
    const isForm = data instanceof FormData;
    return api.put('/auth/me', data, { headers: isForm ? { 'Content-Type': 'multipart/form-data' } : {} });
  },
  uploadResume:  (file: File) => {
    const fd = new FormData(); fd.append('resume', file);
    return api.post('/auth/me/resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// ── Achievements ──────────────────────────────────────────────────────────────
export const achievementsAPI = {
  getAll:       ()                         => api.get('/achievements'),
  getOne:       (id: string)               => api.get(`/achievements/${id}`),
  add:          (fd: FormData)             => api.post('/achievements', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:       (id: string, d: object)    => api.put(`/achievements/${id}`, d),
  delete:       (id: string)               => api.delete(`/achievements/${id}`),
  getPending:   (status?: string)          => api.get('/achievements/pending', { params: status ? { status } : {} }),
  updateStatus: (id: string, d: object)    => api.patch(`/achievements/${id}/status`, d),
  submitAIAssessment: (d: { skill: string, passed: boolean }) => api.post('/achievements/ai-assessment', d),
};

// ── Skills ────────────────────────────────────────────────────────────────────
export const skillsAPI = {
  getAll:  ()               => api.get('/skills'),
  upsert:  (d: object)      => api.post('/skills', d),
  delete:  (id: string)     => api.delete(`/skills/${id}`),
};

// ── Recruiter search ──────────────────────────────────────────────────────────
export const recruiterAPI = {
  searchStudents:    (params?: object) => api.get('/recruiter/students', { params }),
  getStudentProfile: (id: string)      => api.get(`/recruiter/students/${id}`),
};

// ── Jobs & Applications ───────────────────────────────────────────────────────
export const jobsAPI = {
  getActive:          (params?: object)          => api.get('/jobs', { params }),
  applyToJob:         (id: string, d?: object)   => api.post(`/jobs/${id}/apply`, d || {}),
  getMyApplications:  ()                         => api.get('/jobs/my-applications'),
  createJob:          (d: object)                => api.post('/jobs', d),
  getMyJobs:          ()                         => api.get('/jobs/my-jobs'),
  getJobApplications: (id: string, params?: object) => api.get(`/jobs/${id}/applications`, { params }),
  updateAppStatus:    (appId: string, d: object) => api.patch(`/jobs/applications/${appId}/status`, d),
  sendOfferLetters:   (d: object)                => api.post('/jobs/send-offers', d),
  closeJob:           (id: string)               => api.patch(`/jobs/${id}/close`, {}),
  boostJob:           (id: string)               => api.patch(`/jobs/${id}/boost`, {}),
};

// ── Contact ───────────────────────────────────────────────────────────────────
export const contactAPI = {
  submit: (d: object) => api.post('/contact', d),
};

// ── Payment ───────────────────────────────────────────────────────────────────
export const paymentAPI = {
  subscribe: (d: object) => api.post('/payment/subscribe', d),
};
