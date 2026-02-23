import { useState, useEffect } from 'react';
import { getAllFunds, addFund, deleteFund, syncFund, syncAllFunds } from '../services/api';
import type { Fund } from '../types';

type SortField = 'code' | 'name' | 'type' | 'netValue' | 'monthlyGrowth' | 'yearlyGrowth' | 'rank';
type SortDirection = 'asc' | 'desc';

function FundList() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFundCodes, setNewFundCodes] = useState('');
  const [adding, setAdding] = useState(false);
  const [addProgress, setAddProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const typeOptions = ['All', ...new Set(funds.map(f => f.type))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));

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
    const codes = newFundCodes.split('，').map(c => c.trim()).filter(c => /^\d{6}$/.test(c) && !existingCodes.has(c));
    
    const skippedCodes = newFundCodes.split('，').map(c => c.trim()).filter(c => /^\d{6}$/.test(c) && existingCodes.has(c));
    
    if (codes.length === 0) {
      setError('Please enter valid fund codes, or add funds not in the list');
      return;
    }

    setAdding(true);
    setAddProgress('Starting to add...');
    
    const addedFunds: Fund[] = [];
    const failedCodes: string[] = [];
    
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      setAddProgress(`Adding (${i + 1}/${codes.length}): ${code}`);
      
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
      setError(`Failed to add: ${failedCodes.join(', ')}`);
    }
    
    if (addedFunds.length > 0) {
      let msg = `Successfully added ${addedFunds.length} fund(s)`;
      if (skippedCodes.length > 0) {
        msg += ` (skipped ${skippedCodes.length} duplicate(s))`;
      }
      setSuccess(msg);
    }
    
    setNewFundCodes('');
    setShowAddModal(false);
  };

  const handleDeleteFund = async (code: string) => {
    if (!confirm('Are you sure you want to delete this fund?')) return;
    
    try {
      await deleteFund(code);
      setFunds(funds.filter(f => f.code !== code));
      setSuccess('Deleted successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleSyncFund = async (code: string) => {
    try {
      const updatedFund = await syncFund(code);
      setFunds(funds.map(f => f.code === code ? updatedFund : f));
      setSuccess('Synced successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Sync failed');
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    setAddProgress('Starting sync...');
    try {
      const results = await syncAllFunds();
      await loadFunds();
      const successCount = results.filter(r => r.success).length;
      setSuccess(`Sync completed: ${successCount}/${results.length} successful`);
    } catch (error) {
      setError('Batch sync failed');
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

  const filteredAndSortedFunds = funds
    .filter(fund => 
      (typeFilter === 'All' || fund.type === typeFilter) &&
      (fund.code.includes(searchTerm) || 
      fund.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
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

  if (loading) {
    return <div className="loading">Loading...</div>;
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
          <h2>Funds</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={handleSyncAll} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync All'}
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              + Add Fund
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {typeOptions.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  padding: '6px 12px',
                  border: typeFilter === type ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: typeFilter === type ? '#3b82f6' : '#fff',
                  color: typeFilter === type ? '#fff' : '#333',
                  cursor: 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {filteredAndSortedFunds.length === 0 ? (
          <div className="empty">
            {funds.length === 0 ? 'No funds, please add funds' : 'No matching funds found'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('code')} style={{ cursor: 'pointer' }}>Code{getSortIndicator('code')}</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name{getSortIndicator('name')}</th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>Type{getSortIndicator('type')}</th>
                <th onClick={() => handleSort('netValue')} style={{ cursor: 'pointer' }}>NAV{getSortIndicator('netValue')}</th>
                <th onClick={() => handleSort('monthlyGrowth')} style={{ cursor: 'pointer' }}>Monthly{getSortIndicator('monthlyGrowth')}</th>
                <th onClick={() => handleSort('yearlyGrowth')} style={{ cursor: 'pointer' }}>Yearly{getSortIndicator('yearlyGrowth')}</th>
                <th onClick={() => handleSort('rank')} style={{ cursor: 'pointer' }}>Rank<br/>(1 Month){getSortIndicator('rank')}</th>
                <th>Actions</th>
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
                  <td>{fund.rank > 0 ? `${fund.rank}/${fund.totalInType}` : '-'}</td>
                  <td className="actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSyncFund(fund.code)}
                    >
                      Sync
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteFund(fund.code)}
                    >
                      Delete
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
            <h2>Add Fund</h2>
            <form onSubmit={handleAddFunds}>
              <div className="form-group">
                <label>Fund Code</label>
                <textarea
                  placeholder="Enter fund codes, separated by Chinese comma&#10;Example: 161039，161725，161130"
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? 'Adding...' : 'Add'}
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
