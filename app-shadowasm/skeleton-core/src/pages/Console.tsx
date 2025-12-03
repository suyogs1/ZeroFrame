// Command Console - Terminal-like interface for Zeroframe OS
// Demonstrates kernel metrics and process visibility through console commands

import React, { useState, useRef, useEffect } from 'react';
import { useOsAppApi } from '../core/useOsAppApi';
import { useZeroframe } from '../core/ZeroframeContext';
import '../styles/Console.css';

interface CommandOutput {
  id: string;
  command: string;
  output: string[];
  timestamp: string;
}

export default function Console() {
  const api = useOsAppApi('console');
  const { kernel, triggerKernelPanic } = useZeroframe();
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [input, setInput] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.logAppAudit({
      action: 'CONSOLE_OPENED',
      resourceType: 'SYSTEM_APP',
      details: 'Command Console accessed',
    });
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output: string[] = [];

    try {
      switch (command) {
        case 'help':
          output = [
            'Available commands:',
            '  help              - Show this help message',
            '  uptime            - Show kernel uptime and last syscall',
            '  syscalls          - Show syscall statistics',
            '  ps [jobs|services] - List processes',
            '  jobs              - List all jobs',
            '  ls [path]         - List VFS directory contents',
            '  cat <path>        - Read VFS file or device',
            '  panic             - Trigger kernel panic (for demo)',
            '  run demo          - Execute end-to-end demo scenario',
            '  clear             - Clear console',
          ];
          break;

        case 'uptime': {
          const bootTime = new Date(kernel.metrics.bootTime);
          const now = new Date();
          const uptimeMs = now.getTime() - bootTime.getTime();
          const seconds = Math.floor(uptimeMs / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          const uptimeStr = days > 0
            ? `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`
            : hours > 0
            ? `${hours}h ${minutes % 60}m ${seconds % 60}s`
            : minutes > 0
            ? `${minutes}m ${seconds % 60}s`
            : `${seconds}s`;

          output = [
            `Zeroframe OS uptime: ${uptimeStr}`,
            `Boot time: ${kernel.metrics.bootTime}`,
            `Last syscall: ${kernel.metrics.lastSyscallTime ?? 'N/A'}`,
          ];
          break;
        }

        case 'syscalls': {
          output = [
            `Total syscalls: ${kernel.metrics.totalSyscalls}`,
            '',
            'Syscall breakdown:',
          ];
          const entries = Object.entries(kernel.metrics.syscallsByName).sort((a, b) => b[1] - a[1]);
          if (entries.length === 0) {
            output.push('  (no syscalls recorded yet)');
          } else {
            entries.forEach(([name, count]) => {
              output.push(`  ${name.padEnd(25)} ${count}`);
            });
          }
          break;
        }

        case 'ps': {
          const filter = args[0]?.toLowerCase();
          const processes = api.listProcesses?.() || [];
          
          let filtered = processes;
          if (filter === 'jobs') {
            filtered = processes.filter(p => p.type === 'JOB');
          } else if (filter === 'services') {
            filtered = processes.filter(p => p.type === 'SERVICE');
          }

          output = [
            'PID                TYPE     STATUS    CPU%  MEM   NAME',
            '─'.repeat(70),
          ];

          filtered.forEach(p => {
            const pid = p.pid.padEnd(18);
            const type = p.type.padEnd(8);
            const status = p.status.padEnd(9);
            const cpu = `${p.cpuUsage}%`.padEnd(5);
            const mem = `${p.memUsage}`.padEnd(5);
            output.push(`${pid} ${type} ${status} ${cpu} ${mem} ${p.name}`);
          });

          if (filtered.length === 0) {
            output.push('(no processes found)');
          }
          break;
        }

        case 'jobs': {
          const jobs = api.jobs;
          output = [
            'JOB ID              NAME                     STATUS      WORKSPACE',
            '─'.repeat(70),
          ];
          jobs.forEach(j => {
            const id = j.id.substring(0, 18).padEnd(20);
            const name = j.name.substring(0, 24).padEnd(25);
            const status = j.status.padEnd(11);
            output.push(`${id} ${name} ${status} ${j.workspace}`);
          });
          if (jobs.length === 0) {
            output.push('(no jobs)');
          }
          break;
        }

        case 'ls': {
          const path = args[0] || '/';
          const result = kernel.dispatcher.invoke('console', 'vfs.list', path);
          
          if (!result.ok) {
            output = [`Error: ${result.error.message}`];
            break;
          }

          const node = result.value as any;
          if (!node) {
            output = [`ls: ${path}: No such file or directory`];
            break;
          }

          if (node.type === 'DIR') {
            output = [`Contents of ${path}:`, ''];
            if (node.children && node.children.length > 0) {
              node.children.forEach((child: string) => {
                output.push(`  ${child}`);
              });
            } else {
              output.push('  (empty directory)');
            }
          } else {
            output = [`${path} (${node.type})`];
          }
          break;
        }

        case 'cat': {
          if (args.length === 0) {
            output = ['cat: missing file operand', 'Usage: cat <path>'];
            break;
          }

          const path = args[0];
          const result = kernel.dispatcher.invoke('console', 'vfs.readFile', path);
          
          if (!result.ok) {
            output = [`Error: ${result.error.message}`];
            break;
          }

          const content = result.value as string | null;
          if (content === null) {
            output = [`cat: ${path}: No such file or directory`];
          } else if (content === '') {
            output = ['(empty)'];
          } else {
            output = content.split('\n');
          }
          break;
        }

        case 'panic': {
          output = [
            'Triggering kernel panic...',
            'WARNING: This will halt the system!',
          ];
          
          api.logAppAudit({
            action: 'CONSOLE_PANIC_TRIGGERED',
            resourceType: 'SYSTEM_APP',
            details: 'Kernel panic triggered from console',
          });

          // Trigger panic after showing message
          setTimeout(() => {
            triggerKernelPanic('Panic command from console');
          }, 1000);
          break;
        }

        case 'run': {
          if (args[0] === 'demo') {
            output = [
              '🎃 Starting Zeroframe OS demo...',
              '',
              'Step 1: Submitting demo batch job...',
            ];

            // Submit demo job
            api.submitJob?.({
              name: 'demo-batch-job',
              type: 'BATCH',
              description: 'Demo job submitted via console run demo',
              priority: 'HIGH',
              tags: ['demo'],
              scriptSummary: 'Demo job for Kiroween',
            });

            output.push('✓ Job submitted');
            output.push('');
            output.push('Step 2: Running worker ticks...');

            // Run worker ticks
            setTimeout(() => {
              api.runWorkerTick?.();
            }, 500);

            setTimeout(() => {
              api.runWorkerTick?.();
            }, 2500);

            output.push('✓ Worker processing jobs');
            output.push('');
            output.push('Step 3: Submitting ShadowASM simulation...');

            // Submit simulation job
            setTimeout(() => {
              api.submitJob?.({
                name: 'shadowasm-demo-sim',
                type: 'SIMULATION',
                description: 'ShadowASM demo simulation',
                priority: 'NORMAL',
                tags: ['shadowasm', 'demo'],
                scriptSummary: 'LOAD R1, 42\nSTORE R1, result',
              });
            }, 1000);

            output.push('✓ Simulation submitted');
            output.push('');
            output.push('Step 4: Sending IPC message...');

            // Send IPC message
            if (api.sendMessage) {
              api.sendMessage('ghost-abend', 'DEMO_EVENT', { 
                info: 'Demo orchestration from console',
                timestamp: new Date().toISOString(),
              });
              output.push('✓ Message sent to Ghost ABEND');
            }

            output.push('');
            output.push('✅ Demo complete!');
            output.push('');
            output.push('Check these screens:');
            output.push('  • Dashboard - System overview');
            output.push('  • Job Center - View submitted jobs');
            output.push('  • Ghost ABEND - Analyze failures');
            output.push('  • Audit Explorer - Review all actions');

            api.logAppAudit({
              action: 'CONSOLE_RUN_DEMO',
              resourceType: 'SYSTEM_APP',
              details: 'Demo scenario executed from console',
            });
          } else {
            output = [`run: unknown scenario '${args[0]}'`, 'Available: run demo'];
          }
          break;
        }

        case 'clear':
          setHistory([]);
          setInput('');
          return;

        default:
          output = [`Unknown command: ${command}`, 'Type "help" for available commands'];
      }

      api.logAppAudit({
        action: 'COMMAND_EXECUTED',
        resourceType: 'SYSTEM_APP',
        details: `Executed command: ${trimmed}`,
      });
    } catch (error) {
      output = [`Error: ${error instanceof Error ? error.message : String(error)}`];
    }

    const result: CommandOutput = {
      id: `cmd-${Date.now()}`,
      command: trimmed,
      output,
      timestamp: new Date().toISOString(),
    };

    setHistory(prev => [...prev, result]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    }
  };

  return (
    <div className="console-page">
      <div className="console-header">
        <h1>🖥️ Command Console</h1>
        <p>Terminal interface for Zeroframe OS kernel</p>
      </div>

      <div className="console-terminal">
        <div className="console-output" ref={outputRef}>
          <div className="console-welcome">
            <p>Zeroframe OS Command Console</p>
            <p>Type "help" for available commands</p>
            <p></p>
          </div>

          {history.map(entry => (
            <div key={entry.id} className="console-entry">
              <div className="console-prompt">
                <span className="console-user">{api.activeUser.name}@zeroframe</span>
                <span className="console-separator">:</span>
                <span className="console-workspace">{api.activeWorkspace}</span>
                <span className="console-dollar">$</span>
                <span className="console-command">{entry.command}</span>
              </div>
              <div className="console-result">
                {entry.output.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="console-input-line">
          <span className="console-user">{api.activeUser.name}@zeroframe</span>
          <span className="console-separator">:</span>
          <span className="console-workspace">{api.activeWorkspace}</span>
          <span className="console-dollar">$</span>
          <input
            type="text"
            className="console-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
