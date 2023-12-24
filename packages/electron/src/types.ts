export type RejectionReason<T> = {
  reason: T;
  promise: Promise<T>;
};
