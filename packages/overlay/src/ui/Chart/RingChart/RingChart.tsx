import type { ReactNode } from 'react';
import { useMemo } from 'react';
import classNames from '~/lib/classNames';

type Props = React.HTMLAttributes<SVGSVGElement> & {
  backgroundColors: string[];
  maxValues: number[];
  segmentColors: string[];
  text: React.ReactNode;
  values: number[];
  /**
   * The width of the progress ring bar
   */
  barWidth?: number;
  onHoverActions?: (() => void)[];
  onUnhover?: () => void;
  /**
   * Endcaps on the progress bar
   */
  progressEndcaps?: React.SVGAttributes<SVGCircleElement>['strokeLinecap'];
  size?: number;
  /**
   * The css to apply to the center text. A function may be provided to compute
   * styles based on the state of the progress bar.
   */
  textCss?: string;
  x?: number;
  y?: number;
};

const BASE_ROTATE = -90;
const PADDING = 1;

function RingChart({
  values,
  maxValues,
  size = 20,
  barWidth = 3,
  text,
  textCss,
  segmentColors,
  backgroundColors,
  progressEndcaps,
  onHoverActions,
  onUnhover,
  ...p
}: Props) {
  const foreignObjectSize = size / 2;
  const foreignObjectOffset = size / 4;

  const radius = size / 2 - barWidth / 2;
  const circumference = 2 * Math.PI * radius;

  const rings = useMemo<ReactNode[]>(() => {
    const sumMaxValues = maxValues.reduce((acc, val) => acc + val, 0);
    let currentRotate = BASE_ROTATE;

    return maxValues.flatMap((maxValue, index) => {
      const boundedValue = Math.min(Math.max(values[index], 0), maxValue);
      const ringSegmentPadding = values.length > 1 ? PADDING : 0;
      const maxOffset = (1 - Math.max(maxValue - ringSegmentPadding, 0) / sumMaxValues) * circumference;
      const progressOffset = (1 - Math.max(boundedValue - ringSegmentPadding, 0) / sumMaxValues) * circumference;
      const rotate = currentRotate;
      currentRotate += (360 * maxValue) / sumMaxValues;

      const cx = radius + barWidth / 2;
      const key = `${cx}-${backgroundColors[index]}-${segmentColors[index]}`;

      return [
        <circle
          key={`ring-bg-${key}`}
          strokeDashoffset={maxOffset}
          r={radius}
          cx={cx}
          cy={cx}
          onMouseOver={() => onHoverActions?.[index]()}
          onMouseLeave={() => onUnhover?.()}
          className={classNames(backgroundColors[index])}
          style={{
            fill: 'none',
            strokeWidth: barWidth,
            strokeDasharray: `${circumference} ${circumference}`,
            transform: `rotate(${rotate}deg)`,
            transformOrigin: '50% 50%',
            transition: `stroke 300ms`,
          }}
        />,
        <circle
          key={`ring-bar-${key}`}
          strokeDashoffset={progressOffset}
          strokeLinecap={progressEndcaps}
          r={radius}
          cx={cx}
          cy={cx}
          onMouseOver={() => onHoverActions?.[index]()}
          onMouseLeave={() => onUnhover?.()}
          className={classNames(segmentColors[index])}
          style={{
            fill: 'none',
            strokeWidth: barWidth,
            strokeDasharray: `${circumference} ${circumference}`,
            transform: `rotate(${rotate}deg)`,
            transformOrigin: '50% 50%',
            transition: `stroke 300ms, stroke-dashoffset 300ms`,
          }}
        />,
      ];
    });
  }, [
    backgroundColors,
    barWidth,
    circumference,
    maxValues,
    onHoverActions,
    onUnhover,
    progressEndcaps,
    radius,
    segmentColors,
    values,
  ]);

  return (
    <svg className="relative" role="img" height={radius * 2 + barWidth} width={radius * 2 + barWidth} {...p}>
      {rings}
      <foreignObject
        height={foreignObjectSize}
        width={foreignObjectSize}
        x={foreignObjectOffset}
        y={foreignObjectOffset}
      >
        {text !== undefined ? (
          <div
            className={classNames(
              'text-primary-100 flex h-full w-full items-center justify-center text-xl font-bold',
              textCss,
            )}
          >
            {text}
          </div>
        ) : null}
      </foreignObject>
    </svg>
  );
}

export default RingChart;
