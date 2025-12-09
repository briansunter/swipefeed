import { useState, useEffect } from "react";

export function useWindowSize() {
    const [size, setSize] = useState<{ width: number; height: number }>({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    });

    useEffect(() => {
        if (typeof window === "undefined") return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setSize({ width: window.innerWidth, height: window.innerHeight });
            }, 100);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    return size;
}
