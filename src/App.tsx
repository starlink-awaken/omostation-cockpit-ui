import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ApiProvider } from './api/provider';
import Dashboard from './components/Dashboard';
import GlobalSearch from './components/GlobalSearch';
import { setCockpitNavigator } from './components/cockpitNavigation';
import { ToastProvider } from './components/common/Toast';
import './index.css';

/**
 * 内部组件: 在 BrowserRouter 上下文中注入 React Router 的 navigate 到 cockpitNavigation 桥接.
 */
function CockpitNavBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    setCockpitNavigator(navigate);
  }, [navigate]);
  return null;
}

function App() {
  return (
    <ApiProvider>
      <ToastProvider>
        <BrowserRouter>
          <CockpitNavBridge />
          <div className="min-h-screen bg-surface-0 text-text-primary">
            <Dashboard />
            <GlobalSearch />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ApiProvider>
  );
}

export default App;
