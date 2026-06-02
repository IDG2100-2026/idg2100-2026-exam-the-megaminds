import { useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getTheme, BOARD_COLORS } from '@/config/themes';
import { userService } from '@/services/api';

export function useTheme() {
    const { theme, setTheme, user } = useAppContext();

    const currentTheme = getTheme(theme.mode);

    const toggleTheme = useCallback(async () => {
        const newMode = theme.mode === 'dark' ? 'light' : 'dark';
        setTheme(prev => ({ ...prev, mode: newMode }));
        applyThemeToDocument(getTheme(newMode));

        if (user?.userId) {
            try {
                await userService.updateUser(user.userId, { preferences: { ...theme, mode: newMode } });
            } catch (err) {
                console.error('Failed to save theme preference:', err);
            }
        }
    }, [theme, setTheme, user]);

    const changeBoardColor = useCallback(async (colorKey) => {
        if (!BOARD_COLORS[colorKey]) return;

        setTheme(prev => ({ ...prev, boardColor: colorKey }));

        if (user?.userId) {
            try {
                await userService.updateUser(user.userId, { preferences: { ...theme, boardColor: colorKey } });
            } catch (err) {
                console.error('Failed to save board color preference:', err);
            }
        }
    }, [theme, setTheme, user]);

    const toggleSound = useCallback(async () => {
        const newSound = !theme.soundEnabled;
        setTheme(prev => ({ ...prev, soundEnabled: newSound }));

        if (user?.userId) {
            try {
                await userService.updateUser(user.userId, { preferences: { ...theme, soundEnabled: newSound } });
            } catch (err) {
                console.error('Failed to save sound preference:', err);
            }
        }
    }, [theme, setTheme, user]);

    const toggleLobbyMusic = useCallback(async () => {
        const newVal = !theme.lobbyMusic;
        setTheme(prev => ({ ...prev, lobbyMusic: newVal }));

        if (user?.userId) {
            try{
                await userService.updateUser(user.userId, {preferences: { ...theme, lobbyMusic: newVal } });
            } catch (err) {
                console.error('Failed to save lobby music preference:', err);
            }
        }
    }, [theme, setTheme, user]);

    return {
        colors: currentTheme.colors,
        isDarkMode: theme.mode === 'dark',
        currentMode: theme.mode,
        toggleTheme,
        boardColor: theme.boardColor,
        changeBoardColor,
        soundEnabled: theme.soundEnabled,
        toggleSound,
        lobbyMusic: theme.lobbyMusic,
        toggleLobbyMusic,
    };
}

export function applyThemeToDocument(theme) {
    const root = document.documentElement;

    Object.keys(theme.colors).forEach((colorKey) => {
        const cssVarName = `--theme-${colorKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVarName, theme.colors[colorKey]);
    });

    root.setAttribute('data-theme', theme.id);
}
