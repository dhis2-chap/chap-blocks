import { Component, useState, type ErrorInfo, type ReactNode } from 'react';

export type PropRow = {
    name: string;
    type: string;
    required?: boolean;
    description: string;
};

export type BlockEntry = {
    id: string;
    title: string;
};

async function copyText(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Clipboard API can be blocked (insecure origin, permissions); fall back to a selection copy.
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand('copy');
        area.remove();
        return copied;
    }
}

export function CodeBlock({ code, label = 'Usage' }: { code: string; label?: string }) {
    const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
    const onCopy = async () => {
        setState((await copyText(code)) ? 'copied' : 'failed');
        window.setTimeout(() => setState('idle'), 1600);
    };
    return (
        <figure className="code">
            <figcaption>
                <span>{label}</span>
                <button type="button" onClick={onCopy} aria-live="polite">
                    {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}
                </button>
            </figcaption>
            <pre><code>{code}</code></pre>
        </figure>
    );
}

export function PropsTable({ rows }: { rows: PropRow[] }) {
    return (
        <div className="props-wrap">
            <table className="props">
                <thead>
                    <tr>
                        <th scope="col">Prop</th>
                        <th scope="col">Type</th>
                        <th scope="col">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={row.name}>
                            <td>
                                <code>{row.name}</code>
                                {row.required && <span className="req" title="Required">required</span>}
                            </td>
                            <td><code className="type">{row.type}</code></td>
                            <td>{row.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

type BoundaryProps = { children: ReactNode; fallback: (error: Error) => ReactNode };

/** Keeps one failing example from taking the whole gallery down. */
export class ExampleBoundary extends Component<BoundaryProps, { error: Error | null }> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.warn('Gallery example failed', error, info.componentStack);
    }
    render() {
        return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
    }
}

export function Section({
    id,
    title,
    importFrom,
    exports,
    children,
    description,
    props,
    code,
    note,
    wide,
}: {
    id: string;
    title: string;
    importFrom: string;
    exports: string[];
    description: ReactNode;
    children: ReactNode;
    props?: PropRow[];
    code: string;
    note?: ReactNode;
    wide?: boolean;
}) {
    return (
        <section id={id} className="block" aria-labelledby={`${id}-title`}>
            <header className="block-head">
                <h3 id={`${id}-title`}>
                    <a href={`#${id}`} className="anchor" aria-label={`Link to ${title}`}>#</a>
                    {title}
                </h3>
                <p className="import-path">
                    <code>{`import { ${exports.join(', ')} } from '${importFrom}'`}</code>
                </p>
            </header>
            <div className="block-description">{description}</div>
            <div className={wide ? 'example example-wide' : 'example'}>
                <ExampleBoundary
                    fallback={error => (
                        <p className="example-error" role="alert">
                            This example could not render here: {error.message}
                        </p>
                    )}
                >
                    {children}
                </ExampleBoundary>
            </div>
            {note && <div className="block-note">{note}</div>}
            {props && props.length > 0 && (
                <details className="props-details" open>
                    <summary>Props</summary>
                    <PropsTable rows={props} />
                </details>
            )}
            <CodeBlock code={code} />
        </section>
    );
}

export function Group({ id, title, intro, children }: { id: string; title: string; intro: ReactNode; children: ReactNode }) {
    return (
        <div className="group" id={id}>
            <h2 className="group-title">{title}</h2>
            <p className="group-intro">{intro}</p>
            {children}
        </div>
    );
}
