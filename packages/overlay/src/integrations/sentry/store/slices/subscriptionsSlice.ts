import { StateCreator } from 'zustand';
import { generateUuidv4 } from '~/lib/uuid';
import { SentryStore, Subscription, SubscriptionsSliceActions, SubscriptionsSliceState } from '../types';

const initialSubscriptionsState: SubscriptionsSliceState = {
  subscribers: new Map(),
};

export const createSubscriptionsSlice: StateCreator<
  SentryStore,
  [],
  [],
  SubscriptionsSliceState & SubscriptionsSliceActions
> = (set, get) => ({
  ...initialSubscriptionsState,
  subscribe: (...args: Subscription) => {
    const id = generateUuidv4();
    const { subscribers } = get();
    const newSubscribers = new Map(subscribers);
    newSubscribers.set(id, args);
    set({ subscribers: newSubscribers });

    return () => {
      const { subscribers: currentSubscribers } = get();
      const updatedSubscribers = new Map(currentSubscribers);
      updatedSubscribers.delete(id);
      set({ subscribers: updatedSubscribers });
    };
  },
});
