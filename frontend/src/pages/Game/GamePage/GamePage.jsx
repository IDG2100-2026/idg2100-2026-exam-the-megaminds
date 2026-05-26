import { useWebSocket } from "@/hooks/useWebSocket";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

export default function GamePage() {
const { gameId } = useParams();
// eslint-disable-next-line no-unused-vars
const { lastMessage, connected, send } = useWebSocket(gameId);

useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "dice-rolled") {
        //Update game state
    }
}, [lastMessage]); 
}