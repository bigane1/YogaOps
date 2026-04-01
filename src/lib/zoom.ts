type ZoomTokenResponse = {
  access_token: string;
};

type ZoomMeetingResponse = {
  join_url?: string;
};

export async function createZoomMeeting(input: {
  topic: string;
  startTime: Date;
  durationMin: number;
}): Promise<string | null> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    return null;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}` },
    cache: "no-store",
  });

  if (!tokenRes.ok) return null;
  const tokenJson = (await tokenRes.json()) as ZoomTokenResponse;
  if (!tokenJson.access_token) return null;

  const meetingRes = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: input.startTime.toISOString(),
      duration: input.durationMin,
      settings: {
        join_before_host: false,
        waiting_room: true,
      },
    }),
    cache: "no-store",
  });

  if (!meetingRes.ok) return null;
  const meetingJson = (await meetingRes.json()) as ZoomMeetingResponse;
  return meetingJson.join_url ?? null;
}
