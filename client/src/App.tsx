import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FundList from './pages/FundList';
import Analysis from './pages/Analysis';

function App() {
  const location = useLocation();

  return (
    <>
      <nav>
        <div className="container">
          <h1>📊 fund stats</h1>
          <ul>
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/funds" className={location.pathname === '/funds' ? 'active' : ''}>
                Funds
              </Link>
            </li>
            <li>
              <Link to="/analysis" className={location.pathname === '/analysis' ? 'active' : ''}>
                Analysis
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main>
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/funds" element={<FundList />} />
            <Route path="/analysis" element={<Analysis />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

export default App;
