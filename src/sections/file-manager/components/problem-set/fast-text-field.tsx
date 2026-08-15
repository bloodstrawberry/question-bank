import { debounce } from 'es-toolkit';
import { memo, useRef, useMemo, useState, useEffect, useCallback } from 'react';

import TextField, { type TextFieldProps } from '@mui/material/TextField';

import { focusNextInput } from './focus-utils';

export interface FastTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  debounceMs?: number;
}

export const FastTextField = memo(function FastTextField({
  value,
  onChange,
  debounceMs = 250,
  onBlur,
  onFocus,
  onKeyDown,
  ...other
}: FastTextFieldProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isFocusedRef = useRef(false);
  const localValueRef = useRef(localValue);
  localValueRef.current = localValue;

  // Synchronize prop value when not actively focused or if value externally changed
  useEffect(() => {
    if (!isFocusedRef.current && (value || '') !== localValueRef.current) {
      setLocalValue(value || '');
    }
  }, [value]);

  const debouncedOnChange = useMemo(
    () =>
      debounce((val: string) => {
        onChangeRef.current(val);
      }, debounceMs),
    [debounceMs]
  );

  useEffect(
    () => () => {
      debouncedOnChange.cancel();
    },
    [debouncedOnChange]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      isFocusedRef.current = true;
      if (onFocus) {
        onFocus(e);
      }
    },
    [onFocus]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setLocalValue(newText);
      debouncedOnChange(newText);
    },
    [debouncedOnChange]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      isFocusedRef.current = false;
      debouncedOnChange.cancel();
      onChangeRef.current(localValueRef.current);
      if (onBlur) {
        onBlur(e);
      }
    },
    [debouncedOnChange, onBlur]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Tab') {
        const handled = focusNextInput(e.currentTarget as HTMLElement, e.shiftKey);
        if (handled) {
          e.preventDefault();
        }
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    },
    [onKeyDown]
  );

  return (
    <TextField
      {...other}
      value={localValue}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
});
