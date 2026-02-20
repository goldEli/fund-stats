import axios from 'axios';
import * as cheerio from 'cheerio';
import { Fund } from '../types/index.js';

function inferDetailedType(name: string, baseType: string): string {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('qdii') || nameLower.includes('etf联接') || name.includes('ETF联接')) {
    if (nameLower.includes('港股') || nameLower.includes('港')) {
      return 'QDII-港股';
    } else if (nameLower.includes('美股') || nameLower.includes('纳斯达克') || nameLower.includes('标普') || nameLower.includes('s&p')) {
      return 'QDII-美股';
    } else if (nameLower.includes('全球') || nameLower.includes('海外')) {
      return 'QDII-全球';
    }
    return 'QDII-其他';
  }
  
  if (nameLower.includes('指数') || nameLower.includes('etf') || nameLower.includes('lof')) {
    if (nameLower.includes('沪深300') || name.includes('沪深300')) {
      return '指数型-沪深300';
    } else if (nameLower.includes('中证500') || name.includes('中证500') || nameLower.includes('中证1000') || name.includes('中证1000')) {
      return '指数型-中证1000';
    } else if (nameLower.includes('创业板')) {
      return '指数型-创业板';
    } else if (nameLower.includes('科创')) {
      return '指数型-科创';
    } else if (nameLower.includes('上证50') || name.includes('上证50')) {
      return '指数型-上证50';
    } else if (nameLower.includes('白酒')) {
      return '指数型-白酒';
    } else if (nameLower.includes('油气') || nameLower.includes('油气')) {
      return '指数型-油气';
    }
    return '指数型-其他';
  }
  
  if (baseType === '股票型' || nameLower.includes('股票')) {
    return '股票型-主动';
  }
  
  if (baseType === '混合型') {
    if (nameLower.includes('偏股') || nameLower.includes('进取')) {
      return '混合型-偏股';
    } else if (nameLower.includes('偏债') || nameLower.includes('稳健')) {
      return '混合型-偏债';
    } else if (nameLower.includes('平衡') || nameLower.includes('灵活配置')) {
      return '混合型-平衡';
    }
    return '混合型-偏股';
  }
  
  if (baseType === '债券型') {
    if (nameLower.includes('长债') || nameLower.includes('中长期')) {
      return '债券型-长债';
    } else if (nameLower.includes('短债') || nameLower.includes('短期') || nameLower.includes('纯债')) {
      return '债券型-短债';
    } else if (nameLower.includes('可转债') || nameLower.includes('转债')) {
      return '债券型-可转债';
    } else if (nameLower.includes('中短债')) {
      return '债券型-中短债';
    }
    return '债券型-长债';
  }
  
  if (baseType === '货币型') {
    return '货币型';
  }
  
  return baseType;
}

interface FundRanking {
  rank: number;
  total: number;
}

async function fetchFundRanking(code: string): Promise<FundRanking> {
  const url = `https://fund.eastmoney.com/${code}.html`;
  
  const response = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  
  const $ = cheerio.load(response.data);
  const tableHtml = $('#increaseAmount_stage').html();
  
  if (!tableHtml) {
    return { rank: 0, total: 0 };
  }
  
  const table = cheerio.load(tableHtml)('table tbody tr');
  let rankingText = '';
  
  table.each((_, row) => {
    const rowText = $(row).text();
    if (rowText.includes('同类排名')) {
      const tds = $(row).find('td').toArray();
      if (tds.length >= 2) {
        const monthlyTd = tds[1];
        rankingText = $(monthlyTd).text();
      }
    }
  });
  
  if (!rankingText) {
    return { rank: 0, total: 0 };
  }
  
  const match = rankingText.match(/(\d+)\s*\|\s*(\d+)/);
  if (match) {
    return {
      rank: parseInt(match[1]),
      total: parseInt(match[2]),
    };
  }
  
  return { rank: 0, total: 0 };
}

export async function fetchFundFromApi(code: string): Promise<Fund> {
  const [pingzhongUrl, detailUrl] = [
    `http://fund.eastmoney.com/pingzhongdata/${code}.js`,
    `https://fund.eastmoney.com/${code}.html`,
  ];
  
  const [pingzhongResponse, detailResponse] = await Promise.all([
    axios.get(pingzhongUrl, { timeout: 10000, responseType: 'text' }),
    axios.get(detailUrl, { 
      timeout: 10000, 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }),
  ]);
  
  const jsContent = pingzhongResponse.data;
  
  const extractValue = (varName: string): string => {
    const patterns = [
      new RegExp(`${varName}\\s*=\\s*["']([^"']*)["']`),
      new RegExp(`${varName}\\s*=\\s*["']([^"']*)["'];`),
      new RegExp(`${varName}\\s*:\\s*["']([^"']*)["']`),
    ];
    for (const pattern of patterns) {
      const match = jsContent.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return '';
  };
  
  const extractNumber = (varName: string): number => {
    const value = extractValue(varName);
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const extractGrowthRate = (varName: string): number => {
    const value = extractValue(varName);
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };
  
  const name = extractValue('fS_name') || '未知基金';
  const baseType = extractValue('fS_type') || '混合型';
  const detailedType = inferDetailedType(name, baseType);
  
  const yearlyGrowth = extractGrowthRate('syl_1n');
  const monthlyGrowth = extractGrowthRate('syl_1y');
  const weeklyGrowth = extractGrowthRate('syl_6y') / 6 * 4;
  const dailyGrowth = monthlyGrowth / 30;
  
  let ranking = { rank: 0, total: 0 };
  try {
    ranking = await fetchFundRanking(code);
  } catch (error) {
    console.error(`Failed to fetch ranking for ${code}:`, error);
  }
  
  const fund: Fund = {
    code: code,
    name: name,
    type: detailedType,
    netValue: 1.0,
    accumulatedNetValue: 1.0,
    establishDate: '2000-01-01',
    manager: '未知',
    scale: 0,
    lastUpdate: new Date().toISOString(),
    dailyGrowth: Number(dailyGrowth.toFixed(2)),
    weeklyGrowth: Number(weeklyGrowth.toFixed(2)),
    monthlyGrowth: Number(monthlyGrowth.toFixed(2)),
    yearlyGrowth: Number(yearlyGrowth.toFixed(2)),
    rank: ranking.rank,
    totalInType: ranking.total,
    rating: 'average',
  };
  
  return fund;
}

export async function fetchFundWithRetry(code: string, maxRetries = 3): Promise<Fund> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFundFromApi(code);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Failed to fetch fund after retries');
}
