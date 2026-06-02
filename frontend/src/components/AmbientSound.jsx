import { useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function AmbientSound() {
    const { theme } = useAppContext();
    const audioRef = useRef(null);
    const enabledRef = useRef(theme.lobbyMusic);

    useEffect(() => {
        const audio = new Audio('/audio/lobby.mp3');
        audio.volume = 0.25;
        audioRef.current = audio;

        audio.addEventListener('ended', () => {
            if (enabledRef.current){
                audio.currentTime = 0;
                audio.play().catch(() => {});
            }
        });

        const unlock = () => {
            if (!enabledRef.current) return;
            audio.play()
                .then(() => {
                    document.removeEventListener('click', unlock);
                    document.removeEventListener('keydown', unlock);
                })
                .catch(() => {});
        };

        audio.play().catch(() => {
            document.addEventListener('click', unlock);
            document.addEventListener('keydown', unlock);
            audio._unlock = unlock;
        });

        return () => {
            if (audio._unlock) {
                document.removeEventListener('click', audio._unlock);
                document.removeEventListener('keydown', audio._unlock);
            }
            audio.pause();
            audio.src = '';
        };
    }, []);

    useEffect(() => {
        enabledRef.current = theme.lobbyMusic;
        const audio = audioRef.current;
        if (!audio) return;
        if (theme.lobbyMusic) {
            audio.play().catch(() => {});
        } else {
            audio.pause();
        }
    }, [theme.lobbyMusic]);

    return null;
}
