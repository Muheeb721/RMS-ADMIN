import { apiService } from './api';

export const listAdminBookings = async () => {
  const response = await apiService.request('/bookings', { method: 'GET' });
  return response?.data || [];
};

export const approveAdminBooking = async (bookingId) => {
  const response = await apiService.request(`/bookings/${bookingId}/approve`, {
    method: 'POST',
  });
  return response?.data || null;
};

export const rejectAdminBooking = async (bookingId, reason = 'Booking rejected by the admin.') => {
  const response = await apiService.request(`/bookings/${bookingId}/reject`, {
    method: 'POST',
    body: { reason },
  });
  return response?.data || null;
};

export default {
  listAdminBookings,
  approveAdminBooking,
  rejectAdminBooking,
};
