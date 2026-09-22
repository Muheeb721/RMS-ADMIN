import { apiService } from './api';

export const createAdminProperty = async (property) => {
  const response = await apiService.request('/admin/properties', {
    method: 'POST',
    body: property,
  });
  console.log('Admin create property response:', response);
  return response?.data || null;
};

export const updateAdminProperty = async (id, property) => {
  const response = await apiService.request(`/admin/properties/${id}`, {
    method: 'PUT',
    body: property,
  });
  console.log('Admin update property response:', response);
  return response?.data || null;
};

export const deleteAdminProperty = async (id) => {
  const response = await apiService.request(`/admin/properties/${id}`, {
    method: 'DELETE',
  });
  console.log('Admin delete property response:', response);
  return response?.data || null;
};

export const uploadPropertyImage = async (id, file) => {
  if (!file) throw new Error('File is required for upload');
  if (!id) throw new Error('Property ID is required for upload');
  
  const fd = new FormData();
  fd.append('image', file, file.name);

  const response = await apiService.request(`/properties/${id}/images`, {
    method: 'POST',
    body: fd,
  });

  console.log('Property image upload response:', response);
  if (!response?.success) {
    throw new Error(response?.message || 'Image upload failed');
  }
  
  return response?.data || null;
};

export const replacePropertyImage = async (id, index, file) => {
  if (!file) throw new Error('File is required for replacement');
  if (!id) throw new Error('Property ID is required for replacement');
  if (index === undefined || index === null) throw new Error('Image index is required for replacement');
  
  const fd = new FormData();
  fd.append('image', file, file.name);

  const response = await apiService.request(`/properties/${id}/images/${index}`, {
    method: 'POST',
    body: fd,
  });

  console.log('Property image replace response:', response);
  if (!response?.success) {
    throw new Error(response?.message || 'Image replacement failed');
  }
  
  return response?.data || null;
};

export const replacePropertyImageById = async (id, imageId, file) => {
  if (!file) throw new Error('File is required for replacement');
  if (!id) throw new Error('Property ID is required for replacement');
  if (!imageId) throw new Error('Image id is required for replacement');
  const fd = new FormData();
  fd.append('image', file, file.name);
  const response = await apiService.request(`/properties/${id}/images/id/${imageId}`, {
    method: 'POST',
    body: fd,
  });
  if (!response?.success) throw new Error(response?.message || 'Image replacement failed');
  return response?.data || null;
};

export const replaceProfileImageById = async (profileId, imageId, file) => {
  if (!file) throw new Error('File is required for replacement');
  if (!profileId) throw new Error('Profile ID is required for replacement');
  if (!imageId) throw new Error('Image id is required for replacement');
  const fd = new FormData();
  fd.append('image', file, file.name);
  const response = await apiService.request(`/admin/profile/images/id/${imageId}`, {
    method: 'POST',
    body: fd,
  });
  if (!response?.success) throw new Error(response?.message || 'Profile image replacement failed');
  return response?.data || null;
};

export const deletePropertyImage = async (id, index) => {
  if (!id) throw new Error('Property ID is required for deletion');
  if (index === undefined || index === null) throw new Error('Image index is required for deletion');
  
  const response = await apiService.request(`/properties/${id}/images/${index}`, {
    method: 'DELETE',
  });

  console.log('Property image delete response:', response);
  if (!response?.success) {
    throw new Error(response?.message || 'Image deletion failed');
  }
  
  return response?.data || null;
};

export const deletePropertyImageById = async (id, imageId) => {
  if (!id) throw new Error('Property ID is required for deletion');
  if (!imageId) throw new Error('Image id is required for deletion');
  const response = await apiService.request(`/properties/${id}/images/id/${imageId}`, {
    method: 'DELETE',
  });
  if (!response?.success) throw new Error(response?.message || 'Image deletion failed');
  return response?.data || null;
};

export default {
  createAdminProperty,
  updateAdminProperty,
  deleteAdminProperty,
  uploadPropertyImage,
  replacePropertyImage,
  replacePropertyImageById,
  deletePropertyImage,
  deletePropertyImageById,
};
