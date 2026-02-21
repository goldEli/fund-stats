import { useState, useEffect } from 'react';
import { getAllFunds, addFund, deleteFund, syncFund, syncAllFunds } from '../services/api';
import type { Fund, FundRating } from '../types';

type SortField = 'code' | 'name' | 'type' | 'netValue' | 'monthlyGrowth' | 'yearlyGrowth' | 'rating' | 'rank';
type SortDirection = 'asc' | 'desc';

function FundList() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('全部');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFundCodes, setNewFundCodes] = useState('');
  const [adding, setAdding] = useState(false);
  const [addProgress, setAddProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const typeOptions = ['全部', ...new Set(funds.map(f => f.type))].sort();

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

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const existingCodes = new Set(funds.map(f => f.code));
    const codes = newFundCodes.split('。').map(c => c.trim()).filter(c => /^\d{6}$/.test(c) && !existingCodes.has(c));
    
    const skippedCodes = newFundCodes.split('。').map(c => c.trim()).filter(c => /^\d{6}$/.test(c) && existingCodes.has(c));
    
    if (codes.length === 0) {
      setError('请输入有效的基金代码，或添加不在列表中的基金');
      return;
    }

    setAdding(true);
    setAddProgress('开始添加...');
    
    const addedFunds: Fund[] = [];
    const failedCodes: string[] = [];
    
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      setAddProgress(`添加中 (${i + 1}/${codes.length}): ${code}`);
      
      try {
        const fund = await addFund(code);
        addedFunds.push(fund);
      } catch (error) {
        failedCodes.push(code);
      }
      
      if (i < codes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    if (addedFunds.length > 0) {
      setFunds([...funds, ...addedFunds]);
    }
    
    setAdding(false);
    setAddProgress('');
    
    if (failedCodes.length > 0) {
      setError(`添加失败: ${failedCodes.join(', ')}`);
    }
    
    if (addedFunds.length > 0) {
      let msg = `成功添加 ${addedFunds.length} 只基金`;
      if (skippedCodes.length > 0) {
        msg += `（已跳过 ${skippedCodes.length} 只重复基金）`;
      }
      setSuccess(msg);
    }
    
    setNewFundCodes('');
    setShowAddModal(false);
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
    setAddProgress('开始同步...');
    try {
      const results = await syncAllFunds();
      await loadFunds();
      const successCount = results.filter(r => r.success).length;
      setSuccess(`同步完成: ${successCount}/${results.length} 成功`);
    } catch (error) {
      setError('批量同步失败');
    } finally {
      setSyncing(false);
      setAddProgress('');
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
      (typeFilter === '全部' || fund.type === typeFilter) &&
      (fund.code.includes(searchTerm) || 
      fund.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
            style={{ flex: 1 }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ marginLeft: '12px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
          >
            {typeOptions.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
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
        <div className="modal-overlay" onClick={() => !adding && setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>添加基金</h2>
            <form onSubmit={handleAddFunds}>
              <div className="form-group">
                <label>基金代码</label>
                <textarea
                  placeholder="请输入基金代码，多个用中文句号分隔&#10;例如：161039，161725，161130"
                  value={newFundCodes}
                  onChange={(e) => setNewFundCodes(e.target.value)}
                  rows={4}
                  disabled={adding}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              {addProgress && (
                <div style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', color: '#0369a1' }}>
                  {addProgress}
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={adding}>
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
