import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { io, Socket } from "socket.io-client";

export function useSockets() {
  const { roomId } = useParams<{ roomId: string }>();

  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(
      `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/rooms`,
      {
        query: { roomId },
        retries: 3,
        ackTimeout: 10000,
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      }
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId]);

  return { socket };
}
