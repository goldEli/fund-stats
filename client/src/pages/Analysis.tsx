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
            name: '增长率',
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

  const formatRating = (rating: string) => {
    switch (rating) {
      case 'excellent': return '优秀';
      case 'average': return '一般';
      case 'weak': return '弱';
      default: return rating;
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>基金排名分析</h2>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>时间周期</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">日</option>
              <option value="weekly">周</option>
              <option value="monthly">月</option>
              <option value="yearly">年</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>基金类型</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="">全部类型</option>
              {typeDist.map(t => (
                <option key={t.type} value={t.type}>{t.type}</option>
              ))}
            </select>
          </div>
        </div>

        <div ref={chartRef} style={{ height: '400px', marginBottom: '32px' }} />
      </div>

      <div className="card">
        <h2>详细排名</h2>
        {funds.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>代码</th>
                <th>名称</th>
                <th>类型</th>
                <th>日增长</th>
                <th>周增长</th>
                <th>月增长</th>
                <th>年增长</th>
                <th>评级</th>
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
                  <td>
                    <span className={`rating ${fund.rating}`}>
                      {formatRating(fund.rating)}
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
