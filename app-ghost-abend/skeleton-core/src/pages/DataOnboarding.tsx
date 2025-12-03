// Data Onboarding - Zero-data CSV/Excel upload to create datasets and jobs
import React, { useState, useCallback } from 'react';
import { useOsAppApi } from '../core/useOsAppApi';
import { useZeroframe } from '../core/ZeroframeContext';
import type { Workspace, DatasetColumn, DatasetColumnType } from '../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import '../styles/DataOnboarding.css';

type ParsedRow = Record<string, unknown>;

export const DataOnboarding: React.FC = () => {
  const api = useOsAppApi('data-onboarding');
  const { activeOrg } = useZeroframe();
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(api.activeWorkspace);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<DatasetColumn[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inferColumnType = useCallback((values: unknown[]): DatasetColumnType => {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNullValues.length === 0) return 'string';

    let allNumbers = true;
    let allBooleans = true;
    let allDates = true;

    for (const val of nonNullValues.slice(0, 50)) {
      const str = String(val).trim().toLowerCase();
      
      // Check boolean
      if (str !== 'true' && str !== 'false' && str !== '1' && str !== '0') {
        allBooleans = false;
      }
      
      // Check number
      if (isNaN(Number(val))) {
        allNumbers = false;
      }
      
      // Check date
      if (isNaN(Date.parse(String(val)))) {
        allDates = false;
      }
    }

    if (allBooleans) return 'boolean';
    if (allNumbers) return 'number';
    if (allDates && nonNullValues.length > 0) return 'date';
    return 'string';
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    // Default dataset name from filename
    const nameWithoutExt = selectedFile.name.replace(/\.(csv|xlsx|xls)$/i, '');
    setDatasetName(nameWithoutExt);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      let rows: ParsedRow[] = [];

      if (ext === 'csv') {
        // Parse CSV
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            rows = results.data as ParsedRow[];
            processRows(rows);
          },
          error: (err) => {
            setError(`CSV parsing error: ${err.message}`);
            setIsProcessing(false);
          },
        });
        return; // Async callback handles the rest
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Parse Excel
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(firstSheet) as ParsedRow[];
        processRows(rows);
      } else {
        setError('Unsupported file format. Please upload CSV or Excel files.');
        setIsProcessing(false);
      }
    } catch (err) {
      setError(`File processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  }, []);

  const processRows = useCallback((rows: ParsedRow[]) => {
    if (rows.length === 0) {
      setError('File is empty or has no data rows.');
      setIsProcessing(false);
      return;
    }

    // Limit rows for memory
    const limitedRows = rows.slice(0, 200);
    setParsedRows(limitedRows);

    // Infer schema
    const keys = Object.keys(limitedRows[0]);
    const inferredColumns: DatasetColumn[] = keys.map(key => {
      const values = limitedRows.map(row => row[key]);
      const type = inferColumnType(values);
      const nullable = values.some(v => v === null || v === undefined || v === '');
      const sampleValues = values
        .filter(v => v !== null && v !== undefined && v !== '')
        .slice(0, 5)
        .map(v => String(v));

      return {
        name: key,
        type,
        nullable,
        sampleValues,
      };
    });

    setColumns(inferredColumns);
    setIsProcessing(false);
  }, [inferColumnType]);

  const handleCreateDataset = useCallback(() => {
    if (!file || !datasetName || columns.length === 0) {
      setError('Please upload a file and ensure it has valid data.');
      return;
    }

    try {
      // Create dataset via syscall
      const previewRows = parsedRows.slice(0, 50);
      const dataset = api.createDataset!({
        name: datasetName,
        workspace: selectedWorkspace,
        description: `Uploaded from file ${file.name}`,
        source: 'upload',
        columns,
        rowCount: parsedRows.length,
        sampleRows: previewRows,
      });

      // Submit demo jobs with lineage
      api.submitJob!({
        name: `Ingest ${dataset.name}`,
        type: 'ETL',
        workspace: selectedWorkspace,
        priority: 'HIGH',
        description: `Simulated ingestion of file "${file.name}" into dataset ${dataset.name}`,
        scriptSummary: `Load ${parsedRows.length} records into ${dataset.name}`,
        tags: ['upload', 'ingest', dataset.name],
        datasetId: dataset.id,
        inputDatasetIds: [dataset.id],
        outputDatasetIds: [dataset.id],
      });

      api.submitJob!({
        name: `Profile ${dataset.name}`,
        type: 'REPORT',
        workspace: selectedWorkspace,
        priority: 'NORMAL',
        description: `Profile dataset ${dataset.name} for basic statistics`,
        scriptSummary: `Compute column statistics for ${dataset.name}`,
        tags: ['upload', 'profile', dataset.name],
        datasetId: dataset.id,
        inputDatasetIds: [dataset.id],
      });

      api.logAppAudit({
        action: 'DATA_ONBOARDING_COMPLETE',
        resourceType: 'DATASET',
        resourceId: dataset.id,
        details: `Uploaded ${file.name}, created dataset ${dataset.name}, submitted 2 jobs`,
      });

      // Reset form
      setFile(null);
      setDatasetName('');
      setParsedRows([]);
      setColumns([]);
      setError(null);
    } catch (err) {
      setError(`Failed to create dataset: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [file, datasetName, columns, parsedRows, selectedWorkspace, api]);

  const previewRows = parsedRows.slice(0, 10);

  return (
    <div className="data-onboarding-page">
      <div className="page-header">
        <h1>📥 Data Onboarding</h1>
        <p className="page-subtitle">
          Upload CSV or Excel files to create datasets and demo jobs. Zero-data approach: bring your own data.
        </p>
      </div>

      <div className="onboarding-context">
        <div className="context-item">
          <span className="context-label">Organization:</span>
          <span className="context-value">{activeOrg.name}</span>
        </div>
        <div className="context-item">
          <span className="context-label">Workspace:</span>
          <select 
            value={selectedWorkspace} 
            onChange={(e) => setSelectedWorkspace(e.target.value as Workspace)}
            className="workspace-selector"
          >
            <option value="DEV">DEV</option>
            <option value="UAT">UAT</option>
            <option value="PROD">PROD</option>
          </select>
        </div>
      </div>

      <div className="upload-section">
        <h2>Upload File</h2>
        <div className="upload-controls">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="file-input"
          />
          {file && (
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>

        {isProcessing && <div className="processing-indicator">Processing file...</div>}
        {error && <div className="error-message">{error}</div>}
      </div>

      {columns.length > 0 && (
        <>
          <div className="dataset-config-section">
            <h2>Dataset Configuration</h2>
            <div className="config-form">
              <div className="form-group">
                <label>Dataset Name:</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="dataset-name-input"
                  placeholder="Enter dataset name"
                />
              </div>
              <div className="form-group">
                <label>Rows:</label>
                <span className="row-count">{parsedRows.length}</span>
              </div>
              <div className="form-group">
                <label>Columns:</label>
                <span className="column-count">{columns.length}</span>
              </div>
            </div>
          </div>

          <div className="schema-section">
            <h2>Inferred Schema</h2>
            <table className="schema-table">
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Type</th>
                  <th>Nullable</th>
                  <th>Sample Values</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col, idx) => (
                  <tr key={idx}>
                    <td className="col-name">{col.name}</td>
                    <td className="col-type">{col.type}</td>
                    <td className="col-nullable">{col.nullable ? 'Yes' : 'No'}</td>
                    <td className="col-samples">{col.sampleValues.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="preview-section">
            <h2>Data Preview (first 10 rows)</h2>
            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx}>{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {columns.map((col, colIdx) => (
                        <td key={colIdx}>{String(row[col.name] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="action-section">
            <button 
              onClick={handleCreateDataset}
              className="create-button"
              disabled={!datasetName || columns.length === 0}
            >
              Create Dataset & Submit Jobs
            </button>
            <p className="action-hint">
              This will create the dataset and submit 2 demo jobs (Ingest + Profile). 
              Go to Job Center to run the worker tick.
            </p>
          </div>
        </>
      )}

      {!file && (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No file uploaded yet</h3>
          <p>Upload a CSV or Excel file to get started. The system will infer the schema and create a dataset.</p>
        </div>
      )}
    </div>
  );
};

export default DataOnboarding;
