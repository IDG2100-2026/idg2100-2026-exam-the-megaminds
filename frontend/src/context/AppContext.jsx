/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react";
import { DEFAULT_THEME, DEFAULT_BOARD_COLOR, getTheme, BOARD_COLORS, BOARD_COLORS_LIGHT } from "@/config/themes";
import { applyThemeToDocument } from "@/hooks/useTheme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { userService } from "@/services/api";

export const AppContext = createContext();

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
}

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    const [themeMode, setThemeMode] = useLocalStorage('appTheme', DEFAULT_THEME);
    const [boardColor, setBoardColor] = useLocalStorage('boardColor', DEFAULT_BOARD_COLOR);
    const [soundEnabled, setSoundEnabled] = useLocalStorage('soundEnabled', true);
    const [profilePic, setProfilePic] = useLocalStorage('profilePic', true);
    const [displayNames, setDisplayNames] = useLocalStorage('displayNames', true);
    const [lobbyCount, setLobbyCount] = useLocalStorage('lobbyCount', 10);
    const [lobbyMusic, setLobbyMusic] = useLocalStorage('lobbyMusic', true);

    const theme = { mode: themeMode, boardColor, soundEnabled, profilePic, displayNames, lobbyCount, lobbyMusic };

    const setTheme = (updater) => {
        const next = typeof updater === 'function' ? updater(theme) : updater;
        if (next.mode !== undefined) setThemeMode(next.mode);
        if (next.boardColor !== undefined) setBoardColor(next.boardColor);
        if (next.soundEnabled !== undefined) setSoundEnabled(next.soundEnabled);
        if (next.lobbyMusic !== undefined) setLobbyMusic(next.lobbyMusic);
        if (next.profilePic !== undefined) setProfilePic(next.profilePic);
        if (next.displayNames !== undefined) setDisplayNames(next.displayNames);
        if (next.lobbyCount !== undefined) setLobbyCount(next.lobbyCount);
    };

    // Apply theme to CSS variables whenever themeMode changes
    useEffect(() => {
        applyThemeToDocument(getTheme(themeMode));
    }, [themeMode]);

    useEffect(() => {
        const colors = themeMode === 'dark' ? BOARD_COLORS : BOARD_COLORS_LIGHT;
        document.documentElement.style.setProperty('--board-bg-color', colors[boardColor] || colors.green);
    }, [boardColor, themeMode]);

    // On mount, check if the user is already logged in via cookie
    useEffect(() => {
        const initializeUser = async () => {
            try {
                const loggedInUser = await userService.getMe();
                setUser(loggedInUser);
                if (loggedInUser?.preferences && Object.keys(loggedInUser.preferences).length > 0) {
                    setTheme(loggedInUser.preferences);
                }
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
                setIsInitialized(true);
            }
        };

        initializeUser();
    }, []);

    const login = async (username, pwd) => {
        setIsLoading(true);
        try {
            const loggedInUser = await userService.login(username, pwd);
            setUser(loggedInUser);
            if (loggedInUser?.preferences && Object.keys(loggedInUser.preferences).length > 0) {
                setTheme(loggedInUser.preferences);
            }
            return loggedInUser;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await userService.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
        }
    };

    const refreshUser = async () => {
        try {
            const updated = await userService.getMe();
            setUser(updated);
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    return (
        <AppContext.Provider value={{
            user,
            isLoading,
            setIsLoading,
            isInitialized,
            theme,
            setTheme,
            login,
            logout,
            refreshUser,
            lobbyCount,
            setLobbyCount,
        }}>
            {children}
        </AppContext.Provider>
    );
}
