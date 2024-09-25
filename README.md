## CUSTOM VIRTUALIZATION HOOK

```tsx
const { totalHeight, virtualRows, measureElement } = useVirtualization({
    estimateRowHeight: useCallback(() => 120, []),
    rowsCount: listItems.length,
    getScrollElement: useCallback(() => scrollElementRef.current, []),
    getRowKey: useCallback((index) => listItems[index]!.id, [listItems]),
});
```

## Links

Custom virtualization hook in vercel -> [Vercel](https://jorj-m3paz2tpu-jorj99s-projects.vercel.app/virtualization)

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Links

Virtualization hook in vercel -> [Vercel](https://jorj-m3paz2tpu-jorj99s-projects.vercel.app/virtualization)

Virtualization hook code -> [README.md](https://github.com/Jorj99/JORJ/tree/main/src/hooks/virtualization)
