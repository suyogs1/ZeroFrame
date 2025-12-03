// Zeroframe OS Kernel Error Utilities
// Factory functions for creating structured kernel errors

import type { KernelError, KernelErrorCode, SyscallName } from './types';

export function makeKernelError(params: {
  code: KernelErrorCode;
  message: string;
  syscall?: SyscallName;
  appId?: string;
  details?: unknown;
}): KernelError {
  return {
    code: params.code,
    message: params.message,
    syscall: params.syscall,
    appId: params.appId,
    details: params.details,
  };
}
