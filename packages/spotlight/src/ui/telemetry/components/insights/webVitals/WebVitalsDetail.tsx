import { PERFORMANCE_SCORE_PROFILES } from "@spotlight/ui/telemetry/constants";
import { useSentryEvents } from "@spotlight/ui/telemetry/data/useSentryEvents";
import type {
  MetricScoreProps,
  MetricWeightsProps,
  SentryEventWithPerformanceData,
} from "@spotlight/ui/telemetry/types";
import { getFormattedDuration } from "@spotlight/ui/telemetry/utils/duration";
import Breadcrumbs from "@spotlight/ui/ui/breadcrumbs";
import { useParams } from "react-router-dom";
import { normalizePerformanceScore } from "../../../utils/webVitals";
import PerformanceChart from "./PerformanceChart";

const WebVitalsDetail = () => {
  const events = useSentryEvents();
  const { page } = useParams();

  let measurementEvent: SentryEventWithPerformanceData | undefined;
  for (const event of events) {
    if (event.event_id === page && event.measurements && event?.contexts?.trace?.op === "pageload") {
      const updatedEvent = { ...event };
      normalizePerformanceScore(updatedEvent, PERFORMANCE_SCORE_PROFILES);
      if (updatedEvent.measurements["score.total"] != null) {
        measurementEvent = updatedEvent as unknown as SentryEventWithPerformanceData;
        break;
      }
    }
  }

  if (page && measurementEvent) {
    const metricScore: MetricScoreProps = {
      fcpScore: Math.trunc(measurementEvent.measurements["score.fcp"].value * 100),
      lcpScore: Math.trunc(measurementEvent.measurements["score.lcp"].value * 100),
      fidScore: Math.trunc(measurementEvent.measurements["score.fid"].value * 100),
      clsScore: Math.trunc(measurementEvent.measurements["score.cls"].value * 100),
      ttfbScore: Math.trunc(measurementEvent.measurements["score.ttfb"].value * 100),
    };

    const metricWeights: MetricWeightsProps = {
      fcp: Math.trunc(measurementEvent.measurements["score.weight.fcp"].value * 100),
      lcp: Math.trunc(measurementEvent.measurements["score.weight.lcp"].value * 100),
      fid: Math.trunc(measurementEvent.measurements["score.weight.fid"].value * 100),
      cls: Math.trunc(measurementEvent.measurements["score.weight.cls"].value * 100),
      ttfb: Math.trunc(measurementEvent.measurements["score.weight.ttfb"].value * 100),
    };

    const totalScore: number = Math.trunc(measurementEvent.measurements["score.total"].value * 100);

    const projectScoreHeaders = [
      {
        id: "fcpScore",
        description: "First Contentful Paint",
        label: "FCP",
        score: measurementEvent.measurements?.fcp ? getFormattedDuration(measurementEvent.measurements.fcp.value) : "-",
      },
      {
        id: "lcpScore",
        description: "Largest Contentful Paint",
        label: "LCP",
        score: measurementEvent.measurements?.lcp ? getFormattedDuration(measurementEvent.measurements.lcp.value) : "-",
      },
      {
        id: "fidScore",
        description: "First Input Delay",
        label: "FID",
        score: measurementEvent.measurements?.fid ? getFormattedDuration(measurementEvent.measurements.fid.value) : "-",
      },
      {
        id: "clsScore",
        description: "Cumulative Layout Shift",
        label: "CLS",
        score: measurementEvent.measurements?.cls ? getFormattedDuration(measurementEvent.measurements.cls.value) : "-",
      },
      {
        id: "ttfbScore",
        description: "Time to First Byte",
        label: "TTFB",
        score: measurementEvent.measurements?.ttfb
          ? getFormattedDuration(measurementEvent.measurements.ttfb.value)
          : "-",
      },
    ];

    return (
      <>
        <Breadcrumbs
          crumbs={[
            {
              id: "webVitals",
              label: "Web Vitals",
              link: true,
              to: "/insights/webvitals",
            },
            {
              id: "performanceSummary",
              label: "Performance Summary",
              link: false,
            },
          ]}
        />
        <div className="w-full px-6">
          <div className="flex w-full items-center justify-center p-6">
            <PerformanceChart totalScore={totalScore} metricWeights={metricWeights} metricScore={metricScore} />
          </div>
          <div className="flex w-full flex-wrap justify-center gap-2">
            {projectScoreHeaders.map(header => (
              <div
                key={header.id}
                className="bg-primary-900 border-primary-400 flex w-80 flex-col items-center gap-4 rounded-lg border p-2 shadow-lg"
              >
                <span className="text-primary-300 text-base font-semibold">{header.label}</span>
                <span className="text-primary-300 text-sm font-light">{header.description}</span>
                <h2 className="text-primary-300 text-lg font-bold">{header.score ?? "-"}</h2>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }
  return <p className="text-primary-300 px-6 py-4">No measurement found.</p>;
};

export default WebVitalsDetail;
