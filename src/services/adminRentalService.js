import { apiService } from './api';

export const listAdminRentalProfiles = async () => {
  const resp = await apiService.request('/rental-profiles/admin/all');
  return resp?.data || [];
};

export const getAdminRentalProfile = async (id) => {
  const resp = await apiService.request(`/rental-profiles/${id}`);
  return resp?.data || null;
};

export const createAdminRentalProfile = async (payload) => {
  const resp = await apiService.request('/rental-profiles', { method: 'POST', body: payload });
  return resp?.data || null;
};

export const updateAdminRentalProfile = async (id, payload) => {
  const resp = await apiService.request(`/rental-profiles/${id}`, { method: 'PUT', body: payload });
  return resp?.data || null;
};

export const changeAdminRentalStatus = async (id, status) => {
  const resp = await apiService.request(`/rental-profiles/${id}/status`, { method: 'POST', body: { status } });
  return resp?.data || null;
};
