'use client';

import { useRef, useState, useCallback } from 'react';

import Button from '@mui/material/Button';

import { ConfirmDialog } from './confirm-dialog';

// ----------------------------------------------------------------------

type ConfirmColor = 'inherit' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';

type ConfirmOptions = {
  title?: React.ReactNode;
  content: React.ReactNode;
  confirmLabel?: string;
  confirmColor?: ConfirmColor;
};

type ConfirmState = ConfirmOptions & { open: boolean };

/**
 * Promise-based replacement for `window.confirm` — `await confirm(...)` resolves to whether
 * the user confirmed, backed by the app's MUI `ConfirmDialog` instead of the native browser
 * dialog. Render the returned `dialog` once, anywhere in the component's JSX.
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    resolveRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  const handleResolve = useCallback((result: boolean) => {
    setState((prev) => (prev ? { ...prev, open: false } : prev));
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const dialog = (
    <ConfirmDialog
      open={!!state?.open}
      onClose={() => handleResolve(false)}
      title={state?.title ?? 'ยืนยันการทำรายการ'}
      content={state?.content}
      action={
        <Button
          variant="contained"
          color={state?.confirmColor ?? 'error'}
          onClick={() => handleResolve(true)}
        >
          {state?.confirmLabel ?? 'ยืนยัน'}
        </Button>
      }
    />
  );

  return { confirm, dialog };
}
