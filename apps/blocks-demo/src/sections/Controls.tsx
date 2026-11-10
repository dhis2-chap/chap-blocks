import { useState } from 'react';
import { PeriodPicker, PeriodRangeField, Tag } from '@chap-blocks/ui/layout';
import { SearchField } from '@chap-blocks/ui/search';
import {
    Sidenav,
    SidenavButton,
    SidenavDivider,
    SidenavFooter,
    SidenavHeader,
    SidenavItems,
    SidenavLink,
    SidenavParent,
    SidenavSectionTitle,
} from '@chap-blocks/ui';
import { compareFixedPeriods, createFixedPeriodFromPeriodId, type Dhis2FixedPeriod } from '@chap-blocks/core';
import { Group, Section } from '../gallery/Section';
import { MODEL_NAMES } from '../data/synthetic';

const pickerCode = `import { PeriodPicker } from '@chap-blocks/ui/layout';

const [period, setPeriod] = useState<string | null>('202503');

<PeriodPicker
  value={period}
  periodType="MONTHLY"          // or WEEKLY, …
  calendar="gregory"            // DHIS2 calendars, e.g. 'ethiopian', 'nepali'
  minPeriodId="202301"
  maxPeriodId="202612"
  onChange={p => setPeriod(p.id)}
/>`;

const rangeCode = `import { PeriodRangeField } from '@chap-blocks/ui/layout';
import { compareFixedPeriods } from '@chap-blocks/core';

<PeriodRangeField
  periodType="WEEKLY"
  calendar="gregory"
  fromValue={from}
  toValue={to}
  toError={invalid ? 'End must be after start' : undefined}
  onFromChange={p => setFrom(p.id)}
  onToChange={p => setTo(p.id)}
/>`;

const searchCode = `import { SearchField } from '@chap-blocks/ui/search';

const [search, setSearch] = useState('');

<SearchField
  label="Search models"
  placeholder="e.g. ARIMA"
  value={search}
  onChange={setSearch}
/>

// Only React is required: copy packages/ui/src/search.tsx on its own if you like.`;

const sidenavCode = `import {
  Sidenav, SidenavHeader, SidenavItems, SidenavSectionTitle,
  SidenavLink, SidenavParent, SidenavButton, SidenavDivider, SidenavFooter,
} from '@chap-blocks/ui';
import { NavLink } from 'react-router-dom';

<Sidenav>
  <SidenavHeader>Chap</SidenavHeader>
  <SidenavItems>
    <SidenavLink to="/datasets" label="Datasets" LinkComponent={NavLink} />
    <SidenavParent label="Evaluate" open={open} onClick={() => setOpen(o => !o)}>
      <SidenavLink to="/evaluations" label="Evaluations" />
    </SidenavParent>
    <SidenavButton label="Sign out" onClick={signOut} />
  </SidenavItems>
</Sidenav>`;

function PickerExample() {
    const [period, setPeriod] = useState<string | null>('202503');
    const [week, setWeek] = useState<string | null>(null);
    return (
        <div className="picker-grid">
            <div className="field">
                <span>Monthly, limited to 2023–2026</span>
                <PeriodPicker
                    value={period}
                    periodType="MONTHLY"
                    calendar="gregory"
                    minPeriodId="202301"
                    maxPeriodId="202612"
                    onChange={p => setPeriod(p.id)}
                />
                <small className="muted">Selected id: <code>{period ?? '—'}</code></small>
            </div>
            <div className="field">
                <span>Weekly</span>
                <PeriodPicker
                    value={week}
                    periodType="WEEKLY"
                    calendar="gregory"
                    referencePeriodId="2025W10"
                    placeholder="Pick a week"
                    onChange={p => setWeek(p.id)}
                />
                <small className="muted">Selected id: <code>{week ?? '—'}</code></small>
            </div>
        </div>
    );
}

function RangeExample() {
    const [from, setFrom] = useState<Dhis2FixedPeriod>(() => createFixedPeriodFromPeriodId({ periodId: '2025W01', calendar: 'gregory' }));
    const [to, setTo] = useState<Dhis2FixedPeriod>(() => createFixedPeriodFromPeriodId({ periodId: '2025W12', calendar: 'gregory' }));
    const invalid = compareFixedPeriods(from, to) > 0;
    return (
        <PeriodRangeField
            periodType="WEEKLY"
            calendar="gregory"
            fromValue={from.id}
            toValue={to.id}
            toError={invalid ? 'End must be after start' : undefined}
            onFromChange={setFrom}
            onToChange={setTo}
        />
    );
}

function SearchExample() {
    const [search, setSearch] = useState('');
    const matches = MODEL_NAMES.filter(name => name.toLowerCase().includes(search.trim().toLowerCase()));
    return (
        <div className="stack">
            <div className="narrow-field">
                <SearchField label="Search models" placeholder="e.g. ARIMA" value={search} onChange={setSearch} />
            </div>
            <div className="row-wrap" aria-live="polite">
                {matches.map(name => <Tag key={name} variant="info">{name}</Tag>)}
                {matches.length === 0 && <span className="muted">No models match “{search}”.</span>}
            </div>
        </div>
    );
}

