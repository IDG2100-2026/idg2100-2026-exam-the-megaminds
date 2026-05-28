import { useTheme } from '@/hooks/useTheme';
import { useAppContext } from '@/context/AppContext';
import { BOARD_COLORS, BOARD_COLORS_LIGHT } from '@/config/themes';
import styles from './SettingsPanel.module.css';

export default function SettingsPanel() {
    const { isDarkMode, toggleTheme, boardColor, changeBoardColor, soundEnabled, toggleSound, lobbyMusic, toggleLobbyMusic } = useTheme();
    const boardColorMap = isDarkMode ? BOARD_COLORS : BOARD_COLORS_LIGHT;
    const { lobbyCount, setLobbyCount } = useAppContext();

    return (
        <div className={styles.panel}>
            <h3 className={styles.title}>Settings</h3>

            <div className={styles.section}>
                <span className={styles.label}>Theme</span>
                <div className={styles.row}>
                    <button className={`${styles.btn} ${!isDarkMode ? styles.btnActive : ''}`} onClick={() => isDarkMode && toggleTheme()}>Light</button>
                    <button className={`${styles.btn} ${isDarkMode ? styles.btnActive : ''}`} onClick={() => !isDarkMode && toggleTheme()}>Dark</button>
                </div>
            </div>

            <div className={styles.section}>
                <span className={styles.label}>Board Color</span>
                <div className={styles.row}>
                    {Object.entries(boardColorMap).map(([key, hex]) => (
                        <button
                            key={key}
                            className={`${styles.swatch} ${boardColor === key ? styles.swatchActive : ''}`}
                            style= {{ background: hex }}
                            onClick={() => changeBoardColor(key)}
                            title={key}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <span className={styles.label}>Sound</span>
                <div className={styles.row}>
                    <button className={`${styles.btn} ${soundEnabled ? styles.btnActive : ''}`} onClick={() => !soundEnabled && toggleSound()}>On</button>
                    <button className={`${styles.btn} ${!soundEnabled ? styles.btnActive : ''}`} onClick={() => soundEnabled && toggleSound()}>Off</button>
                </div>
            </div>

            <div className={styles.section}>
                <span className={styles.label}>Music</span>
                <div className={styles.row}>
                    <button className={`${styles.btn} ${lobbyMusic ? styles.btnActive : ''}`} onClick={() => !lobbyMusic && toggleLobbyMusic()}>On</button>
                    <button className={`${styles.btn} ${!lobbyMusic ? styles.btnActive : ''}`} onClick={() => lobbyMusic && toggleLobbyMusic()}>Off</button>
                </div>
            </div>

            <div className={styles.section}>
                <span className={styles.label}>Lobby Preview - {lobbyCount} games</span>
                <input
                    type='range'
                    min={3}
                    max={20}
                    step={1}
                    value={lobbyCount}
                    onChange={e => setLobbyCount(Number(e.target.value))}
                    className={styles.slider}
                />
            </div>
        </div>
    );
}