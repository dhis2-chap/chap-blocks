import { useState } from 'react';
import {
    Card,
    OverflowButton,
    Pill,
    Ping,
    StatusIndicator,
    Tag,
    Widget,
    type PillVariant,
} from '@chap-blocks/ui/layout';
import { ConditionalTooltip, VirtuosoGrid } from '@chap-blocks/ui';
import { Button, FlyoutMenu, IconMore24, MenuItem, Switch } from '@dhis2/ui';
import { Group, Section } from '../gallery/Section';
import { MODEL_NAMES } from '../data/synthetic';

const VARIANTS: PillVariant[] = ['default', 'info', 'success', 'warning', 'destructive'];

const cardCode = `import { Card } from '@chap-blocks/ui/layout';

<Card className="my-card">
  <h4>Climate ARIMA</h4>
  <p>Monthly model with rainfall and temperature lags.</p>
</Card>`;

const widgetCode = `import { Widget } from '@chap-blocks/ui/layout';

const [open, setOpen] = useState(true);

<Widget
  header={<h4>Model configuration</h4>}
  open={open}
  onOpen={() => setOpen(true)}
  onClose={() => setOpen(false)}
>
  …content
</Widget>

<Widget noncollapsible header={<h4>Summary</h4>}>…</Widget>`;

const statusCode = `import { Pill, Tag, Ping, StatusIndicator } from '@chap-blocks/ui/layout';

<Pill variant="info">Monthly</Pill>
<Tag variant="success" onRemove={() => remove('rainfall')}>rainfall</Tag>
<Ping variant="warning" active />
<StatusIndicator label="Running" variant="info" active />`;

const overflowCode = `import { OverflowButton } from '@chap-blocks/ui/layout';
import { FlyoutMenu, MenuItem, IconMore24 } from '@dhis2/ui';

<OverflowButton
  small
  icon={<IconMore24 />}
  component={
    <FlyoutMenu dense>
      <MenuItem label="Rename" onClick={rename} />
      <MenuItem label="Delete" destructive onClick={remove} />
    </FlyoutMenu>
  }
/>`;

const tooltipCode = `import { ConditionalTooltip } from '@chap-blocks/ui';

<ConditionalTooltip enabled={disabled} content="Select a dataset first">
  <Button disabled={disabled}>Run evaluation</Button>
</ConditionalTooltip>`;

const gridCode = `import { VirtuosoGrid } from '@chap-blocks/ui';   // re-export of react-virtuoso

<VirtuosoGrid
  style={{ height: 260 }}
  totalCount={models.length}
  listClassName="grid"            // your CSS grid
  itemContent={index => <Card>{models[index].name}</Card>}
/>`;

function WidgetExample() {
    const [open, setOpen] = useState(true);
    return (
        <div className="stack">
            <Widget
                header={<h4 className="widget-title">Model configuration</h4>}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <dl className="facts">
                    <dt>Model</dt><dd>Climate ARIMA</dd>
                    <dt>Covariates</dt><dd>rainfall, mean_temperature</dd>
                    <dt>Horizon</dt><dd>3 months</dd>
                </dl>
            </Widget>
            <Widget noncollapsible header={<h4 className="widget-title">Non-collapsible</h4>}>
                <p className="widget-body">Always open; same header and border treatment.</p>
            </Widget>
        </div>
    );
}

