import { useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useSound } from '@/hooks/useSound.js';
import './dice-poker-board.js';
import './dice-poker-die.js';
import './dice-poker-player.js';
import './GameBoard.css';

export default function GameBoard({ game, send, lastMessage }) {
    const boardRef = useRef(null);
    const { user } = useAppContext();
    const { play } = useSound();
    const lastStateRef = useRef(null);

    // Intents up: player action => WebSocket
    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;

        const onRoll = (e) => {
            play('roll');
            send({ type: 'roll', held: e.detail.held ?? [] });
        };
        const onDone = () => send({ type: 'done-rolling' });

        board.addEventListener('request-roll', onRoll);
        board.addEventListener('request-done', onDone);

        return() => {
            board.removeEventListener('request-roll', onRoll);
            board.removeEventListener('request-done', onDone);
        };
    }, [send, play]);

    // state down: WebSocker => board renderer
    useEffect(() => {
        if (lastMessage?.type === 'state') {
            lastStateRef.current = { state: lastMessage.state, viewerId: user?.userId };
            boardRef.current?.applyState(lastMessage.state, user?.userId);
        }

        if (lastMessage?.type === 'error') {
            console.error('WS server error:', lastMessage.message);
        }
        // round-result and game-over sounds come in step 4 when the server sends those messages
        if (lastMessage?.type === 'round-result') {
            play(lastMessage.winnerIds?.includes(user?.userId) ? 'win' : 'lose');
            boardRef.current?.showRoundResult(lastMessage.winnerIds, lastMessage.handNames);
        }

        if (lastMessage?.type === 'game-over') {
            play(lastMessage.winnerIds?.includes(user?.userId) ? 'win' : 'lose');
            boardRef.current?.showGameOver(lastMessage.winnerIds);
        }
    }, [lastMessage, user?.userId, play]);

    useEffect(() => {
        if (lastStateRef.current && boardRef.current) {
            boardRef.current.applyState(lastStateRef.current.state, lastStateRef.current.viewerId);
        }
    }, [game?.players?.length]);


    if (!game) return <p>Loading game board...</p>;

    const { bestof, roundTime, straightallowed, numPlayers } = game.rules ?? {};

    return (
        <dice-poker-board
            ref={boardRef}
            bestof={bestof}
            roundtime={roundTime}
            numplayers={numPlayers}
            status={game.status}
            {...(straightallowed ? { 'include-straight': '' } : {})}
        >
            {(game.players ?? []).map((player) => {
                const isLocal = player.userId === user?.userId;
                const name = isLocal ? (user?.username ?? 'You') : (player.username ?? 'Opponent');
                return (
                    <dice-poker-player
                        key={player.userId}
                        playername={name}
                        userid={String(player.userId)}
                        {...(isLocal ? { local: '' } : {})}
                    />
                );
            })}
        </dice-poker-board>
    );
}
