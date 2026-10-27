// プロフィールと保存したお相手を、端末（localStorage）とアカウント（サーバーの userData/{uid}）でそろえるときの決め方。
// 画面や通信には触れない純粋な関数だけを置く（scripts/test-user-data.mjs で確かめる）。

export interface SyncProfile {
  name: string;
  birth: string;
  mbti: string;
  gender: 'male' | 'female';
}

export interface SyncPartner {
  id: string;
  name: string;
  birth: string;
  mbti: string;
  gender: 'male' | 'female';
  relationship: string;
}

export interface SyncData {
  profile: SyncProfile | null;
  partners: SyncPartner[] | null;
}

export interface SyncDecision {
  /** What this device should show and keep from now on */
  profile: SyncProfile | null;
  partners: SyncPartner[];
  /** Fields to send to the account because it lacks them or they were merged */
  push: Partial<{ profile: SyncProfile; partners: SyncPartner[] }> | null;
}

const samePartner = (a: SyncPartner, b: SyncPartner) => a.name === b.name && a.birth === b.birth;

/**
 * Decides the data after signing in on this device.
 * - owner === uid: this device already follows the account, so the account wins (edits made on other devices
 *   arrive here, and partners deleted elsewhere stay deleted).
 * - owner empty: data saved on this device before syncing existed. It is merged once into the account
 *   (partners from both sides, the profile the account already has, else this device's).
 * - owner is another account: the device's data belongs to someone else and is not carried over.
 */
export function decideSync(local: SyncData, remote: SyncData, owner: string | null, uid: string): SyncDecision {
  const localPartners = local.partners || [];
  if (owner && owner !== uid) {
    return { profile: remote.profile, partners: remote.partners || [], push: null };
  }

  if (owner === uid) {
    const push: SyncDecision['push'] = {};
    if (!remote.profile && local.profile) push.profile = local.profile;
    if (!remote.partners && localPartners.length) push.partners = localPartners;
    return {
      profile: remote.profile || local.profile,
      partners: remote.partners || localPartners,
      push: Object.keys(push).length ? push : null
    };
  }

  // First sync of data saved before syncing existed
  const profile = remote.profile?.birth ? remote.profile : (local.profile?.birth ? local.profile : (remote.profile || local.profile));
  const partners = [...(remote.partners || [])];
  localPartners.forEach((p) => {
    if (!partners.some((q) => samePartner(p, q))) partners.push(p);
  });
  const push: SyncDecision['push'] = {};
  if (profile && profile !== remote.profile) push.profile = profile;
  if (partners.length !== (remote.partners || []).length) push.partners = partners;
  return { profile, partners, push: Object.keys(push).length ? push : null };
}

export const sameProfile = (a: SyncProfile | null, b: SyncProfile | null) =>
  JSON.stringify(a) === JSON.stringify(b);

export const samePartners = (a: SyncPartner[], b: SyncPartner[]) => JSON.stringify(a) === JSON.stringify(b);
