import { debounce } from 'es-toolkit';
import { useRef, useMemo, useState, useEffect } from 'react';

import TextField, { type TextFieldProps } from '@mui/material/TextField';

export interface FastTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (val: string) => void;
  debounceMs?: number;
}

export function FastTextField({
  value,
  onChange,
  debounceMs = 250,
  onBlur,
  ...other
}: FastTextFieldProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    setLocalValue(value || '');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setLocalValue(newText);
    debouncedOnChange(newText);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onBlur) {
      onBlur(e);
    }
    debouncedOnChange.cancel();
    onChangeRef.current(localValue);
  };

  return <TextField {...other} value={localValue} onChange={handleChange} onBlur={handleBlur} />;
}
