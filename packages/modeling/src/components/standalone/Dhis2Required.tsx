import type { ReactNode } from 'react';
import { useConnection } from '@chap-blocks/runtime';
import { Link } from 'react-router-dom';
import { NoticeBox } from '@dhis2/ui';
export function Dhis2Required({ children }: { children: ReactNode }) {
    const { dhis2Url } = useConnection();
    if (!dhis2Url)
        return (
            <div style={{ padding: 24 }}>
                <NoticeBox title="Optional DHIS2 integration">
                    <p>
                        This feature exchanges data with DHIS2. Add your DHIS2
                        server in{' '}
                        <Link to="/settings">connection settings</Link> to use
                        it. Chap modeling works without this integration.
                    </p>
                </NoticeBox>
            </div>
        );
    return children;
}
