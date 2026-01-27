import { Cursor } from "./ui/cursor";
import { UserInfoWithRef } from "@/stores/room-state";

export function Cursors({ users }: { users: UserInfoWithRef[] }) {
  return (
    <>
      {users.map((user) => (
        <Cursor key={user.userId} info={user} ref={user.ref} />
      ))}
    </>
  );
}
