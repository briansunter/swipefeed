export function debounce(fn, wait) {
    let timeout = null;
    const debounced = (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = null;
            fn(...args);
        }, wait);
    };
    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };
    return debounced;
}
