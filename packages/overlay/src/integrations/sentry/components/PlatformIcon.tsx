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
  size,
  width = 42,
  height = 42,
  title,
  ...props
}: ComponentPropsWithoutRef<'svg'> & {
  size?: number;
  platform?: Platform;
  event?: SentryEvent;
  height?: number;
  width?: number;
  title?: string;
}) {
  const name = platform || event?.platform || 'unknown';
  switch (name) {
    case 'ruby':
      return <RubyIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
    case 'python':
      return <PythonIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
    case 'javascript.astro':
      return <AstroIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
    case 'javascript':
      return <JavaScriptIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
    case 'node':
      return <NodeIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
    case 'php':
      return <PhpIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
    case 'dotnet':
    case 'csharp': // event.platform is 'csharp'
      return <DotNetIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
    case 'dotnet.maui':
      return <DotNetMauiIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
    default:
      return <DefaultIcon title={title} width={size ?? width} height={size ?? height} {...props} />;
  }
}
