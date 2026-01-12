export function makeRoomCacheKey(roomId: string): string {
  return `room:${roomId}`;
}

export function generateInviteMail({
  inviterName,
  roomName,
  inviteLink,
  expiryDate,
}: {
  inviterName: string;
  roomName: string;
  inviteLink: string;
  expiryDate: Date;
}) {
  const expiryDateString = expiryDate.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 500px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 30px 30px; border-bottom: 1px solid #f0f0f0;">
                            <h2 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">You're Invited</h2>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <!-- Greeting -->
                            <p style="margin: 0 0 24px 0; color: #555; font-size: 16px; line-height: 1.5;">
                                Hi there,
                            </p>

                            <!-- Invitation message -->
                            <p style="margin: 0 0 24px 0; color: #555; font-size: 16px; line-height: 1.5;">
                                <strong style="color: #1a1a1a;">${inviterName}</strong> has invited you to join the room:
                            </p>

                            <!-- Room name highlight -->
                            <div style="margin: 0 0 24px 0; padding: 16px; background-color: #f9f9f9; border-left: 3px solid #4f46e5; border-radius: 4px;">
                                <p style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">${roomName}</p>
                            </div>

                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" style="margin: 24px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${inviteLink}" style="display: inline-block; padding: 12px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Join Room</a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry notice -->
                            <p style="margin: 24px 0 0 0; color: #888; font-size: 14px; line-height: 1.5; text-align: center;">
                                This invite expires on <strong>${expiryDateString}</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; border-top: 1px solid #f0f0f0; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 13px; line-height: 1.5;">
                                If you didn't expect this invite, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

export function makeRoomsUsersCacheKey(roomId: string): string {
  return `room:${roomId}:users`;
}

export function makeRoomUsersIdCacheKey(
  roomId: string,
  userId: string,
): string {
  return `room:${roomId}:users:${userId}`;
}
export function makeRoomCanvasStateCacheKey(roomId: string): string {
  return `room:${roomId}:canvas:state`;
}
