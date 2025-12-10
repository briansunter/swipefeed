import { createContext, useContext } from 'react';
import type { SwipeDeckRenderContext } from '../types';

// biome-ignore lint/suspicious/noExplicitAny: Context defaults to any
export const SwipeItemContext = createContext<SwipeDeckRenderContext<any> | undefined>(undefined);

// biome-ignore lint/suspicious/noExplicitAny: Generic defaults to any
export function useSwipeItem<T = any>(): SwipeDeckRenderContext<T> {
    const context = useContext(SwipeItemContext);
    if (!context) {
        throw new Error("useSwipeItem must be used within a SwipeDeck item");
    }
    return context;
}
