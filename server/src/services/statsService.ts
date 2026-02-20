import { Fund, FundRating } from '../types/index.js';
import { getAllFunds, updateFund } from './fundService.js';

export function calculateRating(rank: number, total: number): FundRating {
  if (total === 0 || rank === 0) return 'average';
  const percentage = rank / total;
  if (percentage <= 0.2) return 'excellent';
  if (percentage <= 0.5) return 'average';
  return 'weak';
}

export function calculateRankings(funds: Fund[], period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Fund[] {
  const rankedFunds: Fund[] = [];
  
  for (const fund of funds) {
    const rank = fund.rank > 0 ? fund.rank : 0;
    const total = fund.totalInType > 0 ? fund.totalInType : 0;
    const rating = calculateRating(rank, total);
    
    rankedFunds.push({
      ...fund,
      rank,
      totalInType: total,
      rating,
    });
  }
  
  return rankedFunds;
}

export function getRankingByType(type: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Fund[] {
  const funds = getAllFunds();
  const typeFunds = funds.filter(f => f.type === type);
  return calculateRankings(typeFunds, period);
}

export function getAllRankings(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Fund[] {
  const funds = getAllFunds();
  return calculateRankings(funds, period);
}

export function saveRankingsToFunds(): void {
  const funds = getAllFunds();
  const rankedFunds = calculateRankings(funds, 'monthly');
  
  for (const rankedFund of rankedFunds) {
    updateFund(rankedFund.code, {
      rank: rankedFund.rank,
      totalInType: rankedFund.totalInType,
      rating: rankedFund.rating,
    });
  }
}

export function getTypeDistribution(): { type: string; count: number }[] {
  const funds = getAllFunds();
  const distribution = new Map<string, number>();
  
  for (const fund of funds) {
    distribution.set(fund.type, (distribution.get(fund.type) || 0) + 1);
  }
  
  return Array.from(distribution.entries()).map(([type, count]) => ({ type, count }));
}

export function getRatingDistribution(): { rating: FundRating; count: number }[] {
  const funds = getAllFunds();
  const distribution = new Map<FundRating, number>();
  
  for (const fund of funds) {
    distribution.set(fund.rating, (distribution.get(fund.rating) || 0) + 1);
  }
  
  const ratingOrder: FundRating[] = ['excellent', 'average', 'weak'];
  return ratingOrder.map(rating => ({
    rating,
    count: distribution.get(rating) || 0,
  }));
}
