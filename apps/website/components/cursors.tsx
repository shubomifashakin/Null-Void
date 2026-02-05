import { Cursor } from "./ui/cursor";
import { UserInfoWithRef } from "@/stores/room-state";

export function Cursors({ users }: { users: UserInfoWithRef[] }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {users.map((user) => (
        <Cursor key={user.userId} info={user} ref={user.ref} />
      ))}
    </div>
  );
}
