import { ReactComponent as AstroIcon } from 'platformicons/svg/astro.svg';
import { ReactComponent as DefaultIcon } from 'platformicons/svg/default.svg';
import { ReactComponent as DotNetIcon } from 'platformicons/svg/dotnet.svg';
import { ReactComponent as FirefoxIcon } from 'platformicons/svg/firefox.svg';
import { ReactComponent as ChromeIcon } from 'platformicons/svg/google.svg';
import { ReactComponent as JavaScriptIcon } from 'platformicons/svg/javascript.svg';
import { ReactComponent as PhpLaravelIcon } from 'platformicons/svg/laravel.svg';
import { ReactComponent as DotNetMauiIcon } from 'platformicons/svg/maui.svg';
import { ReactComponent as NestJsIcon } from 'platformicons/svg/nestjs.svg';
import { ReactComponent as NextJsIcon } from 'platformicons/svg/nextjs.svg';
import { ReactComponent as NodeIcon } from 'platformicons/svg/nodejs.svg';
import { ReactComponent as PhpIcon } from 'platformicons/svg/php.svg';
import { ReactComponent as PythonIcon } from 'platformicons/svg/python.svg';
import { ReactComponent as RemixIcon } from 'platformicons/svg/remix.svg';
import { ReactComponent as RubyIcon } from 'platformicons/svg/ruby.svg';
import { ReactComponent as SafariIcon } from 'platformicons/svg/safari.svg';
import { ReactComponent as PhpSymfonyIcon } from 'platformicons/svg/symfony.svg';
import type { SentryEvent } from '../types';

import type { ComponentPropsWithoutRef, ReactComponentElement } from 'react';

type Platform = 'python' | 'javascript' | 'node' | 'ruby' | 'csharp' | string;

type PlatformIconProps = ComponentPropsWithoutRef<'svg'> & {
  size?: number;
  platform?: Platform;
  event?: SentryEvent;
  height?: number;
  width?: number;
  title?: string;
};

type IconMap = Record<
  string,
  React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string;
    }
  >
>;

const BROWSER_ICON_MAP: IconMap = {
  Safari: SafariIcon,
  Chrome: ChromeIcon,
  Firefox: FirefoxIcon,
} as const;

const DefaultSDKIcon = DefaultIcon;
const SDK_ICON_MAP: IconMap = {
  'sentry.javascript.nextjs': NextJsIcon,
  'sentry.javascript.astro': AstroIcon,
  'sentry.javascript.remix': RemixIcon,
  'sentry.javascript.nestjs': NestJsIcon,
  ruby: RubyIcon,
  python: PythonIcon,
  javascript: JavaScriptIcon,
  node: NodeIcon,
  php: PhpIcon,
  'php.laravel': PhpLaravelIcon,
  'php.symfony': PhpSymfonyIcon,
  dotnet: DotNetIcon,
  'dotnet.maui': DotNetMauiIcon,
  csharp: DotNetIcon,
} as const;

export default function PlatformIcon({ platform, event, size = 42, title, ...props }: PlatformIconProps) {
  return (
    <WrappedIcon platform={platform} event={event} size={size} title={title} {...props}>
      <CorePlatformIcon platform={platform} event={event} size={size} title={title} {...props} />
    </WrappedIcon>
  );
}

function WrappedIcon({ event, size = 42, ...props }: PlatformIconProps) {
  const wrappedWidth = size / 3;
  const wrappedHeight = size / 3;

  return (
    <div className="relative">
      {props.children}
      <RuntimeIcon
        event={event}
        size={size}
        width={wrappedWidth}
        height={wrappedHeight}
        {...props}
        className="absolute bottom-1 right-1"
      />
    </div>
  );
}

function RuntimeIcon({
  event,
  size = 42,
  ...props
}: ComponentPropsWithoutRef<'svg'> & {
  size?: number;
  event?: SentryEvent;
  height?: number;
  width?: number;
  title?: string;
}) {
  const runtimeName = `${event?.contexts?.runtime?.name || ''}`;
  if (!runtimeName) return null;

  const runtimeTitle = `${runtimeName} ${event?.contexts?.runtime?.version}`;
  switch (runtimeName) {
    case 'node':
      return <NodeIcon title={runtimeTitle} width={size} height={size} {...props} />;
  }

  const browserName = `${event?.contexts?.browser?.name || ''}`;
  const browserTitle = `${browserName} ${event?.contexts?.browser?.version}`;

  const iconKey = Object.keys(BROWSER_ICON_MAP).find(browser => browserName.includes(browser));
  if (iconKey) {
    const Icon = BROWSER_ICON_MAP[iconKey];
    return <Icon title={browserTitle} width={size} height={size} {...props} />;
  }

  return null;
}

function CorePlatformIcon({ platform, event, size = 42, title, ...props }: PlatformIconProps) {
  const name = platform || event?.platform || 'unknown';
  const sdk = event?.sdk?.name || '';
  const newTitle = title ?? name;

  const iconName = Object.keys(SDK_ICON_MAP).find(name => sdk.startsWith(name)) as
    | keyof typeof SDK_ICON_MAP
    | undefined;

  if (iconName) {
    const Icon = SDK_ICON_MAP[iconName];
    return <Icon title={newTitle} width={size} height={size} {...props} />;
  }

  const Icon = SDK_ICON_MAP[name] ?? DefaultSDKIcon;
  return <Icon title={newTitle} width={size} height={size} {...props} />;
}
