import React, { useState, useCallback, useRef } from 'react';
import { Button, Tabs, Table, message, Upload, Space } from 'antd';
import { UploadOutlined, DatabaseOutlined, ThunderboltOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  SnowPiste,
  Weather,
  PassengerFlow,
  GroomingRecord,
  Equipment,
  SnowMakingRecord,
  PISTE_LEVEL_LABELS,
} from '@/store/types';
import { useAppStore } from '@/store/useAppStore';
import { parseCSV } from '@/utils/csvParser';
import Layout from '@/components/layout/Layout';
import SnowfallEffect from '@/components/common/SnowfallEffect';

interface PreviewData {
  pistes: SnowPiste[];
  weather: Weather[];
  passengerFlows: PassengerFlow[];
  groomingRecords: GroomingRecord[];
  equipment: Equipment[];
  snowMakingRecords: SnowMakingRecord[];
}

const { Dragger } = Upload;

export default function DataImport() {
  const [activeTab, setActiveTab] = useState('pistes');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loadMockData, calculateRisk, generateSuggestions, detectAnomalies, setData, isLoading } = useAppStore();

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const mappedData: PreviewData = {
        pistes: parsed.pistes.map(p => ({ ...p, riskScore: 0, riskLevel: 'low' as const })),
        weather: parsed.weather,
        passengerFlows: parsed.passengerFlows,
        groomingRecords: parsed.groomingRecords,
        equipment: parsed.equipment,
        snowMakingRecords: parsed.snowMakingRecords,
      };
      setPreviewData(mappedData);
      message.success(`成功解析文件，共 ${Object.values(mappedData).flat().length} 条数据`);
    } catch (error) {
      message.error('文件解析失败，请检查 CSV 格式');
    }
    return false;
  }, []);

  const handleGenerateMock = useCallback(() => {
    loadMockData();
    message.success('模拟数据已生成');
  }, [loadMockData]);

  const handleConfirmImport = useCallback(() => {
    if (!previewData) return;

    const dataToImport = {
      snowPistes: previewData.pistes,
      weatherRecords: previewData.weather,
      passengerFlowRecords: previewData.passengerFlows,
      groomingRecords: previewData.groomingRecords,
      equipment: previewData.equipment,
      snowMakingRecords: previewData.snowMakingRecords,
    };

    setData(dataToImport);
    calculateRisk();
    generateSuggestions();
    detectAnomalies();

    message.success('数据导入成功，已完成风险计算、建议生成和异常检测');
    setPreviewData(null);
  }, [previewData, setData, calculateRisk, generateSuggestions, detectAnomalies]);

  const handleClearData = useCallback(() => {
    setPreviewData(null);
    message.info('已清空预览数据');
  }, []);

  const handleUploadChange = useCallback((info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'done' || info.file.status === 'uploading') {
      const file = info.file.originFileObj;
      if (file) {
        handleFileUpload(file);
      }
    }
  }, [handleFileUpload]);

  const tabItems = [
    { key: 'pistes', label: '雪道' },
    { key: 'weather', label: '气象' },
    { key: 'passengerFlows', label: '客流' },
    { key: 'groomingRecords', label: '压雪记录' },
    { key: 'snowMakingRecords', label: '造雪记录' },
    { key: 'equipment', label: '设备' },
  ];

  const getColumns = (type: string) => {
    switch (type) {
      case 'pistes':
        return [
          { title: '雪道名称', dataIndex: 'name', key: 'name' },
          { title: '等级', dataIndex: 'level', key: 'level', render: (l: string) => PISTE_LEVEL_LABELS[l as keyof typeof PISTE_LEVEL_LABELS] || l },
          { title: '长度(m)', dataIndex: 'length', key: 'length' },
          { title: '基准雪深(cm)', dataIndex: 'baseSnowDepth', key: 'baseSnowDepth' },
          { title: '当前雪深(cm)', dataIndex: 'currentSnowDepth', key: 'currentSnowDepth' },
          { title: '状态', dataIndex: 'status', key: 'status' },
        ];
      case 'weather':
        return [
          { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: (t: string) => t.slice(0, 16) },
          { title: '气温(°C)', dataIndex: 'temperature', key: 'temperature' },
          { title: '湿度(%)', dataIndex: 'humidity', key: 'humidity' },
          { title: '降雪量(cm)', dataIndex: 'snowfall', key: 'snowfall' },
          { title: '风速(m/s)', dataIndex: 'windSpeed', key: 'windSpeed' },
          { title: '天气', dataIndex: 'weatherCondition', key: 'weatherCondition' },
        ];
      case 'passengerFlows':
        return [
          { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: (t: string) => t.slice(0, 16) },
          { title: '雪道ID', dataIndex: 'pisteId', key: 'pisteId' },
          { title: '客流量', dataIndex: 'passengerCount', key: 'passengerCount' },
          { title: '利用率(%)', dataIndex: 'utilizationRate', key: 'utilizationRate', render: (v: number) => (v * 100).toFixed(1) },
        ];
      case 'groomingRecords':
        return [
          { title: '雪道ID', dataIndex: 'pisteId', key: 'pisteId' },
          { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: (t: string) => t.slice(0, 16) },
          { title: '结束时间', dataIndex: 'endTime', key: 'endTime', render: (t: string) => t.slice(0, 16) },
          { title: '操作员', dataIndex: 'operator', key: 'operator' },
          { title: '质量评分', dataIndex: 'qualityScore', key: 'qualityScore' },
        ];
      case 'snowMakingRecords':
        return [
          { title: '设备ID', dataIndex: 'equipmentId', key: 'equipmentId' },
          { title: '雪道ID', dataIndex: 'pisteId', key: 'pisteId' },
          { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: (t: string) => t.slice(0, 16) },
          { title: '造雪量(m³)', dataIndex: 'snowOutput', key: 'snowOutput' },
          { title: '能耗(kWh)', dataIndex: 'energyUsed', key: 'energyUsed' },
        ];
      case 'equipment':
        return [
          { title: '设备名称', dataIndex: 'name', key: 'name' },
          { title: '型号', dataIndex: 'model', key: 'model' },
          { title: '状态', dataIndex: 'status', key: 'status' },
          { title: '运行时长(h)', dataIndex: 'runHours', key: 'runHours' },
          { title: '能耗功率(kW)', dataIndex: 'energyConsumption', key: 'energyConsumption' },
        ];
      default:
        return [];
    }
  };

  const getTableData = () => {
    if (!previewData) return [];
    const key = activeTab as keyof PreviewData;
    return previewData[key] || [];
  };

  const getDataCount = () => {
    if (!previewData) return 0;
    return Object.values(previewData).flat().length;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">数据导入</h1>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerateMock}
            loading={isLoading}
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '0 24px',
            }}
          >
            一键生成模拟数据
          </Button>
        </div>

        <div
          className={`
            relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300
            ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 bg-white/60'}
            backdrop-blur-xl overflow-hidden
          `}
          style={{
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
          }}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
          }}
        >
          {isDragging && <SnowfallEffect count={30} />}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <Dragger
            name="file"
            multiple={false}
            accept=".csv"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleUploadChange}
            style={{ border: 'none', background: 'transparent' }}
            className="!border-none !bg-transparent"
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text text-lg font-medium text-gray-700">点击或拖拽 CSV 文件到此处</p>
            <p className="ant-upload-hint text-gray-500">支持雪道、气象、客流、压雪记录、造雪记录、设备等数据类型</p>
          </Dragger>
        </div>

        {previewData && getDataCount() > 0 && (
          <div
            className="backdrop-blur-xl bg-white/60 rounded-2xl p-6"
            style={{
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <DatabaseOutlined className="text-2xl text-blue-500" />
                <span className="text-lg font-semibold text-gray-800">数据预览</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  共 {getDataCount()} 条数据
                </span>
              </div>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems.map(item => ({
                ...item,
                label: (
                  <span className="flex items-center gap-2">
                    {item.label}
                    {previewData && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {previewData[item.key as keyof PreviewData]?.length || 0}
                      </span>
                    )}
                  </span>
                ),
              }))}
              className="mb-4"
            />

            <Table<any>
              columns={getColumns(activeTab)}
              dataSource={getTableData()}
              rowKey="id"
              pagination={{
                pageSize,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                onShowSizeChange: (_, size) => setPageSize(size),
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 'max-content' }}
            />
          </div>
        )}

        {previewData && getDataCount() > 0 && (
          <div className="flex justify-end gap-4">
            <Button
              size="large"
              icon={<DeleteOutlined />}
              onClick={handleClearData}
              style={{ borderRadius: '12px', padding: '0 24px' }}
            >
              清空数据
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleConfirmImport}
              loading={isLoading}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '0 24px',
              }}
            >
              确认导入
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
