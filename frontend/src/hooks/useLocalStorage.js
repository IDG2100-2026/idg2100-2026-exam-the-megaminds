import { useState, useCallback } from "react";

export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('useLocalStorage read error:', error);
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value) => {
            try {
                setStoredValue(prev => {
                    const valueToStore = value instanceof Function ? value(prev) : value;
                    if (valueToStore === undefined || valueToStore === null) {
                        window.localStorage.removeItem(key);
                    } else {
                        window.localStorage.setItem(key, JSON.stringify(valueToStore));
                    }
                    return valueToStore;
                });
            } catch (error) {
                console.error('useLocalStorage write error:', error);
            }
        },
        [key]
    );

    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error('useLocalStorage remove error:', error);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}