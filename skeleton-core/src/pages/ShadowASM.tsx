import React, { useEffect, useState } from 'react';
import { useOsAppApi } from '../core/useOsAppApi';
import '../styles/ShadowASM.css';

interface ShadowAsmProgram {
  source: string;
}

interface ShadowAsmExecutionState {
  pc: number;
  registers: Record<string, number>;
  output: string[];
  halted: boolean;
  error?: string;
  steps: number;
}

const SAMPLE_PROGRAMS = {
  sum: `; Sum from 1 to 5
LOAD R0, 5
LOAD R1, 0
LOAD R2, 1
ADD R1, R0
SUB R0, R2
JNZ R0, -2
PRINT R1
HALT`,
  countdown: `; Countdown from 10
LOAD R0, 10
PRINT R0
LOAD R1, 1
SUB R0, R1
JNZ R0, -3
HALT`,
  fibonacci: `; First 8 Fibonacci numbers
LOAD R0, 0
LOAD R1, 1
LOAD R2, 8
PRINT R0
PRINT R1
ADD R0, R1
PRINT R0
SUB R1, R0
ADD R1, R0
ADD R1, R0
PRINT R1
LOAD R3, 1
SUB R2, R3
JNZ R2, -8
HALT`,
  multiply: `; Multiply 7 * 6 using addition
LOAD R0, 7      ; multiplicand
LOAD R1, 6      ; multiplier
LOAD R2, 0      ; result
LOAD R3, 1      ; decrement
MUL R2, R0, R1  ; R2 = R0 * R1
PRINT R2
HALT`,
  comparison: `; Compare and branch demo
LOAD R0, 10
LOAD R1, 5
CMP R0, R1      ; compare R0 and R1
JG 2            ; jump if R0 > R1
PRINT R1
JMP 1
PRINT R0
HALT`,
  mainframe: `; Mainframe-style branching
LOAD R0, 100
LOAD R1, 50
LOAD R2, 100
CMP R0, R1
BH 2            ; branch if higher
PRINT R1
B 1             ; unconditional branch
PRINT R0
CMP R0, R2
BE 2            ; branch if equal
PRINT R1
B 1
PRINT R2
HALT`,
};

