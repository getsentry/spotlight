import { cn } from "@spotlight/ui/lib/cn";
import type { MetricScoreProps, MetricWeightsProps } from "@spotlight/ui/telemetry/types";
import { calculateLabelCoordinates } from "@spotlight/ui/telemetry/utils/webVitals";
import RingChart from "@spotlight/ui/ui/ringChart";
import { useRef, useState } from "react";
import type { WebVitals } from "../../../constants";
import useMouseTracking from "../../../hooks/useMouseTracking";

type Coordinates = {
  x: number;
  y: number;
};

type WebVitalsLabelCoordinates = {
  [p in WebVitals]?: Coordinates;
};

type WebVitalLabelProps = {
  coordinates: Coordinates;
  inPerformanceWidget?: boolean;
  webVital: WebVitals;
  labelCoordinates?: WebVitalsLabelCoordinates;
};

function WebVitalLabel({ webVital, coordinates, labelCoordinates = {} }: WebVitalLabelProps) {
  const xOffset = labelCoordinates?.[webVital]?.x ?? 0;
  const yOffset = labelCoordinates?.[webVital]?.y ?? 0;
  return (
    <text
      className="fill-primary-200 stroke-primary-200 uppercase"
      x={coordinates.x + xOffset}
      y={coordinates.y + yOffset}
    >
      {webVital}
    </text>
  );
}

type PerformanceChartProps = {
  metricScore: MetricScoreProps;
  metricWeights: MetricWeightsProps;
  totalScore?: number;
  size?: number;
  barWidth?: number;
  left?: number;
  top?: number;
  labelWidthPadding?: number;
  labelHeightPadding?: number;
  radiusPadding?: number;
};

const PerformanceChart = ({
  metricScore,
  metricWeights,
  totalScore,
  size = 200,
  barWidth = 25,
  left = 40,
  top = 25,
  labelWidthPadding = 28,
  labelHeightPadding = 14,
  radiusPadding = 4,
}: PerformanceChartProps) => {
  const [webVitalTooltip, setWebVitalTooltip] = useState<WebVitals | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseTrackingProps = useMouseTracking({
    elem: containerRef,
    onPositionChange: args => {
      if (args) {
        const { left, top } = args;
        setMousePosition({ x: left, y: top });
      }
    },
  });

  const { lcpX, lcpY, fcpX, fcpY, fidX, fidY, clsX, clsY, ttfbX, ttfbY } = calculateLabelCoordinates(
    size,
    left,
    top,
    barWidth,
    metricWeights,
    labelWidthPadding,
    labelHeightPadding,
    radiusPadding,
  );
  return (
    <div ref={containerRef} {...mouseTrackingProps}>
      {webVitalTooltip && (
        <div
          className={cn(
            "bg-primary-900 border-primary-400 absolute flex w-40 items-center justify-between rounded-lg border p-3 shadow-lg",
          )}
          style={{
            transform: `translate3d(${mousePosition.x - 100}px, ${mousePosition.y - 74}px, 0px)`,
          }}
        >
          <span className="text-primary-200">{`${webVitalTooltip.toUpperCase()} Score:`}</span>
          <span className="text-primary-200 font-semibold">{metricScore[`${webVitalTooltip}Score`]}</span>
        </div>
      )}

      <svg height={size + 3 * top} width={size + 3 * left}>
        <title>Performance Chart showing Core Web Vitals metrics</title>
        <>
          {metricWeights.lcp > 0 && (
            <WebVitalLabel
              webVital="lcp"
              coordinates={{
                x: lcpX,
                y: lcpY,
              }}
            />
          )}
          {metricWeights.fcp > 0 && (
            <WebVitalLabel
              webVital="fcp"
              coordinates={{
                x: fcpX,
                y: fcpY,
              }}
            />
          )}
          {metricWeights.fid > 0 && (
            <WebVitalLabel
              webVital="fid"
              coordinates={{
                x: fidX,
                y: fidY,
              }}
            />
          )}
          {metricWeights.cls > 0 && (
            <WebVitalLabel
              webVital="cls"
              coordinates={{
                x: clsX,
                y: clsY,
              }}
            />
          )}
          {metricWeights.ttfb > 0 && (
            <WebVitalLabel
              webVital="ttfb"
              coordinates={{
                x: ttfbX,
                y: ttfbY,
              }}
            />
          )}
        </>

        <RingChart
          values={[
            (metricScore.lcpScore ?? 0) * metricWeights.lcp * 0.01,
            (metricScore.fcpScore ?? 0) * metricWeights.fcp * 0.01,
            (metricScore.fidScore ?? 0) * metricWeights.fid * 0.01,
            (metricScore.clsScore ?? 0) * metricWeights.cls * 0.01,
            (metricScore.ttfbScore ?? 0) * metricWeights.ttfb * 0.01,
          ]}
          maxValues={[metricWeights.lcp, metricWeights.fcp, metricWeights.fid, metricWeights.cls, metricWeights.ttfb]}
          text={totalScore}
          size={size}
          barWidth={barWidth}
          segmentColors={[
            "stroke-primary-300",
            "stroke-primary-400",
            "stroke-primary-500",
            "stroke-primary-600",
            "stroke-primary-700",
          ]}
          backgroundColors={[
            "stroke-gray-400",
            "stroke-gray-400",
            "stroke-gray-400",
            "stroke-gray-400",
            "stroke-gray-400",
          ]}
          x={left}
          y={top}
          onHoverActions={[
            () => setWebVitalTooltip("lcp"),
            () => setWebVitalTooltip("fcp"),
            () => setWebVitalTooltip("fid"),
            () => setWebVitalTooltip("cls"),
            () => setWebVitalTooltip("ttfb"),
          ]}
          onBlur={() => setWebVitalTooltip(null)}
        />
      </svg>
    </div>
  );
};

export default PerformanceChart;
