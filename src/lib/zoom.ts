type ZoomTokenResponse = {
  access_token: string;
};

type ZoomMeetingResponse = {
  join_url?: string;
};

async function getZoomToken(): Promise<string | null> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) return null;

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    { method: "POST", headers: { Authorization: `Basic ${basicAuth}` }, cache: "no-store" },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as ZoomTokenResponse;
  return json.access_token ?? null;
}

/** Extrait l'ID numérique depuis un join_url Zoom (ex: https://zoom.us/j/12345678?pwd=xxx) */
function extractMeetingId(joinUrl: string): string | null {
  const match = joinUrl.match(/\/j\/(\d+)/);
  return match ? match[1] : null;
}

export async function createZoomMeeting(input: {
  topic: string;
  startTime: Date;
  durationMin: number;
}): Promise<string | null> {
  const token = await getZoomToken();
  if (!token) return null;

  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: input.startTime.toISOString(),
      duration: input.durationMin,
      settings: { join_before_host: false, waiting_room: true },
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const json = (await res.json()) as ZoomMeetingResponse;
  return json.join_url ?? null;
}

/**
 * Supprime un meeting Zoom à partir de son join_url.
 * Si le lien ne contient pas d'ID ou si l'API échoue, ça n'est pas bloquant.
 */
export async function cancelZoomMeeting(joinUrl: string): Promise<void> {
  const meetingId = extractMeetingId(joinUrl);
  if (!meetingId) return;

  const token = await getZoomToken();
  if (!token) return;

  await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}
