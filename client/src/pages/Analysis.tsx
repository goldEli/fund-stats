import { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { getRankings, getTypeDistribution } from '../services/api';
import type { Fund, TypeDistribution } from '../types';

function Analysis() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [typeDist, setTypeDist] = useState<TypeDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [selectedType, setSelectedType] = useState('');

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [period, selectedType]);

  useEffect(() => {
    if (!loading && funds.length > 0 && chartRef.current) {
      const chart = echarts.init(chartRef.current);
      
      const topFunds = funds.slice(0, 15);
      
      chart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLabel: { formatter: '{value}%' },
        },
        yAxis: {
          type: 'category',
          data: topFunds.map(f => f.name.substring(0, 8)).reverse(),
          axisLabel: { interval: 0 },
        },
        series: [
          {
            name: 'Growth',
            type: 'bar',
            data: topFunds.map(f => {
              const growth = f[`${period}Growth` as keyof Fund] as number;
              return {
                value: growth,
                itemStyle: { color: growth >= 0 ? '#10b981' : '#ef4444' },
              };
            }).reverse(),
            label: {
              show: true,
              position: 'right',
              formatter: (params: { value: number }) => `${params.value >= 0 ? '+' : ''}${params.value.toFixed(2)}%`,
            },
          },
        ],
      });

      return () => chart.dispose();
    }
  }, [loading, funds, period]);

  const loadData = async () => {
    try {
      const typeData = await getTypeDistribution();
      setTypeDist(typeData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRankings = async () => {
    try {
      const params: { type?: string; period?: string } = { period };
      if (selectedType) params.type = selectedType;
      const data = await getRankings(params);
      setFunds(data);
    } catch (error) {
      console.error('Failed to load rankings:', error);
    }
  };

  const formatGrowth = (value: number) => {
    return value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Fund Ranking Analysis</h2>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Fund Type</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="">All Types</option>
              {typeDist.map(t => (
                <option key={t.type} value={t.type}>{t.type}</option>
              ))}
            </select>
          </div>
        </div>

        <div ref={chartRef} style={{ height: '400px', marginBottom: '32px' }} />
      </div>

      <div className="card">
        <h2>Detailed Rankings</h2>
        {funds.length === 0 ? (
          <div className="empty">No data</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Daily</th>
                <th>Weekly</th>
                <th>Monthly</th>
                <th>Yearly</th>
              </tr>
            </thead>
            <tbody>
              {funds.map(fund => (
                <tr key={fund.code}>
                  <td>{fund.rank}/{fund.totalInType}</td>
                  <td>{fund.code}</td>
                  <td>{fund.name}</td>
                  <td>{fund.type}</td>
                  <td>
                    <span className={`growth ${fund.dailyGrowth >= 0 ? 'positive' : 'negative'}`}>
                      {formatGrowth(fund.dailyGrowth)}
                    </span>
                  </td>
                  <td>
                    <span className={`growth ${fund.weeklyGrowth >= 0 ? 'positive' : 'negative'}`}>
                      {formatGrowth(fund.weeklyGrowth)}
                    </span>
                  </td>
                  <td>
                    <span className={`growth ${fund.monthlyGrowth >= 0 ? 'positive' : 'negative'}`}>
                      {formatGrowth(fund.monthlyGrowth)}
                    </span>
                  </td>
                  <td>
                    <span className={`growth ${fund.yearlyGrowth >= 0 ? 'positive' : 'negative'}`}>
                      {formatGrowth(fund.yearlyGrowth)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Analysis;
