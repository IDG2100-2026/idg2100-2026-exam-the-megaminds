import { useEffect, useRef, useState } from 'react';
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
    const [gameState, setGameState] = useState(null);
    const [prevLastMessage, setPrevLastMessage] = useState(null);
    if (lastMessage !== prevLastMessage) {
        setPrevLastMessage(lastMessage);
        if (lastMessage?.type === 'state') setGameState(lastMessage.state);
    }
    const [betAmount, setBetAmount] = useState(0);
    const [betError, setBetError] = useState('');
    const lastStateRef = useRef(null);
    const betTimerRef = useRef(null);

    // Intents up: player action => WebSocket
    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;

        const onRoll = (e) => {
            play('roll');
            send({ type: 'roll', held: e.detail.held ?? [] });
        };
        const onDone = () => { play('click'); send({ type: 'done-rolling' }); };
        const onHold = () => play('hold');

        board.addEventListener('request-roll', onRoll);
        board.addEventListener('request-done', onDone);
        board.addEventListener('request-hold', onHold);

        return() => {
            board.removeEventListener('request-roll', onRoll);
            board.removeEventListener('request-done', onDone);
            board.removeEventListener('request-hold', onHold);
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

    const myPlayer = gameState?.players?.find( p => String(p.userId) === String(user?.userId));
    const isMyBettingTurn = gameState?.phase === 'betting' && String(gameState?.toAct) === String(user?.userId);
    const toCall = (gameState?.highestBet ?? 0) - (myPlayer?.currentBet ?? 0);

    useEffect(() => {
        (async () => {
            if (isMyBettingTurn) setBetAmount(toCall);
        })();
    }, [isMyBettingTurn, gameState?.toAct, toCall]);

    useEffect(() => {
        clearTimeout(betTimerRef.current);
        if (isMyBettingTurn && !myPlayer?.folded) {
            const ms = (gameState?.rules?.roundTime ?? 30) * 1000;
            betTimerRef.current = setTimeout(() => {
                send({ type: 'bet', amount: toCall });
            }, ms);
        }
        return () => clearTimeout(betTimerRef.current);
    }, [isMyBettingTurn, gameState?.toAct, gameState?.rules?.roundTime, myPlayer?.folded, toCall, send]);

    const handleBet = () => {
        if (betAmount < toCall) { setBetError(`Must bet at least ${toCall}`); return; }
        setBetError('');
        send({ type: 'bet', amount: betAmount });
        setBetAmount(0);
    };

    const handleFold = () => {
        setBetError('')
        send({ type: 'fold' });
    };
    

    if (!game) return <p>Loading game board...</p>;

    const { bestof, roundTime, straightallowed, numPlayers } = game.rules ?? {};

    return (
        <>
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
        {gameState?.phase === 'betting' && (
            <div className="betting-panel">
                <div className="betting-info">
                    <span>Pot: <strong>{gameState.pot} pts</strong></span>
                    <span>Highest bet: <strong>{gameState.highestBet} pts</strong></span>
                    {myPlayer && <span>Your stack: <strong>{myPlayer.stack} pts</strong></span>}
                    {myPlayer && <span>Your bet: <strong>{myPlayer.currentBet} pts</strong></span>}
                </div>

                {myPlayer?.folded && <p className="betting-folded">You folded this round.</p>}

                {isMyBettingTurn && !myPlayer?.folded && (
                    <div className="betting-actions">
                        <p className="betting-prompt">
                            {toCall === 0 ? 'Check or bet:' : `Call ${toCall} pts or raise:`}
                        </p>
                        <div className="betting-controls">
                            <input
                                type="number"
                                className="betting-input"
                                value={betAmount}
                                min={toCall}
                                max={myPlayer?.stack ?? 0}
                                onChange={e => setBetAmount(Number(e.target.value))}
                            />
                            <button className="betting-btn betting-btn--primary" onClick={handleBet}>
                                {toCall === 0 && betAmount === 0 ? 'Check' : betAmount === toCall ? 'Call' : 'Bet / Raise'}
                            </button>
                            <button className="betting-btn betting-btn--danger" onClick={handleFold}>
                                Fold
                            </button>
                        </div>
                        {betError && <p className="betting-error">{betError}</p>}
                    </div>
                )}

                {!isMyBettingTurn && !myPlayer?.folded && (
                    <p className="betting-waiting">
                        Waiting for {gameState.players?.find(p => p.userId === gameState.toAct)?.username ?? 'opponent'}…
                    </p>
                )}

                <div className="betting-players">
                    {gameState.players?.map(p => (
                        <span key={p.userId} className={`betting-player-tag ${p.folded ? 'folded' : ''} ${p.userId === gameState.toAct ? 'active' : ''}`}>
                            {p.username}: {p.stack} pts {p.folded ? '(folded)' : `(bet ${p.currentBet})`}
                        </span>
                    ))}
                </div>
            </div>
        )}
        </>
    );
}
