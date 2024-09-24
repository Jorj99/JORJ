import { useCallback, useEffect, useMemo, useState } from 'react';
import useLatest from '../useLatest';
import { useIsomorphicLayoutEffect } from '../customEffects';

type Key = string | number;

interface UseFixedSizesListProps {
    rowsCount: number;
    rowHeight?: (index: number) => number;
    estimateRowHeight?: (index: number) => number;
    getRowKey: (index: number) => string;
    overscanY?: number;
    scrollingDelay?: number;
    getScrollElement: () => HTMLElement | null;
}

interface useVirtualizationProps {
    key: Key;
    index: number;
    offsetTop: number;
    height: number;
}

const DEFAULT_OVERSCAN_Y = 3;
const DEFAULT_SCROLLING_DELAY = 300;

const validateProps = (props: UseFixedSizesListProps) => {
    const { estimateRowHeight, rowHeight } = props;

    if (!estimateRowHeight && !rowHeight) {
        throw new Error('Either estimateHeight or rowHeight must be provided');
    }
};

const useVirtualization = (props: UseFixedSizesListProps) => {
    validateProps(props);

    const {
        rowsCount,
        rowHeight,
        estimateRowHeight,
        getRowKey,
        overscanY = DEFAULT_OVERSCAN_Y,
        scrollingDelay = DEFAULT_SCROLLING_DELAY,
        getScrollElement,
    } = props;

    const [measurementCache, setMeasurementCache] = useState<Record<Key, number>>({});
    const [listHeight, setListHeight] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);

    // ******************************
    // *** OBSERVE CONTAINER SIZE ***
    // ******************************
    useIsomorphicLayoutEffect(() => {
        const scrollElement = getScrollElement();

        if (!scrollElement) return;

        const resizeObserver = new ResizeObserver(([entry]) => {
            if (!entry) return;
            const height =
                entry?.borderBoxSize?.[0]?.blockSize ??
                entry?.target?.getBoundingClientRect().height;

            setListHeight(height);
        });

        resizeObserver.observe(scrollElement);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);
    // *****************
    // UPDATE SCROLL TOP
    // *****************
    useIsomorphicLayoutEffect(() => {
        const scrollElement = getScrollElement();

        if (!scrollElement) return;

        const handleScroll = () => {
            const scrollTop = scrollElement.scrollTop;
            setScrollTop(scrollTop);
        };

        handleScroll();

        scrollElement.addEventListener('scroll', handleScroll);

        return () => scrollElement.removeEventListener('scroll', handleScroll);
    }, [getScrollElement]);

    // *******************
    // UPDATE IS SCROLLING
    // *******************
    useEffect(() => {
        const scrollElement = getScrollElement();

        if (!scrollElement) return;

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const handleScroll = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            setIsScrolling(true);

            timeoutId = setTimeout(() => setIsScrolling(false), scrollingDelay);
        };
        scrollElement.addEventListener('scroll', handleScroll);

        return () => scrollElement.removeEventListener('scroll', handleScroll);
    }, [getScrollElement, scrollingDelay]);

    // ********************
    // CREATE VIRTUAL ITEMS
    // ********************
    const { virtualRows, startIndex, endIndex, totalHeight, allRows } = useMemo(() => {
        const getRowHeight = (index: number) => {
            if (rowHeight) {
                return rowHeight(index);
            }

            const key = getRowKey(index);

            if (typeof measurementCache[key] === 'number') {
                return measurementCache[key]!;
            }

            return estimateRowHeight!(index);
        };

        const rangeStart = scrollTop;
        const rangeEnd = scrollTop + listHeight;

        let totalHeight = 0;
        let startIndex = -1;
        let endIndex = -1;

        const allRows: useVirtualizationProps[] = Array(rowsCount);

        for (let index = 0; index < rowsCount; index++) {
            const key = getRowKey(index);
            const row = {
                key,
                index: index,
                height: getRowHeight(index),
                offsetTop: totalHeight,
            };

            totalHeight += row.height;
            allRows[index] = row;

            if (startIndex === -1 && row.offsetTop + row.height > rangeStart) {
                startIndex = Math.max(0, index - overscanY);
            }

            if (endIndex === -1 && row.offsetTop + row.height >= rangeEnd) {
                endIndex = Math.min(rowsCount - 1, index + overscanY);
            }
        }
        const virtualRows = allRows.slice(startIndex, endIndex + 1);

        return { virtualRows, startIndex, endIndex, allRows, totalHeight };
    }, [
        estimateRowHeight,
        getRowKey,
        rowHeight,

        rowsCount,
        listHeight,
        measurementCache,
        overscanY,
        scrollTop,
    ]);

    const latestData = useLatest({
        measurementCache,
        getRowKey,
        getScrollElement,
        getSelection,
        allRows,
        scrollTop,
    });

    // ***************
    // MEASURE ELEMENT
    // ***************
    const measureElementInner = useCallback(
        (element: Element | null, resizeObserver: ResizeObserver, entry?: ResizeObserverEntry) => {
            if (!element) {
                return;
            }

            if (!element.isConnected) {
                resizeObserver.unobserve(element);
                return;
            }

            const indexAttribute = element.getAttribute('data-index') || '';
            const index = parseInt(indexAttribute, 10);

            if (Number.isNaN(index)) {
                console.error('dynamic index must have a valid `data-index` attribute');
                return;
            }

            const { measurementCache, getRowKey, allRows, scrollTop, getScrollElement } =
                latestData;

            const key = getRowKey(index);
            const isResize = Boolean(entry);
            if (!isResize && typeof measurementCache[key] === 'number') {
                return;
            }

            const height =
                entry?.borderBoxSize[0].blockSize ?? element.getBoundingClientRect().height;

            if (measurementCache[key] === height) {
                return;
            }

            const row = allRows[index];
            const delta = height - row.height;

            if (delta !== 0 && scrollTop > row.offsetTop) {
                const element = getScrollElement();
                if (element) {
                    element.scrollBy(0, delta);
                }
            }

            setMeasurementCache((cache) => ({ ...cache, [key]: height }));
        },
        [latestData]
    );

    // *****************************************
    // CALCULATE VIRTUAL ITEMS WHEN RESIZE ITEMS
    // *****************************************
    const itemResizeObserver = useMemo(() => {
        const ro = new ResizeObserver((entries) => {
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const element = entry.target as HTMLElement;
                measureElementInner(element, ro, entry);
            }
        });
        return ro;
    }, [measureElementInner]);

    // ****************************************
    // CREATE CASH AND CREATE SCROLL CORRECTION
    // ****************************************
    const measureElement = useCallback(
        (element: Element | null) => {
            measureElementInner(element, itemResizeObserver);
        },
        [itemResizeObserver, measureElementInner]
    );

    return {
        virtualRows,
        totalHeight,
        startIndex,
        endIndex,
        isScrolling,
        allRows,

        measureElement,
    };
};

export default useVirtualization;