function SidenavExample() {
    const [open, setOpen] = useState(true);
    const [active, setActive] = useState('#sidenav');
    const [clicks, setClicks] = useState(0);
    return (
        <div className="sidenav-host" onClickCapture={(event) => {
            const anchor = (event.target as HTMLElement).closest('a');
            if (anchor) {
                event.preventDefault();
                setActive(anchor.getAttribute('href') ?? '');
            }
        }}
        >
            <Sidenav>
                <SidenavHeader><span className="sidenav-demo-head">Chap</span></SidenavHeader>
                <SidenavItems>
                    <SidenavSectionTitle label="Data" />
                    <SidenavLink to="#sidenav" label="Datasets" active={active === '#sidenav'} />
                    <SidenavLink to="#sidenav-models" label="Models" active={active === '#sidenav-models'} />
                    <SidenavParent label="Evaluate" open={open} onClick={() => setOpen(o => !o)}>
                        <SidenavLink to="#sidenav-evaluations" label="Evaluations" active={active === '#sidenav-evaluations'} />
                        <SidenavLink to="#sidenav-compare" label="Compare" active={active === '#sidenav-compare'} />
                    </SidenavParent>
                    <SidenavDivider />
                    <SidenavButton label={`Button (clicked ${clicks}×)`} onClick={() => setClicks(n => n + 1)} />
                    <SidenavLink to="#sidenav-disabled" label="Disabled" disabled />
                </SidenavItems>
                <SidenavFooter><span className="sidenav-demo-foot">v0.1.0</span></SidenavFooter>
            </Sidenav>
        </div>
    );
}

export function ControlsGroup() {
    return (
        <Group
            id="controls"
            title="Periods, search and navigation"
            intro="Controlled inputs. Period ids are DHIS2 fixed-period ids and the pickers support DHIS2 calendars."
        >
            <Section
                id="period-picker"
                title="PeriodPicker"
                importFrom="@chap-blocks/ui/layout"
                exports={['PeriodPicker']}
                description={<p>A popover with year navigation and a month grid or week list. Out-of-range periods are disabled; Escape closes and returns focus.</p>}
                props={[
                    { name: 'value', type: 'string | null', description: 'Selected period id.' },
                    { name: 'periodType', type: 'Dhis2FixedPeriodType', required: true, description: "'MONTHLY', 'WEEKLY', 'WEEKLYWED', …" },
                    { name: 'calendar', type: 'Dhis2Calendar', required: true, description: "'gregory', 'ethiopian', 'nepali', …" },
                    { name: 'onChange', type: '(period: Dhis2FixedPeriod) => void', required: true, description: 'Receives the full period object (id, name, startDate…).' },
                    { name: 'minPeriodId / maxPeriodId', type: 'string', description: 'Inclusive bounds.' },
                    { name: 'isPeriodDisabled', type: '(period) => boolean', description: 'Extra per-period rule.' },
                    { name: 'referencePeriodId', type: 'string | null', description: 'Year to open on when value is empty.' },
                    { name: 'locale, placeholder, ariaLabel, disabled, dataTest', type: 'string / boolean', description: 'Presentation and testing.' },
                ]}
                code={pickerCode}
            >
                <PickerExample />
            </Section>

            <Section
                id="period-range-field"
                title="PeriodRangeField"
                importFrom="@chap-blocks/ui/layout"
                exports={['PeriodRangeField']}
                description={<p>Two labelled PeriodPickers with per-field error text. The "from" picker opens on the "to" year. Pick a start after the end to see the error.</p>}
                props={[
                    { name: 'periodType, calendar, locale', type: 'as PeriodPicker', required: true, description: 'Shared by both pickers.' },
                    { name: 'fromValue / toValue', type: 'string | null', description: 'Selected ids.' },
                    { name: 'onFromChange / onToChange', type: '(period) => void', required: true, description: 'Change handlers.' },
                    { name: 'fromError / toError', type: 'string', description: 'Validation text under each picker.' },
                    { name: 'fromLabel / toLabel', type: 'string', description: 'Default "From period" / "To period".' },
                    { name: 'minPeriodId, maxPeriodId, disabled, fromDataTest, toDataTest', type: '—', description: 'Forwarded.' },
                ]}
                code={rangeCode}
            >
                <RangeExample />
            </Section>

            <Section
                id="search-field"
                title="SearchField"
                importFrom="@chap-blocks/ui/search"
                exports={['SearchField']}
                description={<p>A controlled search input with a label. No provider, router or DHIS2 styles — the smallest block to copy.</p>}
                props={[
                    { name: 'value', type: 'string', required: true, description: 'Current text.' },
                    { name: 'onChange', type: '(value: string) => void', required: true, description: 'Called with the new text.' },
                    { name: 'label', type: 'string', description: 'Default "Search".' },
                    { name: 'placeholder', type: 'string', description: 'Input placeholder.' },
                    { name: 'disabled', type: 'boolean', description: 'Disable the input.' },
                ]}
                code={searchCode}
            >
                <SearchExample />
            </Section>

            <Section
                id="sidenav"
                title="Sidenav"
                importFrom="@chap-blocks/ui"
                exports={['Sidenav', 'SidenavItems', 'SidenavLink', 'SidenavParent', '…']}
                description={<p>The dark DHIS2 side navigation. Links render plain anchors, or your router's link via <code>LinkComponent</code>. Links in this example are intercepted to show the active state.</p>}
                props={[
                    { name: 'SidenavLink', type: '{ to, label, icon?, active?, disabled?, end?, LinkComponent? }', description: 'Pass NavLink as LinkComponent to use router active state.' },
                    { name: 'SidenavParent', type: '{ label, open, onClick?, icon?, disabled? }', description: 'Collapsible group; children are links.' },
                    { name: 'SidenavButton', type: '{ label, onClick, icon?, disabled?, dataTest? }', description: 'Action item styled like a link.' },
                    { name: 'SidenavSectionTitle', type: '{ label }', description: 'Small group heading.' },
                    { name: 'Sidenav / Header / Items / Footer / Divider', type: 'children', description: 'Structure; Sidenav takes className.' },
                ]}
                code={sidenavCode}
            >
                <SidenavExample />
            </Section>
        </Group>
    );
}
