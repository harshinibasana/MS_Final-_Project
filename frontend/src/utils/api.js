import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only auto-logout on 401 for authenticated routes — NOT for login/register
    const url = err.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          !window.location.pathname.includes('/shared/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:      (data) => API.post('/auth/register', data),
  login:         (data) => API.post('/auth/login', data),
  getMe:         ()     => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

export const tripsAPI = {
  getAll:      (params) => API.get('/trips', { params }),
  getCommunity:(params) => API.get('/trips/public/community', { params }),
  getOne:      (id)     => API.get(`/trips/${id}`),
  getStats:    (id)     => API.get(`/trips/${id}/stats`),
  create:      (data)   => API.post('/trips', data),
  update:      (id,data)=> API.put(`/trips/${id}`, data),
  uploadCover: (id,fd)  => API.post(`/trips/${id}/cover`, fd),
  delete:      (id)     => API.delete(`/trips/${id}`),
};

export const expensesAPI = {
  getByTrip: (tripId) => API.get(`/expenses/trip/${tripId}`),
  create:    (data)   => API.post('/expenses', data),
  update:    (id,data)=> API.put(`/expenses/${id}`, data),
  delete:    (id)     => API.delete(`/expenses/${id}`),
};

export const placesAPI = {
  getByTrip: (tripId) => API.get(`/places/trip/${tripId}`),
  create:    (data)   => API.post('/places', data),
  update:    (id,data)=> API.put(`/places/${id}`, data),
  delete:    (id)     => API.delete(`/places/${id}`),
};

export const rentalsAPI = {
  getByTrip: (tripId) => API.get(`/rentals/trip/${tripId}`),
  create:    (data)   => API.post('/rentals', data),
  update:    (id,data)=> API.put(`/rentals/${id}`, data),
  delete:    (id)     => API.delete(`/rentals/${id}`),
};

export const photosAPI = {
  getByTrip: (tripId) => API.get(`/photos/trip/${tripId}`),
  upload:    (tripId,fd)=>API.post(`/photos/trip/${tripId}`, fd),
  update:    (id,data)=> API.put(`/photos/${id}`, data),
  delete:    (id)     => API.delete(`/photos/${id}`),
};

export const packingAPI = {
  getByTrip:   (tripId) => API.get(`/packing/trip/${tripId}`),
  create:      (data)   => API.post('/packing', data),
  addTemplate: (tripId) => API.post(`/packing/template/${tripId}`),
  update:      (id,data)=> API.put(`/packing/${id}`, data),
  delete:      (id)     => API.delete(`/packing/${id}`),
};

export const hotelsAPI = {
  getByTrip:   (tripId) => API.get(`/hotels/trip/${tripId}`),
  getMy:       ()       => API.get('/hotels/my'),
  getOne:      (id)     => API.get(`/hotels/${id}`),
  create:      (data)   => API.post('/hotels', data),
  update:      (id,data)=> API.put(`/hotels/${id}`, data),
  updateStatus:(id,status)=>API.patch(`/hotels/${id}/status`,{status}),
  delete:      (id)     => API.delete(`/hotels/${id}`),
};

export const miscAPI = {
  getByTrip:  (tripId) => API.get(`/misc/trip/${tripId}`),
  getSummary: (tripId) => API.get(`/misc/trip/${tripId}/summary`),
  create:     (data)   => API.post('/misc', data),
  update:     (id,data)=> API.put(`/misc/${id}`, data),
  delete:     (id)     => API.delete(`/misc/${id}`),
};

export const plansAPI = {
  getByTrip: (tripId) => API.get(`/plans/trip/${tripId}`),
  create:    (data)   => API.post('/plans', data),
  update:    (id,data)=> API.put(`/plans/${id}`, data),
  toggle:    (id)     => API.patch(`/plans/${id}/toggle`),
  delete:    (id)     => API.delete(`/plans/${id}`),
};

export const bucketAPI = {
  getAll:  ()        => API.get('/bucket'),
  create:  (data)    => API.post('/bucket', data),
  update:  (id,data) => API.put(`/bucket/${id}`, data),
  delete:  (id)      => API.delete(`/bucket/${id}`),
};

export const journalAPI = {
  getByTrip: (tripId) => API.get(`/journal/trip/${tripId}`),
  create:    (data)   => API.post('/journal', data),
  update:    (id,data)=> API.put(`/journal/${id}`, data),
  delete:    (id)     => API.delete(`/journal/${id}`),
};

export const currencyAPI = {
  getRates: (base='USD') => API.get('/currency/rates', { params:{ base } }),
};

export const shareAPI = {
  generate: (tripId) => API.post(`/share/trip/${tripId}`),
  revoke:   (tripId) => API.delete(`/share/trip/${tripId}`),
  view:     (token)  => API.get(`/share/view/${token}`),
};

export const weatherAPI = {
  get: (params) => API.get('/weather', { params }),
};

export const adminAPI = {
  getStats:        ()        => API.get('/admin/stats'),
  getUsers:        (params)  => API.get('/admin/users', { params }),
  getUserActivity: (id)      => API.get(`/admin/users/${id}/activity`),
  updateRole:      (id,role) => API.put(`/admin/users/${id}/role`, { role }),
  deleteUser:      (id)      => API.delete(`/admin/users/${id}`),
  getTrips:        (params)  => API.get('/admin/trips', { params }),
  deleteTrip:      (id)      => API.delete(`/admin/trips/${id}`),
  getActivity:     (params)  => API.get('/admin/activity', { params }),
};

export const destinationsAPI = {
  search:     (params) => API.get('/destinations/search', { params }),
  getFeatured:()       => API.get('/destinations/featured'),
  getAll:     (params) => API.get('/destinations', { params }),
  getOne:     (id)     => API.get(`/destinations/${id}`),
  create:     (data)   => API.post('/destinations', data),
  update:     (id,data)=> API.put(`/destinations/${id}`, data),
  addReview:  (id,data)=> API.post(`/destinations/${id}/reviews`, data),
  delete:     (id)     => API.delete(`/destinations/${id}`),
  seed:       ()       => API.post('/destinations/seed/sample'),
};

export default API;
