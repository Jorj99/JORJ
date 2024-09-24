# `useVirtualization` Hook

This hook provides an efficient way to handle large lists by virtualizing the rows, only rendering the items visible in the viewport and a few additional ones to smooth scrolling (overscan). This improves performance, especially for lists with a large number of items.

## Usage Example

Below is a simple example of how to use the `useVirtualization` hook in a React component.

```tsx
import React, { useCallback, useRef, useState } from 'react';
import useVirtualization from '../../hooks/useVirtualization';

const INITIAL_LIST_DATA = Array.from({ length: 10000 }).map((_, index) => ({
    id: `item-${index}`,
    text: `Item ${index}`,
}));

const containerHeight = 500;

const VirtualizationPage = () => {
    const [listItems] = useState(INITIAL_LIST_DATA);
    const scrollElementRef = useRef<HTMLDivElement>(null);

    const { totalHeight, virtualRows, measureElement } = useVirtualization({
        estimateRowHeight: useCallback(() => 120, []),
        rowsCount: listItems.length,
        getScrollElement: useCallback(() => scrollElementRef.current, []),
        getRowKey: useCallback((index) => listItems[index]!.id, [listItems]),
    });

    return (
        <div>
            <h1>Virtualized List Example</h1>
            <div
                ref={scrollElementRef}
                style={{
                    height: `${containerHeight}px`,
                    overflow: 'auto',
                    border: '1px solid black',
                    width: '100%',
                }}
            >
                <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                    {virtualRows.map((virtualItem) => {
                        const item = listItems[virtualItem.index];
                        return (
                            <p
                                key={item.id}
                                ref={measureElement}
                                data-index={virtualItem.index}
                                style={{
                                    position: 'absolute',
                                    transform: `translateY(${virtualItem.offsetTop}px)`,
                                    width: '100%',
                                    padding: '10px',
                                }}
                            >
                                {item.text}
                            </p>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VirtualizationPage;
```