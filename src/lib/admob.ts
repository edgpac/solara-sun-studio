// AdMob rewarded ad wrapper.
// On native iOS/Android (Capacitor): shows a real 30-second rewarded video.
// On web (browser): simulates a 3-second countdown so the flow can be tested.

// Google's official test ad unit IDs — safe to ship during development.
// Replace VITE_ADMOB_REWARDED_IOS / ANDROID with your real unit IDs before release.
const TEST_ID_IOS = "ca-app-pub-3940256099942544/1712485313";
const TEST_ID_ANDROID = "ca-app-pub-3940256099942544/5224354917";

function getAdId(): string {
  const platform = (window as { Capacitor?: { getPlatform?: () => string } })
    .Capacitor?.getPlatform?.() ?? "ios";
  return platform === "android"
    ? (import.meta.env.VITE_ADMOB_REWARDED_ANDROID ?? TEST_ID_ANDROID)
    : (import.meta.env.VITE_ADMOB_REWARDED_IOS ?? TEST_ID_IOS);
}

function isNative(): boolean {
  return !!(window as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor?.isNativePlatform?.();
}

let initialized = false;

export async function initAdMob(): Promise<void> {
  if (initialized || !isNative()) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({ initializeForTesting: import.meta.env.DEV });
    initialized = true;
  } catch {
    // Plugin not available — no-op
  }
}

// Shows a rewarded ad and resolves true if the user earned the reward.
// One ad per call — prepare and show are bundled here for simplicity.
export async function showRewardedAd(): Promise<boolean> {
  if (!isNative()) {
    // Web simulation: 3-second countdown stands in for a real ad.
    await new Promise<void>((r) => setTimeout(r, 3000));
    return true;
  }

  try {
    const { AdMob, RewardAdPluginEvents } = await import("@capacitor-community/admob");

    await AdMob.prepareRewardVideoAd({ adId: getAdId() });

    return await new Promise<boolean>((resolve) => {
      let earned = false;

      const onRewarded = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        earned = true;
      });

      const onDismissed = AdMob.addListener(RewardAdPluginEvents.Dismissed, async () => {
        (await onRewarded).remove();
        (await onDismissed).remove();
        resolve(earned);
      });

      const onFailed = AdMob.addListener(RewardAdPluginEvents.FailedToShow, async () => {
        (await onRewarded).remove();
        (await onFailed).remove();
        resolve(false);
      });

      void AdMob.showRewardVideoAd();
    });
  } catch {
    return false;
  }
}
