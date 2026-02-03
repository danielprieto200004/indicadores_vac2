"use client";

import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SelectFieldOption = {
  value: string;
  label: string;
};

export function SelectField({
  name,
  placeholder,
  options,
  defaultValue,
  required,
  disabled,
}: {
  name: string;
  placeholder: string;
  options: SelectFieldOption[];
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const initial = useMemo(() => defaultValue ?? "", [defaultValue]);
  const [value, setValue] = useState<string>(initial);
  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value]
  );

  return (
    <>
      {/* Radix Select no envía el valor en el submit; usamos un input oculto con el valor actual */}
      <input type="hidden" name={name} value={value} required={required} />
      <Select
        value={value}
        onValueChange={setValue}
        disabled={disabled}
      >
        <SelectTrigger title={selectedLabel || placeholder} className="text-left">
          <SelectValue
            placeholder={placeholder}
            className="flex-1 truncate text-left"
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

