import { useVirtualizer as useTanStackVirtualizer } from "@tanstack/react-virtual";
/**
 * Simplified adapter using @tanstack/react-virtual
 */
export function useVirtualizer(params) {
    const { items, virtual, getScrollElement, orientation = "vertical" } = params;
    const count = items.length;
    const rowVirtualizer = useTanStackVirtualizer({
        count,
        getScrollElement,
        estimateSize: (i) => {
            const est = virtual?.estimatedSize ?? 800;
            if (typeof est === 'function') {
                return est(items[i], i);
            }
            return est;
        },
        overscan: virtual?.overscan ?? 5,
        horizontal: orientation === "horizontal",
        getItemKey: virtual?.getItemKey ? (index) => virtual.getItemKey(items[index], index) : undefined,
    });
    return {
        virtualItems: rowVirtualizer.getVirtualItems().map(item => ({
            index: item.index,
            key: item.key,
            offset: item.start,
            size: item.size,
            measureElement: rowVirtualizer.measureElement,
        })),
        totalSize: rowVirtualizer.getTotalSize(),
        getItemOffset: (index) => {
            const found = rowVirtualizer.getVirtualItems().find(v => v.index === index);
            return found ? found.start : 0;
        },
        getItemSize: (index) => {
            const found = rowVirtualizer.getVirtualItems().find(v => v.index === index);
            return found ? found.size : 0;
        },
        scrollToIndex: (index, options) => {
            rowVirtualizer.scrollToIndex(index, {
                align: options?.align,
                behavior: options?.behavior,
            });
        },
    };
}
