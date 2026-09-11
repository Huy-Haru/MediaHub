import type { Profile } from './profiles.model.js';
// STAFF exists in the database but is not an enabled API actor.
export type Identity = Omit<Profile, 'role'> & {
  role: 'CUSTOMER' | 'ADMIN';
  customer_id: string | null;
};
