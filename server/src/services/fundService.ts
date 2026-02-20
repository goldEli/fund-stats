import { FundsData, Fund } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const FUNDS_FILE = path.join(DATA_DIR, 'funds.json');

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readFundsData(): FundsData {
  ensureDataDir();
  if (!fs.existsSync(FUNDS_FILE)) {
    const initialData: FundsData = { funds: [], lastSync: new Date().toISOString() };
    fs.writeFileSync(FUNDS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  const content = fs.readFileSync(FUNDS_FILE, 'utf-8');
  return JSON.parse(content);
}

export function writeFundsData(data: FundsData): void {
  ensureDataDir();
  fs.writeFileSync(FUNDS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAllFunds(): Fund[] {
  const data = readFundsData();
  return data.funds;
}

export function getFundByCode(code: string): Fund | undefined {
  const funds = getAllFunds();
  return funds.find(f => f.code === code);
}

export function addFund(fund: Fund): Fund {
  const data = readFundsData();
  const existingIndex = data.funds.findIndex(f => f.code === fund.code);
  if (existingIndex >= 0) {
    data.funds[existingIndex] = fund;
  } else {
    data.funds.push(fund);
  }
  data.lastSync = new Date().toISOString();
  writeFundsData(data);
  return fund;
}

export function updateFund(code: string, updates: Partial<Fund>): Fund | null {
  const data = readFundsData();
  const index = data.funds.findIndex(f => f.code === code);
  if (index < 0) return null;
  
  data.funds[index] = { ...data.funds[index], ...updates };
  data.lastSync = new Date().toISOString();
  writeFundsData(data);
  return data.funds[index];
}

export function deleteFund(code: string): boolean {
  const data = readFundsData();
  const index = data.funds.findIndex(f => f.code === code);
  if (index < 0) return false;
  
  data.funds.splice(index, 1);
  data.lastSync = new Date().toISOString();
  writeFundsData(data);
  return true;
}
