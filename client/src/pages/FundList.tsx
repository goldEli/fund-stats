import { useState, useEffect } from 'react';
import { getAllFunds, addFund, deleteFund, syncFund, syncAllFunds } from '../services/api';
import type { Fund, FundRating } from '../types';

type SortField = 'code' | 'name' | 'type' | 'netValue' | 'monthlyGrowth' | 'yearlyGrowth' | 'rating' | 'rank';
type SortDirection = 'asc' | 'desc';

function FundList() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFundCode, setNewFundCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    try {
      const data = await getAllFunds();
      setFunds(data);
    } catch (error) {
      console.error('Failed to load funds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!/^\d{6}$/.test(newFundCode)) {
      setError('请输入6位基金代码');
      return;
    }

    setAdding(true);
    try {
      const fund = await addFund(newFundCode);
      setFunds([...funds, fund]);
      setSuccess(`成功添加基金: ${fund.name}`);
      setNewFundCode('');
      setShowAddModal(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : '添加失败');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFund = async (code: string) => {
    if (!confirm('确定要删除该基金吗？')) return;
    
    try {
      await deleteFund(code);
      setFunds(funds.filter(f => f.code !== code));
      setSuccess('删除成功');
    } catch (error) {
      setError(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleSyncFund = async (code: string) => {
    try {
      const updatedFund = await syncFund(code);
      setFunds(funds.map(f => f.code === code ? updatedFund : f));
      setSuccess('同步成功');
    } catch (error) {
      setError(error instanceof Error ? error.message : '同步失败');
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    try {
      const results = await syncAllFunds();
      await loadFunds();
      const successCount = results.filter(r => r.success).length;
      setSuccess(`同步完成: ${successCount}/${results.length} 成功`);
    } catch (error) {
      setError('批量同步失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const ratingValue: Record<FundRating, number> = {
    excellent: 1,
    average: 2,
    weak: 3,
  };

  const filteredAndSortedFunds = funds
    .filter(fund => 
      fund.code.includes(searchTerm) || 
      fund.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === 'rating') {
        aVal = ratingValue[a.rating];
        bVal = ratingValue[b.rating];
      }
      
      if (sortField === 'rank') {
        aVal = a.rank / (a.totalInType || 1);
        bVal = b.rank / (b.totalInType || 1);
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const formatGrowth = (value: number) => {
    const formatted = value >= 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
    return formatted;
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
      {(error || success) && (
        <div className={error ? 'error' : 'success'}>
          {error || success}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>基金列表</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={handleSyncAll} disabled={syncing}>
              {syncing ? '同步中...' : '批量同步'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              + 添加基金
            </button>
          </div>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索基金代码或名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredAndSortedFunds.length === 0 ? (
          <div className="empty">
            {funds.length === 0 ? '暂无基金，请添加基金' : '未找到匹配的基金'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('code')} style={{ cursor: 'pointer' }}>代码{getSortIndicator('code')}</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>名称{getSortIndicator('name')}</th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>类型{getSortIndicator('type')}</th>
                <th onClick={() => handleSort('netValue')} style={{ cursor: 'pointer' }}>净值{getSortIndicator('netValue')}</th>
                <th onClick={() => handleSort('monthlyGrowth')} style={{ cursor: 'pointer' }}>月增长{getSortIndicator('monthlyGrowth')}</th>
                <th onClick={() => handleSort('yearlyGrowth')} style={{ cursor: 'pointer' }}>年增长{getSortIndicator('yearlyGrowth')}</th>
                <th onClick={() => handleSort('rating')} style={{ cursor: 'pointer' }}>评级{getSortIndicator('rating')}</th>
                <th onClick={() => handleSort('rank')} style={{ cursor: 'pointer' }}>近一个月<br/>同类型排名{getSortIndicator('rank')}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedFunds.map(fund => (
                <tr key={fund.code}>
                  <td>{fund.code}</td>
                  <td>{fund.name}</td>
                  <td>{fund.type}</td>
                  <td>{fund.netValue.toFixed(4)}</td>
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
                  <td>{fund.rank > 0 ? `${fund.rank}/${fund.totalInType}` : '-'}</td>
                  <td className="actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSyncFund(fund.code)}
                    >
                      同步
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteFund(fund.code)}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>添加基金</h2>
            <form onSubmit={handleAddFund}>
              <div className="form-group">
                <label>基金代码</label>
                <input
                  type="text"
                  placeholder="请输入6位基金代码"
                  value={newFundCode}
                  onChange={(e) => setNewFundCode(e.target.value)}
                  maxLength={6}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FundList;