function interpretShadowAsm(program: ShadowAsmProgram): ShadowAsmExecutionState {
  const lines = program.source
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith(';'));

  const state: ShadowAsmExecutionState = {
    pc: 0,
    registers: { R0: 0, R1: 0, R2: 0, R3: 0 },
    output: [],
    halted: false,
    error: undefined,
    steps: 0,
  };

  const MAX_STEPS = 256;

  while (!state.halted && state.steps < MAX_STEPS) {
    if (state.pc < 0 || state.pc >= lines.length) {
      state.error = `Program counter out of bounds: ${state.pc}`;
      state.halted = true;
      break;
    }

    const line = lines[state.pc];
    const parts = line.split(/[\s,]+/).filter(p => p);
    const instruction = parts[0]?.toUpperCase();

    state.steps++;

    try {
      switch (instruction) {
        case 'LOAD': {
          const reg = parts[1];
          const value = parseInt(parts[2], 10);
          if (isNaN(value)) throw new Error(`Invalid value: ${parts[2]}`);
          state.registers[reg] = value;
          state.pc++;
          break;
        }

        case 'ADD': {
          const regA = parts[1];
          const regB = parts[2];
          if (!(regA in state.registers) || !(regB in state.registers)) {
            throw new Error(`Invalid register: ${regA} or ${regB}`);
          }
          state.registers[regA] = state.registers[regA] + state.registers[regB];
          state.pc++;
          break;
        }

        case 'SUB': {
          const regA = parts[1];
          const regB = parts[2];
          if (!(regA in state.registers) || !(regB in state.registers)) {
            throw new Error(`Invalid register: ${regA} or ${regB}`);
          }
          state.registers[regA] = state.registers[regA] - state.registers[regB];
          state.pc++;
          break;
        }

        case 'MUL': {
          const regA = parts[1];
          const regB = parts[2];
          const regC = parts[3];
          if (!(regA in state.registers) || !(regB in state.registers) || !(regC in state.registers)) {
            throw new Error(`Invalid register: ${regA}, ${regB}, or ${regC}`);
          }
          state.registers[regA] = state.registers[regB] * state.registers[regC];
          state.pc++;
          break;
        }

        case 'DIV': {
          const regA = parts[1];
          const regB = parts[2];
          const regC = parts[3];
          if (!(regA in state.registers) || !(regB in state.registers) || !(regC in state.registers)) {
            throw new Error(`Invalid register: ${regA}, ${regB}, or ${regC}`);
          }
          if (state.registers[regC] === 0) {
            throw new Error('Division by zero');
          }
          state.registers[regA] = Math.floor(state.registers[regB] / state.registers[regC]);
          state.pc++;
          break;
        }

        case 'MOD': {
          const regA = parts[1];
          const regB = parts[2];
          const regC = parts[3];
          if (!(regA in state.registers) || !(regB in state.registers) || !(regC in state.registers)) {
            throw new Error(`Invalid register: ${regA}, ${regB}, or ${regC}`);
          }
          state.registers[regA] = state.registers[regB] % state.registers[regC];
          state.pc++;
          break;
        }

        case 'INC': {
          const reg = parts[1];
          if (!(reg in state.registers)) {
            throw new Error(`Invalid register: ${reg}`);
          }
          state.registers[reg]++;
          state.pc++;
          break;
        }

        case 'DEC': {
          const reg = parts[1];
          if (!(reg in state.registers)) {
            throw new Error(`Invalid register: ${reg}`);
          }
          state.registers[reg]--;
          state.pc++;
          break;
        }

        case 'CMP': {
          const regA = parts[1];
          const regB = parts[2];
          if (!(regA in state.registers) || !(regB in state.registers)) {
            throw new Error(`Invalid register: ${regA} or ${regB}`);
          }
          // Store comparison result in a special FLAGS register
          const diff = state.registers[regA] - state.registers[regB];
          state.registers['FLAGS'] = diff === 0 ? 0 : diff > 0 ? 1 : -1;
          state.pc++;
          break;
        }

        case 'JMP':
        case 'B': {
          const offset = parseInt(parts[1], 10);
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[1]}`);
          state.pc += offset;
          break;
        }

        case 'JZ': {
          const reg = parts[1];
          const offset = parseInt(parts[2], 10);
          if (!(reg in state.registers)) {
            throw new Error(`Invalid register: ${reg}`);
          }
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[2]}`);
          
          if (state.registers[reg] === 0) {
            state.pc += offset;
          } else {
            state.pc++;
          }
          break;
        }

        case 'JNZ': {
          const reg = parts[1];
          const offset = parseInt(parts[2], 10);
          if (!(reg in state.registers)) {
            throw new Error(`Invalid register: ${reg}`);
          }
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[2]}`);
          
          if (state.registers[reg] !== 0) {
            state.pc += offset;
          } else {
            state.pc++;
          }
          break;
        }

        case 'JG':
        case 'BH': {
          const offset = parseInt(parts[1], 10);
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[1]}`);
          
          if (state.registers['FLAGS'] > 0) {
            state.pc += offset;
          } else {
            state.pc++;
          }
          break;
        }

        case 'JL':
        case 'BL': {
          const offset = parseInt(parts[1], 10);
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[1]}`);
          
          if (state.registers['FLAGS'] < 0) {
            state.pc += offset;
          } else {
            state.pc++;
          }
          break;
        }

        case 'JE':
        case 'BE': {
          const offset = parseInt(parts[1], 10);
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[1]}`);
          
          if (state.registers['FLAGS'] === 0) {
            state.pc += offset;
          } else {
            state.pc++;
          }
          break;
        }

        case 'JNE':
        case 'BNE': {
          const offset = parseInt(parts[1], 10);
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[1]}`);
          
          if (state.registers['FLAGS'] !== 0) {
            state.pc += offset;
          } else {
            state.pc++;
          }
          break;
        }

        case 'JGE':
        case 'BNL': {
          const offset = parseInt(parts[1], 10);
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[1]}`);
          
          if (state.registers['FLAGS'] >= 0) {
            state.pc += offset;
          } else {
            state.pc++;
          }
          break;
        }

        case 'JLE':
        case 'BNH': {
          const offset = parseInt(parts[1], 10);
          if (isNaN(offset)) throw new Error(`Invalid offset: ${parts[1]}`);
          
          if (state.registers['FLAGS'] <= 0) {
            state.pc += offset;
          } else {
            state.pc++;
          }
          break;
        }

        case 'MOVE': {
          const regA = parts[1];
          const regB = parts[2];
          if (!(regA in state.registers) || !(regB in state.registers)) {
            throw new Error(`Invalid register: ${regA} or ${regB}`);
          }
          state.registers[regA] = state.registers[regB];
          state.pc++;
          break;
        }

        case 'PRINT': {
          const reg = parts[1];
          if (!(reg in state.registers)) {
            throw new Error(`Invalid register: ${reg}`);
          }
          state.output.push(`${reg}: ${state.registers[reg]}`);
          state.pc++;
          break;
        }

        case 'HALT': {
          state.halted = true;
          break;
        }

        case 'NOP': {
          state.pc++;
          break;
        }

        default:
          throw new Error(`Unknown instruction: ${instruction}`);
      }
    } catch (err) {
      state.error = err instanceof Error ? err.message : String(err);
      state.halted = true;
    }
  }

  if (state.steps >= MAX_STEPS && !state.halted) {
    state.error = 'Maximum steps exceeded (possible infinite loop)';
    state.halted = true;
  }

  return state;
}

