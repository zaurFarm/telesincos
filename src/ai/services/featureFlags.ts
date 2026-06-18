import { connection } from '../../queue/redis.js';

export const featureFlags = {
  aiRepliesDisabled: false,
  proactiveDisabled: false,
  paymentsDisabled: false,
};

// Sync flags periodically from DB or Redis mapping
export async function getFeatureFlags() {
  try {
    const flags = await connection.get('feature_flags');
    if (flags) {
      return { ...featureFlags, ...JSON.parse(flags) };
    }
  } catch (error) {
    // Return safe defaults if disconnected
  }
  return featureFlags;
}

export async function setFeatureFlag(flag: keyof typeof featureFlags, isEnabled: boolean) {
  try {
    const current = await getFeatureFlags();
    current[flag] = isEnabled;
    await connection.set('feature_flags', JSON.stringify(current));
  } catch (error) {
    console.error('⚠️ Failed to set feature flag', error);
  }
}