function StatusExample() {
    const [tags, setTags] = useState(['rainfall', 'mean_temperature', 'population', 'humidity']);
    return (
        <div className="stack">
            <div className="row-wrap" aria-label="Pills">
                {VARIANTS.map(variant => <Pill key={variant} variant={variant}>{variant}</Pill>)}
            </div>
            <div className="row-wrap" aria-label="Tags">
                {tags.map((tag, index) => (
                    <Tag key={tag} variant={VARIANTS[(index + 1) % VARIANTS.length]} onRemove={() => setTags(t => t.filter(x => x !== tag))}>
                        {tag}
                    </Tag>
                ))}
                {tags.length === 0 && (
                    <button type="button" className="chip" onClick={() => setTags(['rainfall', 'mean_temperature', 'population', 'humidity'])}>
                        Restore tags
                    </button>
                )}
            </div>
            <div className="row-wrap" aria-label="Pings">
                {VARIANTS.map(variant => (
                    <span key={variant} className="ping-sample"><Ping variant={variant} active /> {variant}</span>
                ))}
            </div>
            <div className="row-wrap" aria-label="Status indicators">
                <StatusIndicator label="Running" variant="info" active />
                <StatusIndicator label="Completed" variant="success" />
                <StatusIndicator label="Queued" variant="default" />
                <StatusIndicator label="Needs review" variant="warning" />
                <StatusIndicator label="Failed" variant="destructive" />
            </div>
        </div>
    );
}

function OverflowExample() {
    const [last, setLast] = useState<string>('nothing yet');
    return (
        <div className="row-wrap">
            <OverflowButton
                small
                secondary
                icon={<IconMore24 />}
                component={
                    <FlyoutMenu dense>
                        <MenuItem label="Rename" onClick={() => setLast('Rename')} />
                        <MenuItem label="Duplicate" onClick={() => setLast('Duplicate')} />
                        <MenuItem label="Delete" destructive onClick={() => setLast('Delete')} />
                    </FlyoutMenu>
                }
            />
            <OverflowButton
                small
                label="Actions"
                component={
                    <FlyoutMenu dense>
                        <MenuItem label="Export CSV" onClick={() => setLast('Export CSV')} />
                        <MenuItem label="Open logs" onClick={() => setLast('Open logs')} />
                    </FlyoutMenu>
                }
            />
            <span className="muted">Last menu choice: {last}</span>
        </div>
    );
}

function TooltipExample() {
    const [disabled, setDisabled] = useState(true);
    return (
        <div className="row-wrap">
            <Switch checked={disabled} label="Disable the button" onChange={({ checked }) => setDisabled(checked)} />
            <ConditionalTooltip enabled={disabled} content="Select a dataset first">
                <Button primary disabled={disabled}>Run evaluation</Button>
            </ConditionalTooltip>
        </div>
    );
}

