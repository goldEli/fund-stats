export type FundRating = 'excellent' | 'average' | 'weak';

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
  rating: FundRating;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TypeDistribution {
  type: string;
  count: number;
}

export interface RatingDistribution {
  rating: FundRating;
  count: number;
}
