import axios from 'axios';
import type { Fund, ApiResponse, TypeDistribution, RatingDistribution } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export async function getAllFunds(): Promise<Fund[]> {
  const response = await api.get<ApiResponse<Fund[]>>('/funds');
  return response.data.data || [];
}

export async function getFundByCode(code: string): Promise<Fund> {
  const response = await api.get<ApiResponse<Fund>>(`/funds/${code}`);
  if (!response.data.data) throw new Error(response.data.error || 'Fund not found');
  return response.data.data;
}

export async function addFund(code: string): Promise<Fund> {
  const response = await api.post<ApiResponse<Fund>>('/funds', { code });
  if (!response.data.success) throw new Error(response.data.error || 'Failed to add fund');
  return response.data.data!;
}

export async function updateFund(code: string, updates: Partial<Fund>): Promise<Fund> {
  const response = await api.put<ApiResponse<Fund>>(`/funds/${code}`, updates);
  if (!response.data.success) throw new Error(response.data.error || 'Failed to update fund');
  return response.data.data!;
}

export async function deleteFund(code: string): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/funds/${code}`);
  if (!response.data.success) throw new Error(response.data.error || 'Failed to delete fund');
}

export async function syncFund(code: string): Promise<Fund> {
  const response = await api.post<ApiResponse<Fund>>(`/funds/sync/${code}`);
  if (!response.data.success) throw new Error(response.data.error || 'Failed to sync fund');
  return response.data.data!;
}

export async function syncAllFunds(): Promise<{ code: string; success: boolean }[]> {
  const response = await api.post<ApiResponse<{ code: string; success: boolean }[]>>('/funds/sync-all');
  if (!response.data.success) throw new Error(response.data.error || 'Failed to sync all funds');
  return response.data.data || [];
}

export async function getRankings(params?: { type?: string; period?: string }): Promise<Fund[]> {
  const response = await api.get<ApiResponse<Fund[]>>('/stats/ranking', { params });
  return response.data.data || [];
}

export async function getTypeDistribution(): Promise<TypeDistribution[]> {
  const response = await api.get<ApiResponse<TypeDistribution[]>>('/stats/type-distribution');
  return response.data.data || [];
}

export async function getRatingDistribution(): Promise<RatingDistribution[]> {
  const response = await api.get<ApiResponse<RatingDistribution[]>>('/stats/rating-distribution');
  return response.data.data || [];
}
