import { Request, Response } from 'express';
import * as fundService from '../services/fundService.js';
import * as fundApiService from '../services/fundApiService.js';
import * as statsService from '../services/statsService.js';
import { Fund } from '../types/index.js';

export async function getAllFunds(req: Request, res: Response): Promise<void> {
  try {
    const funds = fundService.getAllFunds();
    res.json({ success: true, data: funds });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch funds' });
  }
}

export async function getFundByCode(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const fund = fundService.getFundByCode(code);
    if (!fund) {
      res.status(404).json({ success: false, error: 'Fund not found' });
      return;
    }
    res.json({ success: true, data: fund });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch fund' });
  }
}

export async function addFund(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: 'Fund code is required' });
      return;
    }
    
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ success: false, error: 'Invalid fund code format' });
      return;
    }
    
    const existingFund = fundService.getFundByCode(code);
    if (existingFund) {
      res.json({ success: true, data: existingFund, message: 'Fund already exists' });
      return;
    }
    
    const fund = await fundApiService.fetchFundWithRetry(code);
    fundService.addFund(fund);
    statsService.saveRankingsToFunds();
    
    res.json({ success: true, data: fund });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add fund' });
  }
}

export async function updateFund(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const updates = req.body;
    
    const fund = fundService.updateFund(code, updates);
    if (!fund) {
      res.status(404).json({ success: false, error: 'Fund not found' });
      return;
    }
    
    statsService.saveRankingsToFunds();
    res.json({ success: true, data: fund });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update fund' });
  }
}

export async function deleteFund(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const deleted = fundService.deleteFund(code);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Fund not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete fund' });
  }
}

export async function syncFund(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.params;
    const fund = await fundApiService.fetchFundWithRetry(code);
    fundService.addFund(fund);
    statsService.saveRankingsToFunds();
    
    res.json({ success: true, data: fund });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to sync fund' });
  }
}

export async function syncAllFunds(req: Request, res: Response): Promise<void> {
  try {
    const funds = fundService.getAllFunds();
    const results: { code: string; success: boolean; fund?: Fund; error?: string }[] = [];
    
    for (let i = 0; i < funds.length; i++) {
      const fund = funds[i];
      try {
        const updatedFund = await fundApiService.fetchFundWithRetry(fund.code);
        fundService.addFund(updatedFund);
        results.push({ code: fund.code, success: true, fund: updatedFund });
      } catch (error) {
        results.push({ code: fund.code, success: false, error: 'Sync failed' });
      }
      
      if (i < funds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    statsService.saveRankingsToFunds();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to sync all funds' });
  }
}

export function getRanking(req: Request, res: Response): void {
  try {
    const { type, period = 'monthly' } = req.query;
    let funds: Fund[];
    
    if (type) {
      funds = statsService.getRankingByType(type as string, period as 'daily' | 'weekly' | 'monthly' | 'yearly');
    } else {
      funds = statsService.getAllRankings(period as 'daily' | 'weekly' | 'monthly' | 'yearly');
    }
    
    res.json({ success: true, data: funds });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get rankings' });
  }
}

export function getTypeDistribution(req: Request, res: Response): void {
  try {
    const distribution = statsService.getTypeDistribution();
    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get type distribution' });
  }
}

export function getRatingDistribution(req: Request, res: Response): void {
  try {
    const distribution = statsService.getRatingDistribution();
    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get rating distribution' });
  }
}
