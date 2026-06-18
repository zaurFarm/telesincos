import { CognitiveEventBus } from './EventBus';

export const trackAnalytics = (eventName: string, payload?: any) => {
   // In a real system, send this to PostHog, Mixpanel, or custom analytics endpoint
   // For now, route via CognitiveEventBus for local observability
   CognitiveEventBus.dispatch(`ANALYTICS: ${eventName}`, payload);
};

export const useAnalytics = () => {
   return {
     track: trackAnalytics
   };
};