export function LayoutGroup() {
    return (
        <Group
            id="layout"
            title="Cards, widgets and status"
            intro="Small DHIS2-styled components. They read DHIS2 CSS variables, so mount CssVariables from @dhis2/ui once in the host."
        >
            <Section
                id="card"
                title="Card"
                importFrom="@chap-blocks/ui/layout"
                exports={['Card']}
                description={<p>A white, bordered surface. Add your own class for layout.</p>}
                props={[
                    { name: 'children', type: 'ReactNode', required: true, description: 'Card content.' },
                    { name: 'className', type: 'string', description: 'Merged with the card class.' },
                ]}
                code={cardCode}
            >
                <div className="card-grid">
                    {MODEL_NAMES.slice(0, 3).map((name, index) => (
                        <Card key={name} className="demo-card">
                            <h4>{name}</h4>
                            <p className="muted">{['Baseline using last season.', 'Rainfall and temperature lags.', 'Early warning, weekly.'][index]}</p>
                            <Pill variant={(['default', 'info', 'success'] as const)[index]}>{['Baseline', 'Climate', 'Weekly'][index]}</Pill>
                        </Card>
                    ))}
                </div>
            </Section>

            <Section
                id="widget"
                title="Widget"
                importFrom="@chap-blocks/ui/layout"
                exports={['Widget']}
                description={<p>A titled panel, collapsible (controlled open state) or fixed.</p>}
                props={[
                    { name: 'header', type: 'ReactNode', description: 'Header content.' },
                    { name: 'children', type: 'ReactNode', required: true, description: 'Body content.' },
                    { name: 'open / onOpen / onClose', type: 'boolean / () => void', required: true, description: 'Collapsible only: controlled open state.' },
                    { name: 'noncollapsible', type: 'true', description: 'Render a fixed panel; open/onOpen/onClose are then not used.' },
                    { name: 'color', type: 'string', description: 'Background colour (default white).' },
                    { name: 'borderless', type: 'boolean', description: 'Remove the border.' },
                ]}
                code={widgetCode}
            >
                <WidgetExample />
            </Section>

            <Section
                id="status"
                title="Pill, Tag, Ping and StatusIndicator"
                importFrom="@chap-blocks/ui/layout"
                exports={['Pill', 'Tag', 'Ping', 'StatusIndicator']}
                description={<p>Status vocabulary in five variants. Tags can be removed; Ping pulses when active; StatusIndicator combines a Pill and a Ping.</p>}
                props={[
                    { name: 'variant', type: "'default' | 'info' | 'success' | 'warning' | 'destructive'", description: 'All four components.' },
                    { name: 'children', type: 'ReactNode', description: 'Pill and Tag content.' },
                    { name: 'onRemove', type: '() => void', description: 'Tag: shows a remove button.' },
                    { name: 'className', type: 'string', description: 'Tag only.' },
                    { name: 'active', type: 'boolean', description: 'Ping and StatusIndicator: animate the dot.' },
                    { name: 'label', type: 'string', required: true, description: 'StatusIndicator text.' },
                ]}
                code={statusCode}
            >
                <StatusExample />
            </Section>

            <Section
                id="overflow-button"
                title="OverflowButton"
                importFrom="@chap-blocks/ui/layout"
                exports={['OverflowButton']}
                description={<p>A DHIS2 button that opens any content in a popper, usually a FlyoutMenu. Uncontrolled by default; pass <code>open</code> to control it.</p>}
                props={[
                    { name: 'component', type: 'ReactNode', required: true, description: 'OverflowButton: the popover content.' },
                    { name: 'label / icon', type: 'string / ReactElement', description: 'Button text and icon. Without a label the title is "More".' },
                    { name: 'open / onClick', type: 'boolean / () => void', description: 'Make the popover controlled.' },
                    { name: 'primary, secondary, small, large, disabled, dataTest', type: 'boolean / string', description: 'Forwarded to the DHIS2 Button.' },
                ]}
                code={overflowCode}
            >
                <OverflowExample />
            </Section>

            <Section
                id="conditional-tooltip"
                title="ConditionalTooltip"
                importFrom="@chap-blocks/ui"
                exports={['ConditionalTooltip']}
                description={<p>Wraps a child in a DHIS2 Tooltip only when enabled — handy for explaining disabled buttons. Hover the button.</p>}
                props={[
                    { name: 'enabled', type: 'boolean', required: true, description: 'Render the tooltip, or just the children.' },
                    { name: 'children', type: 'ReactNode', required: true, description: 'The element to explain.' },
                    { name: 'wrapperClassName', type: 'string', description: 'Class for the span wrapper.' },
                    { name: '…TooltipProps', type: '@dhis2/ui', description: 'content, placement, openDelay…' },
                ]}
                code={tooltipCode}
            >
                <TooltipExample />
            </Section>

            <Section
                id="virtuoso-grid"
                title="VirtuosoGrid"
                importFrom="@chap-blocks/ui"
                exports={['VirtuosoGrid']}
                description={<p>Re-exported from react-virtuoso so consumers render large card grids without adding the dependency. 400 cards below; only the visible ones are in the DOM.</p>}
                code={gridCode}
            >
                <VirtuosoGrid
                    style={{ height: 260 }}
                    totalCount={400}
                    listClassName="virtuoso-list"
                    itemContent={index => (
                        <Card className="virtuoso-card">
                            <strong>{MODEL_NAMES[index % MODEL_NAMES.length]}</strong>
                            <span className="muted">Run #{index + 1}</span>
                        </Card>
                    )}
                />
            </Section>
        </Group>
    );
}
