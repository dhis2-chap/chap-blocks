import { useEffect, useRef, type FocusEvent } from 'react';

type Position = { element: Element; top: number; left: number };

// Long enough to outlast a smooth scroll; a user scroll ends the hold at once.
const HOLD_MS = 500;
const USER_SCROLL_EVENTS = ['wheel', 'touchmove', 'keydown'] as const;

const scrollContainers = (from: Element): Element[] => {
    const containers: Element[] = [];
    for (let element = from.parentElement; element; element = element.parentElement) {
        if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) containers.push(element);
    }
    if (document.scrollingElement && !containers.includes(document.scrollingElement)) containers.push(document.scrollingElement);
    return containers;
};

/**
 * A filterable @dhis2/ui select focuses its filter input before its popover is positioned, so the browser scrolls the
 * page (or the app's scroll container) towards the top, smoothly when the page asks for smooth scrolling. Spread the
 * returned handlers on an element around the fields. They remember the scroll positions when a field is pressed and,
 * once focus moves into its popover (which React reports here although the popover is rendered elsewhere), hold them
 * for a moment, cancelling that scroll.
 */
export const useKeepScrollOnOpen = () => {
    const saved = useRef<Position[]>([]);
    const release = useRef<(() => void) | undefined>(undefined);
    useEffect(() => () => release.current?.(), []);

    const save = (event: { currentTarget: Element }) => {
        saved.current = scrollContainers(event.currentTarget)
            .map(element => ({ element, top: element.scrollTop, left: element.scrollLeft }));
    };

    const hold = (positions: Position[]) => {
        release.current?.();
        const restore = () => positions.forEach(({ element, top, left }) => {
            if (element.scrollTop !== top || element.scrollLeft !== left) element.scrollTo({ top, left, behavior: 'instant' });
        });
        const stop = () => {
            window.clearTimeout(timer);
            document.removeEventListener('scroll', restore, true);
            USER_SCROLL_EVENTS.forEach(type => window.removeEventListener(type, stop, true));
            release.current = undefined;
        };
        const timer = window.setTimeout(stop, HOLD_MS);
        document.addEventListener('scroll', restore, true);
        USER_SCROLL_EVENTS.forEach(type => window.addEventListener(type, stop, true));
        release.current = stop;
        restore();
    };

    return {
        onPointerDownCapture: save,
        onKeyDownCapture: save,
        onFocusCapture: (event: FocusEvent) => {
            // Focus inside the form itself never needs help; only focus that left it for a popover does.
            if (event.currentTarget.contains(event.target as Node) || !saved.current.length) return;
            // Once per press, so later focus in an open popover never pulls back a page the user has scrolled.
            hold(saved.current);
            saved.current = [];
        },
    };
};