const ShadowASM: React.FC = () => {
  const api = useOsAppApi('shadowasm');
  const datasets = api.datasets ?? [];
  const workspaceDatasets = datasets.filter(d => d.workspace === api.activeWorkspace);
  
  const [source, setSource] = useState(SAMPLE_PROGRAMS.sum);
  const [executionState, setExecutionState] = useState<ShadowAsmExecutionState | null>(null);
  const [jobSubmitted, setJobSubmitted] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');

  useEffect(() => {
    api.logAppAudit({
      action: 'SHADOWASM_VIEWED',
      resourceType: 'SYSTEM_APP',
      details: 'Opened ShadowASM assembly playground',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunLocally = () => {
    const result = interpretShadowAsm({ source });
    setExecutionState(result);
    
    api.logAppAudit({
      action: 'SHADOWASM_RUN_LOCAL',
      resourceType: 'SYSTEM_APP',
      details: `Ran assembly program locally in workspace ${api.activeWorkspace}`,
    });
  };

  const handleSubmitAsJob = () => {
    if (!api.submitJob) return;
    
    const selectedDataset = selectedDatasetId ? datasets.find(d => d.id === selectedDatasetId) : undefined;
    const firstLine = source.split('\n').find(line => line.trim() && !line.trim().startsWith(';'));
    const jobName = selectedDataset 
      ? `ShadowASM Sim - ${selectedDataset.name}`
      : firstLine ? `ShadowASM: ${firstLine.substring(0, 30)}...` : 'ShadowASM Simulation';
    
    const scriptPreview = source.split('\n').slice(0, 5).join('\n');
    
    api.submitJob({
      name: jobName,
      type: 'SIMULATION',
      workspace: api.activeWorkspace,
      priority: 'NORMAL',
      description: selectedDataset
        ? `ShadowASM simulation program targeting dataset ${selectedDataset.name}`
        : 'ShadowASM program submitted as a simulation job.',
      scriptSummary: `ShadowASM program:\n${scriptPreview}\n...`,
      tags: selectedDataset ? ['shadowasm', 'simulation', selectedDataset.name] : ['shadowasm', 'simulation'],
      datasetId: selectedDataset?.id,
    });

    api.logAppAudit({
      action: 'SHADOWASM_SUBMIT_JOB',
      resourceType: 'JOB',
      details: selectedDataset 
        ? `Submitted ShadowASM program as SIMULATION job for dataset ${selectedDataset.name}`
        : 'Submitted ShadowASM program as SIMULATION job',
    });

    setJobSubmitted(true);
    setTimeout(() => setJobSubmitted(false), 3000);
  };

  const loadSample = (key: keyof typeof SAMPLE_PROGRAMS) => {
    setSource(SAMPLE_PROGRAMS[key]);
    setExecutionState(null);
  };

  const generateDatasetProgram = () => {
    const dataset = datasets.find(d => d.id === selectedDatasetId);
    if (!dataset) return;

    const columnList = dataset.columns?.map(c => `${c.name} (${c.type})`).join(', ') || 'unknown';
    
    // Add profile stats to comments if available
    let profileComments = '';
    if (dataset.profile && dataset.profile.columnProfiles.length > 0) {
      profileComments = '\n; Column stats:';
      dataset.profile.columnProfiles.forEach(col => {
        let stats = `\n;   - ${col.columnName} (${col.type}):`;
        if (col.type === 'number' && col.avg !== undefined) {
          stats += ` min=${col.minValue}, max=${col.maxValue}, avg=${col.avg.toFixed(2)}`;
        } else if (col.distinctCount !== undefined) {
          stats += ` distinct=${col.distinctCount}`;
        }
        if (col.nullCount !== undefined && col.nullCount > 0) {
          stats += `, nulls=${col.nullCount}`;
        }
        profileComments += stats;
      });
    }
    
    const program = `; ShadowASM starter program for dataset "${dataset.name}"
; Workspace: ${dataset.workspace}
; Columns: ${columnList}
; Rows: ${dataset.rowCount || 0}
; VFS path: /${dataset.workspace}/datasets/${dataset.name}${profileComments}

LOAD R0, 0          ; row counter
LOAD R1, ${dataset.rowCount || 0}  ; total rows

; Loop over rows (simulated)
LOOP:
  ; TODO: add logic to process each row from "${dataset.name}"
  ; e.g., aggregate a numeric column, filter values, etc.
  
  ADD R0, 1         ; increment row counter
  PRINT R0          ; output current row number
  
  SUB R1, 1         ; decrement remaining
  JNZ R1, -4        ; loop if more rows
  
HALT`;

    setSource(program);
    setExecutionState(null);
    
    api.logAppAudit({
      action: 'SHADOWASM_GENERATE_DATASET_PROGRAM',
      resourceType: 'DATASET',
      resourceId: dataset.id,
      details: `Generated starter program for dataset ${dataset.name}`,
    });
  };

  return (
    <div className="shadowasm">
      <div className="shadowasm-header">
        <h2>🔧 ShadowASM</h2>
        <p className="app-tagline">High-level assembly playground for Zeroframe OS</p>
      </div>
      
      <div className="app-description">
        <p>
          ShadowASM is a development tool that provides a simple assembly-like language for experimenting
          with low-level operations. Programs run locally in the browser and can be submitted as SIMULATION
          jobs to the Zeroframe OS job engine for tracking and governance.
        </p>
      </div>

      <div className="shadowasm-content">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>Assembly Editor</h3>
            <div className="sample-buttons">
              <button onClick={() => loadSample('sum')} className="sample-btn">Sum</button>
              <button onClick={() => loadSample('countdown')} className="sample-btn">Countdown</button>
              <button onClick={() => loadSample('fibonacci')} className="sample-btn">Fibonacci</button>
              <button onClick={() => loadSample('multiply')} className="sample-btn">Multiply</button>
              <button onClick={() => loadSample('comparison')} className="sample-btn">Compare</button>
              <button onClick={() => loadSample('mainframe')} className="sample-btn">Mainframe</button>
            </div>
          </div>

          {workspaceDatasets.length > 0 && (
            <div className="dataset-selector">
              <label>Target Dataset (optional):</label>
              <select 
                value={selectedDatasetId} 
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="dataset-select"
              >
                <option value="">None</option>
                {workspaceDatasets.map(ds => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} ({ds.rowCount || 0} rows)
                  </option>
                ))}
              </select>
              {selectedDatasetId && (
                <button 
                  onClick={generateDatasetProgram}
                  className="generate-btn"
                >
                  Generate Starter Program
                </button>
              )}
            </div>
          )}

          {selectedDatasetId && datasets.find(d => d.id === selectedDatasetId) && (
            <div className="dataset-preview">
              {(() => {
                const ds = datasets.find(d => d.id === selectedDatasetId)!;
                return (
                  <>
                    <div className="dataset-preview-header">
                      <strong>{ds.name}</strong> - {ds.workspace}
                    </div>
                    <div className="dataset-preview-details">
                      {ds.columns && <span>{ds.columns.length} columns</span>}
                      {ds.rowCount && <span>{ds.rowCount.toLocaleString()} rows</span>}
                    </div>
                    {ds.columns && ds.columns.length > 0 && (
                      <div className="dataset-columns">
                        <strong>Columns:</strong>
                        {ds.columns.map((col, idx) => (
                          <span key={idx} className="column-tag">
                            {col.name} ({col.type})
                          </span>
                        ))}
                      </div>
                    )}
                    {ds.profile && (
                      <div className="dataset-profile-summary">
                        <strong>Profile Stats:</strong>
                        <div className="profile-stats">
                          {ds.profile.columnProfiles.slice(0, 3).map((col, idx) => (
                            <div key={idx} className="profile-stat-item">
                              <span className="stat-col-name">{col.columnName}:</span>
                              <span className="stat-details">
                                {col.type === 'number' && col.avg !== undefined && ` avg=${col.avg.toFixed(2)}`}
                                {col.distinctCount !== undefined && ` distinct=${col.distinctCount}`}
                                {col.nullCount !== undefined && ` nulls=${col.nullCount}`}
                              </span>
                            </div>
                          ))}
                          {ds.profile.columnProfiles.length > 3 && (
                            <div className="profile-more">
                              +{ds.profile.columnProfiles.length - 3} more columns
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          
          <textarea
            className="code-editor"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Enter ShadowASM code..."
            spellCheck={false}
          />

          <div className="editor-actions">
            <button 
              className="run-btn" 
              onClick={handleRunLocally}
              disabled={!source.trim()}
            >
              ▶ Run Locally
            </button>
            <button 
              className="submit-btn" 
              onClick={handleSubmitAsJob}
              disabled={!source.trim()}
            >
              📤 Submit as Simulation Job
            </button>
          </div>

          {jobSubmitted && (
            <div className="job-submitted-message">
              ✅ Job submitted! View in Job & Batch Center.
            </div>
          )}

          <div className="instruction-reference">
            <h4>Instruction Set</h4>
            <div className="instruction-categories">
              <div className="instruction-category">
                <strong>Data Movement:</strong>
                <ul>
                  <li><code>LOAD Rn, &lt;value&gt;</code> - Load immediate value</li>
                  <li><code>MOVE Rn, Rm</code> - Copy Rm to Rn</li>
                </ul>
              </div>
              <div className="instruction-category">
                <strong>Arithmetic:</strong>
                <ul>
                  <li><code>ADD Rn, Rm</code> - Add Rm to Rn</li>
                  <li><code>SUB Rn, Rm</code> - Subtract Rm from Rn</li>
                  <li><code>MUL Rn, Rm, Rk</code> - Rn = Rm * Rk</li>
                  <li><code>DIV Rn, Rm, Rk</code> - Rn = Rm / Rk</li>
                  <li><code>MOD Rn, Rm, Rk</code> - Rn = Rm % Rk</li>
                  <li><code>INC Rn</code> - Increment Rn</li>
                  <li><code>DEC Rn</code> - Decrement Rn</li>
                </ul>
              </div>
              <div className="instruction-category">
                <strong>Comparison & Branching:</strong>
                <ul>
                  <li><code>CMP Rn, Rm</code> - Compare registers (sets FLAGS)</li>
                  <li><code>JMP/B &lt;offset&gt;</code> - Unconditional branch</li>
                  <li><code>JZ Rn, &lt;offset&gt;</code> - Jump if Rn == 0</li>
                  <li><code>JNZ Rn, &lt;offset&gt;</code> - Jump if Rn != 0</li>
                  <li><code>JE/BE &lt;offset&gt;</code> - Branch if equal</li>
                  <li><code>JNE/BNE &lt;offset&gt;</code> - Branch if not equal</li>
                  <li><code>JG/BH &lt;offset&gt;</code> - Branch if higher/greater</li>
                  <li><code>JL/BL &lt;offset&gt;</code> - Branch if lower/less</li>
                  <li><code>JGE/BNL &lt;offset&gt;</code> - Branch if not lower</li>
                  <li><code>JLE/BNH &lt;offset&gt;</code> - Branch if not higher</li>
                </ul>
              </div>
              <div className="instruction-category">
                <strong>I/O & Control:</strong>
                <ul>
                  <li><code>PRINT Rn</code> - Output register value</li>
                  <li><code>NOP</code> - No operation</li>
                  <li><code>HALT</code> - Stop execution</li>
                </ul>
              </div>
            </div>
            <p className="note">Registers: R0, R1, R2, R3, FLAGS (initialized to 0)</p>
          </div>
        </div>

        <div className="execution-panel">
          <h3>Execution Results</h3>
          
          {!executionState ? (
            <div className="no-execution">
              <p>Click "Run Locally" to execute the program.</p>
            </div>
          ) : (
            <div className="execution-results">
              {executionState.error && (
                <div className="execution-error">
                  <strong>Error:</strong> {executionState.error}
                </div>
              )}

              <div className="result-section">
                <h4>Registers</h4>
                <div className="registers">
                  {Object.entries(executionState.registers).map(([reg, value]) => (
                    <div key={reg} className="register-item">
                      <span className="register-name">{reg}:</span>
                      <span className="register-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="result-section">
                <h4>Output</h4>
                <div className="output-lines">
                  {executionState.output.length === 0 ? (
                    <div className="no-output">No output</div>
                  ) : (
                    executionState.output.map((line, idx) => (
                      <div key={idx} className="output-line">{line}</div>
                    ))
                  )}
                </div>
              </div>

              <div className="result-section">
                <h4>Execution Info</h4>
                <div className="execution-info">
                  <div className="info-item">
                    <span>Steps:</span>
                    <span>{executionState.steps}</span>
                  </div>
                  <div className="info-item">
                    <span>Final PC:</span>
                    <span>{executionState.pc}</span>
                  </div>
                  <div className="info-item">
                    <span>Status:</span>
                    <span className={executionState.error ? 'status-error' : 'status-success'}>
                      {executionState.error ? 'Error' : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShadowASM;
