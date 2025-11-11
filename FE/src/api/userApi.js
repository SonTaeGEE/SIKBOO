import axiosInstance from '@/api/axiosInstance';

// 사용자 CRUD
export const fetchUsers = async () => {
  const response = await axiosInstance.get('/users');
  return response.data;
};

export const fetchUserById = async (id) => {
  const response = await axiosInstance.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axiosInstance.post('/users', userData);
  return response.data;
};

export const updateUser = async ({ id, userData }) => {
  const response = await axiosInstance.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axiosInstance.delete(`/users/${id}`);
  return response.data;
};

// authApi에서 가져오기 (중복 제거)
export { logout, getMe } from './authApi';
