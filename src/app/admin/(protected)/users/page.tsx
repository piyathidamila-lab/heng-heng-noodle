import type { Metadata } from 'next';

import { getUsers } from 'src/lib/user-service';
import { getCurrentUser } from 'src/lib/auth-session';

import { AdminUsersView } from 'src/sections/admin/users/admin-users-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'จัดการผู้ใช้งาน | เฮงเฮง ก๋วยเตี๋ยว' };

export default async function Page() {
  // Auth is already enforced by the (protected) layout — it guarantees an admin here.
  const [user, users] = await Promise.all([getCurrentUser(), getUsers()]);

  return <AdminUsersView initialUsers={users} currentUserId={user!.id} />;
}
