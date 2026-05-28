import { useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import './dice-poker-board.js';
import './dice-poker-die.js';
import './dice-poker-player.js';
import './GameBoard.css';

export default function GameBoard({ game, send, lastMessage }) {
    const boardRef = useRef(null);
    const { user } = useAppContext();

    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;

        const onGameStart  = (e) => send({ type: 'game-start',  detail: e.detail });
        const onTurnFinish = (e) => send({ type: 'turn-finish', detail: e.detail });
        const onGameEnded  = async (e) => {
            send({ type: 'game-ended', detail: e.detail });
            if (game && e.detail.scores) {
                try {
                    await gameService.recordResult(game.gameId, {
                        players: game.players.map((p, i) => ({
                            userId: p.userId,
                            score: e.detail.scores[i] ?? 0,
                        })),
                        roundTime: game.rules?.roundTime,
                    });
                    refreshUser();
                } catch (err) {
                    console.error('Failed to record game result:', err);
                }
            }
        };

        board.addEventListener('game-start',  onGameStart);
        board.addEventListener('turn-finish', onTurnFinish);
        board.addEventListener('game-ended',  onGameEnded);

        return () => {
            board.removeEventListener('game-start',  onGameStart);
            board.removeEventListener('turn-finish', onTurnFinish);
            board.removeEventListener('game-ended',  onGameEnded);
        };
    }, [send, game, refreshUser]);

    useEffect(() => {
        if (!lastMessage) return;
    }, [lastMessage]);

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
                        score={String(player.score ?? 0)}
                        userid={String(player.userId)}
                        {...(isLocal ? { local: '' } : {})}
                    />
                );
            })}
        </dice-poker-board>
    );
}
