import { useState, useEffect, useRef } from 'react';
import { getAllFunds, getTypeDistribution } from '../services/api';
import type { Fund, TypeDistribution } from '../types';
import * as echarts from 'echarts';

function Dashboard() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [typeDist, setTypeDist] = useState<TypeDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const typeChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && typeChartRef.current) {
      const chart = echarts.init(typeChartRef.current);
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { top: '5%', left: 'center' },
        series: [
          {
            name: 'Fund Type',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: false,
              position: 'center',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 20,
                fontWeight: 'bold',
              },
            },
            data: typeDist.map(item => ({
              value: item.count,
              name: item.type,
            })),
          },
        ],
      });
    }
  }, [loading, typeDist]);

  const loadData = async () => {
    try {
      const [fundsData, typeData] = await Promise.all([
        getAllFunds(),
        getTypeDistribution(),
      ]);
      setFunds(fundsData);
      setTypeDist(typeData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const totalScale = funds.reduce((sum, f) => sum + f.scale, 0);
  const avgGrowth = funds.length > 0
    ? (funds.reduce((sum, f) => sum + f.monthlyGrowth, 0) / funds.length).toFixed(2)
    : '0';

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Funds</h3>
          <div className="value">{funds.length}</div>
        </div>
        <div className="stat-card">
          <h3>Total Scale</h3>
          <div className="value">{totalScale.toFixed(2)}B</div>
        </div>
        <div className="stat-card">
          <h3>Avg Monthly Growth</h3>
          <div className={`value ${parseFloat(avgGrowth) >= 0 ? 'positive' : 'negative'}`}>
            {parseFloat(avgGrowth) >= 0 ? '+' : ''}{avgGrowth}%
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Fund Type Distribution</h2>
        <div ref={typeChartRef} style={{ height: '400px' }} />
      </div>
    </div>
  );
}

export default Dashboard;
