import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import DataImport from '@/pages/DataImport';
import Overview from '@/pages/Overview';
import PlanSuggestion from '@/pages/PlanSuggestion';
import Equipment from '@/pages/Equipment';
import Report from '@/pages/Report';
import Layout from '@/components/layout/Layout';
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const { loadFromLocalStorage, loadMockData, calculateRisk, generateSuggestions, detectAnomalies } = useAppStore();

  useEffect(() => {
    const hasData = loadFromLocalStorage();
    if (!hasData) {
      loadMockData();
    }
    calculateRisk();
    generateSuggestions();
    detectAnomalies();
  }, [loadFromLocalStorage, loadMockData, calculateRisk, generateSuggestions, detectAnomalies]);

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<DataImport />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/plan" element={<PlanSuggestion />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}
