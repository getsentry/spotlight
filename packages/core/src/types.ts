export type TriggerButtonCount = {
  general: number;
  severe: number;
};

export type WindowWithSpotlight = Window & {
  __spotlight?: {
    eventTarget?: EventTarget;
  };
};
