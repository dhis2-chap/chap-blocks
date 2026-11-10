import { useId, type ChangeEvent } from 'react';
export type SearchFieldProps = { value: string; onChange: (value: string) => void; label?: string; placeholder?: string; disabled?: boolean };
/** A controlled search block: no router, API connection, or application provider. */
export function SearchField({ value, onChange, label = 'Search', placeholder, disabled }: SearchFieldProps) {
    const id = useId();
    return <label htmlFor={id} style={{ display: 'grid', gap: 6, fontSize: 14 }}><span>{label}</span>
        <input id={id} type="search" value={value} disabled={disabled} placeholder={placeholder} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} style={{ padding: '10px 12px', border: '1px solid #a0adba', borderRadius: 4, font: 'inherit' }} />
    </label>;
}
