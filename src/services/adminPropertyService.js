import { apiService } from './api';

export const createAdminProperty = async (property) => {
  const response = await apiService.request('/admin/properties', {
    method: 'POST',
    body: property,
  });
  return response?.data || null;
};

export const updateAdminProperty = async (id, property) => {
  const response = await apiService.request(`/admin/properties/${id}`, {
    method: 'PUT',
    body: property,
  });
  return response?.data || null;
};

export const deleteAdminProperty = async (id) => {
  const response = await apiService.request(`/admin/properties/${id}`, {
    method: 'DELETE',
  });
  return response?.data || null;
};

export const uploadPropertyImage = async (id, file) => {
  const fd = new FormData();
  fd.append('image', file, file.name);

  const response = await apiService.request(`/properties/${id}/images`, {
    method: 'POST',
    body: fd,
  });

  return response?.data || null;
};

export const replacePropertyImage = async (id, index, file) => {
  const fd = new FormData();
  fd.append('image', file, file.name);

  const response = await apiService.request(`/properties/${id}/images/${index}`, {
    method: 'POST',
    body: fd,
  });

  return response?.data || null;
};

export const deletePropertyImage = async (id, index) => {
  const response = await apiService.request(`/properties/${id}/images/${index}`, {
    method: 'DELETE',
  });

  return response?.data || null;
};

export default {
  createAdminProperty,
  updateAdminProperty,
  deleteAdminProperty,
};
