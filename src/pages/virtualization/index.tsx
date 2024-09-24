import React, { useCallback, useRef, useState } from 'react';
import { NextPage } from 'next';

import useVirtualization from '../../hooks/virtualization/useVirtualization';
import { faker } from '@faker-js/faker';
import dynamic from 'next/dynamic';

const INITIAL_LIST_DATA: { id: string; text: string }[] = Array.from({ length: 10_000 }).map(
    (_, index) => ({
        id: Math.random().toString(36).slice(2),
        text: `${index} - > ${faker.lorem.paragraphs({
            max: 4,
            min: 3,
        })}`,
    })
);

const containerHeight = 500;

const VirtualizationPage: NextPage = () => {
    const [listItems, setListItems] = useState(INITIAL_LIST_DATA);
    const scrollElementRef = useRef<HTMLDivElement>(null);

    const { totalHeight, virtualRows, measureElement } = useVirtualization({
        estimateRowHeight: useCallback(() => 120, []),
        rowsCount: listItems.length,
        getScrollElement: useCallback(() => scrollElementRef.current, []),
        getRowKey: useCallback((index) => listItems[index]!.id, [listItems]),
    });

    return (
        <div>
            <h1>Virtualization Page</h1>
            <p style={{ marginBottom: '50px' }}>
                Welcome to the Virtualization page. This is a simple Next.js page example.
            </p>
            <p>Use my virtualization hook</p>
            <button onClick={() => setListItems((items) => items.slice().reverse())}>
                reverse
            </button>
            <div
                ref={scrollElementRef}
                className="container"
                style={{
                    height: `${containerHeight}px`,
                    overflow: 'auto',
                    border: '1px solid black',
                    borderRadius: '5px 0 0 5px',
                    width: 500,
                    boxSizing: 'border-box',
                }}
            >
                <div
                    style={{
                        height: `${totalHeight}px`,
                        position: 'relative',
                    }}
                >
                    {virtualRows.map((virtualItem) => {
                        const item = listItems[virtualItem.index];
                        return (
                            <p
                                key={item.id}
                                data-index={virtualItem.index}
                                ref={measureElement}
                                style={{
                                    top: 0,
                                    padding: '6px 12px',
                                    position: 'absolute',
                                    transform: `translateY(${virtualItem.offsetTop}px)`,
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

// TODO: RESOLVE;
export default dynamic(() => Promise.resolve(VirtualizationPage), {
    ssr: false,
});
