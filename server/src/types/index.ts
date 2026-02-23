export interface Fund {
  code: string;
  name: string;
  type: string;
  netValue: number;
  accumulatedNetValue: number;
  establishDate: string;
  manager: string;
  scale: number;
  lastUpdate: string;
  dailyGrowth: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
  rank: number;
  totalInType: number;
}

export interface FundsData {
  funds: Fund[];
  lastSync: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StatsRankingParams {
  type?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
