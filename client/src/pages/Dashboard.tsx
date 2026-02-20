import { useEffect, useState, useRef } from 'react';
import * as echarts from 'echarts';
import { getAllFunds, getTypeDistribution, getRatingDistribution } from '../services/api';
import type { Fund, TypeDistribution, RatingDistribution } from '../types';

function Dashboard() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [typeDist, setTypeDist] = useState<TypeDistribution[]>([]);
  const [ratingDist, setRatingDist] = useState<RatingDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  const typeChartRef = useRef<HTMLDivElement>(null);
  const ratingChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && typeChartRef.current) {
      const chart = echarts.init(typeChartRef.current);
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '0%' },
        series: [
          {
            name: '基金类型',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            data: typeDist.map((item, index) => ({
              value: item.count,
              name: item.type,
              itemStyle: { color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5] },
            })),
          },
        ],
      });
      return () => chart.dispose();
    }
  }, [loading, typeDist]);

  useEffect(() => {
    if (!loading && ratingChartRef.current) {
      const chart = echarts.init(ratingChartRef.current);
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: '0%' },
        series: [
          {
            name: '基金评级',
            type: 'pie',
            radius: ['40%', '70%'],
            data: ratingDist.map(item => ({
              value: item.count,
              name: item.rating === 'excellent' ? '优秀' : item.rating === 'average' ? '一般' : '弱',
              itemStyle: {
                color: item.rating === 'excellent' ? '#10b981' : item.rating === 'average' ? '#f59e0b' : '#ef4444',
              },
            })),
          },
        ],
      });
      return () => chart.dispose();
    }
  }, [loading, ratingDist]);

  const loadData = async () => {
    try {
      const [fundsData, typeData, ratingData] = await Promise.all([
        getAllFunds(),
        getTypeDistribution(),
        getRatingDistribution(),
      ]);
      setFunds(fundsData);
      setTypeDist(typeData);
      setRatingDist(ratingData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  const totalScale = funds.reduce((sum, f) => sum + f.scale, 0);
  const excellentCount = ratingDist.find(r => r.rating === 'excellent')?.count || 0;
  const avgGrowth = funds.length > 0
    ? (funds.reduce((sum, f) => sum + f.monthlyGrowth, 0) / funds.length).toFixed(2)
    : '0';

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>基金总数</h3>
          <div className="value">{funds.length}</div>
        </div>
        <div className="stat-card">
          <h3>基金总规模</h3>
          <div className="value">{totalScale.toFixed(2)}亿</div>
        </div>
        <div className="stat-card">
          <h3>优秀基金</h3>
          <div className="value" style={{ color: '#10b981' }}>{excellentCount}</div>
        </div>
        <div className="stat-card">
          <h3>平均月增长率</h3>
          <div className="value" style={{ color: Number(avgGrowth) >= 0 ? '#10b981' : '#ef4444' }}>
            {avgGrowth}%
          </div>
        </div>
      </div>

      <div className="card">
        <h2>基金类型分布</h2>
        <div ref={typeChartRef} style={{ height: '300px' }} />
      </div>

      <div className="card">
        <h2>基金评级分布</h2>
        <div ref={ratingChartRef} style={{ height: '300px' }} />
      </div>
    </div>
  );
}

export default Dashboard;
