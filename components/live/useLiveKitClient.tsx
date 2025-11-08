"use client";

import { useEffect, useState } from "react";
import type { Room } from "livekit-client";
import { createLocalTracks, Room as LiveKitRoom } from "livekit-client";

type UseLiveKitClientParams = {
  token: string;
  url: string;
  autoPublish?: boolean;
};

export function useLiveKitClient({ token, url, autoPublish = false }: UseLiveKitClientParams) {
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lkRoom = new LiveKitRoom();
    let active = true;

    async function connect() {
      try {
        await lkRoom.connect(url, token);
        if (autoPublish) {
          const tracks = await createLocalTracks({ audio: true, video: true });
          await lkRoom.localParticipant.publishTracks(tracks);
        }
        if (active) {
          setRoom(lkRoom);
        }
      } catch (err: any) {
        console.error("LiveKit connect error", err);
        if (active) {
          setError(err?.message ?? "ライブ接続に失敗しました");
        }
      }
    }

    void connect();

    return () => {
      active = false;
      lkRoom.disconnect();
    };
  }, [autoPublish, token, url]);

  return { room, error };
}
