import type { WebVitals } from "../constants";
export { calculateCdfScore, calculateCdfSigma, normalizePerformanceScore } from "../../../telemetry/utils/webVitals.ts";

export function calculateLabelCoordinates(
  size: number,
  x: number,
  y: number,
  barWidth: number,
  metricWeights: {
    [key in WebVitals]: number;
  },
  labelWidthPadding: number,
  labelHeightPadding: number,
  radiusPadding: number,
) {
  const radius = size / 2 + barWidth + radiusPadding;
  const center = {
    x: x + size / 2 - labelWidthPadding / 2,
    y: y + size / 2 + labelHeightPadding / 2,
  };
  const sumMaxValues = Object.values(metricWeights).reduce((acc, val) => acc + val, 0);
  const BASE_ANGLE = -90;
  const weightToAngle = (weight: number) => (weight / sumMaxValues) * 360;
  const [lcpAngle, fcpAngle, fidAngle, clsAngle, ttfbAngle] = [
    metricWeights.lcp,
    metricWeights.fcp,
    metricWeights.fid,
    metricWeights.cls,
    metricWeights.ttfb,
  ].map(weightToAngle);
  const lcpX = center.x + radius * Math.cos(((BASE_ANGLE + lcpAngle / 2) * Math.PI) / 180);
  const lcpY = center.y + radius * Math.sin(((BASE_ANGLE + lcpAngle / 2) * Math.PI) / 180);
  const fcpX = center.x + radius * Math.cos(((BASE_ANGLE + lcpAngle + fcpAngle / 2) * Math.PI) / 180);
  const fcpY = center.y + radius * Math.sin(((BASE_ANGLE + lcpAngle + fcpAngle / 2) * Math.PI) / 180);
  const fidX = center.x + radius * Math.cos(((BASE_ANGLE + lcpAngle + fcpAngle + fidAngle / 2) * Math.PI) / 180);
  const fidY = center.y + radius * Math.sin(((BASE_ANGLE + lcpAngle + fcpAngle + fidAngle / 2) * Math.PI) / 180);
  const clsX =
    center.x + radius * Math.cos(((BASE_ANGLE + lcpAngle + fcpAngle + fidAngle + clsAngle / 2) * Math.PI) / 180);
  const clsY =
    center.y + radius * Math.sin(((BASE_ANGLE + lcpAngle + fcpAngle + fidAngle + clsAngle / 2) * Math.PI) / 180);
  // Padding hack for now since ttfb label is longer than the others
  const ttfbX =
    center.x -
    12 +
    radius * Math.cos(((BASE_ANGLE + lcpAngle + fcpAngle + fidAngle + clsAngle + ttfbAngle / 2) * Math.PI) / 180);
  const ttfbY =
    center.y +
    radius * Math.sin(((BASE_ANGLE + lcpAngle + fcpAngle + fidAngle + clsAngle + ttfbAngle / 2) * Math.PI) / 180);

  return {
    lcpX,
    lcpY,
    fcpX,
    fcpY,
    fidX,
    fidY,
    clsX,
    clsY,
    ttfbX,
    ttfbY,
  };
}
