import { useParams } from 'react-router-dom';
import { PERFORMANCE_SCORE_PROFILES } from '~/integrations/sentry/constants';
import { useSentryEvents } from '~/integrations/sentry/data/useSentryEvents';
import type { MetricScoreProps, MetricWeightsProps, SentryEventWithPerformanceData } from '~/integrations/sentry/types';
import { getFormattedDuration } from '~/integrations/sentry/utils/duration';
import Breadcrumbs from '~/ui/breadcrumbs';
import { normalizePerformanceScore } from '../../../utils/webVitals';
import PerformanceChart from './PerformanceChart';

const WebVitalsDetail = () => {
  const events = useSentryEvents();
  const { page } = useParams();
  const measurementEvents: SentryEventWithPerformanceData[] = [];

  events
    .filter(event => event.event_id === page)
    .map(event => {
      const updatedEvent = { ...event };
      normalizePerformanceScore(updatedEvent, PERFORMANCE_SCORE_PROFILES);
      measurementEvents.push(updatedEvent as unknown as SentryEventWithPerformanceData);
    });

  if (page && measurementEvents.length) {
    const metricScore: MetricScoreProps = {
      fcpScore: Math.trunc(measurementEvents[0].measurements['score.fcp'].value * 100),
      lcpScore: Math.trunc(measurementEvents[0].measurements['score.lcp'].value * 100),
      fidScore: Math.trunc(measurementEvents[0].measurements['score.fid'].value * 100),
      clsScore: Math.trunc(measurementEvents[0].measurements['score.cls'].value * 100),
      ttfbScore: Math.trunc(measurementEvents[0].measurements['score.ttfb'].value * 100),
    };

    const metricWeights: MetricWeightsProps = {
      fcp: Math.trunc(measurementEvents[0].measurements['score.weight.fcp'].value * 100),
      lcp: Math.trunc(measurementEvents[0].measurements['score.weight.lcp'].value * 100),
      fid: Math.trunc(measurementEvents[0].measurements['score.weight.fid'].value * 100),
      cls: Math.trunc(measurementEvents[0].measurements['score.weight.cls'].value * 100),
      ttfb: Math.trunc(measurementEvents[0].measurements['score.weight.ttfb'].value * 100),
    };

    const totalScore: number = Math.trunc(measurementEvents[0].measurements['score.total'].value * 100);

    const projectScoreHeaders = [
      {
        id: 'fcpScore',
        description: 'First Contentful Paint',
        label: 'FCP',
        score: measurementEvents[0].measurements?.fcp
          ? getFormattedDuration(measurementEvents[0].measurements.fcp.value)
          : '-',
      },
      {
        id: 'lcpScore',
        description: 'Largest Contentful Paint',
        label: 'LCP',
        score: measurementEvents[0].measurements?.lcp
          ? getFormattedDuration(measurementEvents[0].measurements.lcp.value)
          : '-',
      },
      {
        id: 'fidScore',
        description: 'First Input Delay',
        label: 'FID',
        score: measurementEvents[0].measurements?.fid
          ? getFormattedDuration(measurementEvents[0].measurements.fid.value)
          : '-',
      },
      {
        id: 'clsScore',
        description: 'Cumulative Layout Shift',
        label: 'CLS',
        score: measurementEvents[0].measurements?.cls
          ? getFormattedDuration(measurementEvents[0].measurements.cls.value)
          : '-',
      },
      {
        id: 'ttfbScore',
        description: 'Time to First Byte',
        label: 'TTFB',
        score: measurementEvents[0].measurements?.ttfb
          ? getFormattedDuration(measurementEvents[0].measurements.ttfb.value)
          : '-',
      },
    ];

    return (
      <>
        <Breadcrumbs
          crumbs={[
            {
              id: 'webVitals',
              label: 'Web Vitals',
              link: true,
              to: '/insights/webvitals',
            },
            {
              id: 'performanceSummary',
              label: 'Performance Summary',
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
                <h2 className="text-primary-300 text-lg font-bold">{header.score ?? '-'}</h2>
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
