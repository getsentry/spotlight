import { ReactComponent as AstroIcon } from 'platformicons/svg/astro.svg';
import { ReactComponent as DefaultIcon } from 'platformicons/svg/default.svg';
import { ReactComponent as DotNetIcon } from 'platformicons/svg/dotnet.svg';
import { ReactComponent as JavaScriptIcon } from 'platformicons/svg/javascript.svg';
import { ReactComponent as DotNetMauiIcon } from 'platformicons/svg/maui.svg';
import { ReactComponent as NodeIcon } from 'platformicons/svg/nodejs.svg';
import { ReactComponent as PhpIcon } from 'platformicons/svg/php.svg';
import { ReactComponent as PythonIcon } from 'platformicons/svg/python.svg';
import { ReactComponent as RubyIcon } from 'platformicons/svg/ruby.svg';

import { SentryEvent } from '../types';

import { ComponentPropsWithoutRef } from 'react';

type Platform = 'python' | 'javascript' | 'node' | 'ruby' | 'csharp' | string;

export default function PlatformIcon({
  platform,
  event,
  size = 42,
  ...props
}: ComponentPropsWithoutRef<'svg'> & {
  size?: number;
  platform?: Platform;
  event?: SentryEvent;
}) {
  const name = platform || event?.platform || 'unknown';
  switch (name) {
    case 'ruby':
      return <RubyIcon width={size} height={size} {...props} />;
    case 'python':
      return <PythonIcon width={size} height={size} {...props} />;
    case 'javascript.astro':
      return <AstroIcon width={size} height={size} {...props} />;
    case 'javascript':
      return <JavaScriptIcon width={size} height={size} {...props} />;
    case 'node':
      return <NodeIcon width={size} height={size} {...props} />;
    case 'php':
      return <PhpIcon width={size} height={size} {...props} />;
    case 'dotnet':
    case 'csharp': // event.platform is 'csharp'
      return <DotNetIcon width={size} height={size} {...props} />;
    case 'dotnet.maui':
      return <DotNetMauiIcon width={size} height={size} {...props} />;
    default:
      return <DefaultIcon width={size} height={size} {...props} />;
  }
}
