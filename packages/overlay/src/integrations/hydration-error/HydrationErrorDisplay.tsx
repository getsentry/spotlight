import beautify from 'beautify';
import { useEffect, useState } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import { log } from '~/lib/logger';

type WindowWithHydrationOverlay = Window & {
  BUILDER_HYDRATION_OVERLAY: {
    SSR_HTML: string | undefined;
    CSR_HTML: string | undefined;
    ERROR: boolean | undefined;
    APP_ROOT_SELECTOR: string;
  };
};

const _window = window as unknown as WindowWithHydrationOverlay;

export default function HydrationErrorDisplay() {
  const [SSRHtml, setSSRHtml] = useState('');
  const [CSRHtml, setCSRHtml] = useState('');
  const [isStyleSheetAdded, setIsStyleSheetAdded] = useState(false);

  const shadowRoot = document.getElementById('sentry-spotlight-root')?.shadowRoot;
  const isHydrationError = _window.BUILDER_HYDRATION_OVERLAY.ERROR;
  const ssrHtml = _window.BUILDER_HYDRATION_OVERLAY.SSR_HTML;
  const newCSRHtml = _window.BUILDER_HYDRATION_OVERLAY.CSR_HTML;

  const checkAndAddStyleSheet = () => {
    if (isStyleSheetAdded) {
      return true;
    }
    const head = document.head;
    const styleTags = head.querySelectorAll('style');
    const emotionDiffStyleTags = Array.from(styleTags).filter(styleTag => {
      return styleTag.getAttribute('data-emotion');
    });

    const newStylesheet = new CSSStyleSheet();
    const stylesheetContent = Array.from(emotionDiffStyleTags)
      .map(styleTag => styleTag.innerHTML)
      .join('\n');

    newStylesheet.replaceSync(stylesheetContent);

    if (
      shadowRoot &&
      shadowRoot.adoptedStyleSheets &&
      !(shadowRoot.adoptedStyleSheets.indexOf(newStylesheet) >= 0) &&
      emotionDiffStyleTags.length > 0
    ) {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, newStylesheet];
      setIsStyleSheetAdded(true);
      return true;
    }
    return false;
  };
  useEffect(() => {
    if (!_window.BUILDER_HYDRATION_OVERLAY) {
      log('No hydration error found. Make sure you are using @builder.io/react-hydration-overlay');
      return;
    }

    if (!ssrHtml || !newCSRHtml || !checkAndAddStyleSheet()) return;

    const newSSR = beautify(ssrHtml, { format: 'html' });
    setSSRHtml(newSSR);
    const newCSR = beautify(newCSRHtml, { format: 'html' });
    setCSRHtml(newCSR);
  }, [ssrHtml, newCSRHtml, isHydrationError]);

  const newStyles = {
    variables: {
      dark: {
        diffViewerBackground: 'transparent',
        addedBackground: 'transparent',
        removedBackground: 'transparent',
        wordAddedBackground: '#055d67',
        wordRemovedBackground: '#7d383f',
        addedGutterBackground: 'transparent',
        removedGutterBackground: 'transparent',
        gutterBackground: 'transparent',
        codeFoldBackground: 'transparent',
        emptyLineBackground: 'transparent',
        diffViewerTitleBorderColor: 'transparent',
        highlightBackground: 'transparent',
        highlightGutterBackground: 'transparent',
        codeFoldGutterBackground: 'transparent',
        gutterBackgroundDark: 'transparent',
      },
    },
  };

  if (!_window.BUILDER_HYDRATION_OVERLAY) {
    return (
      <div className="text-primary-300 px-6 py-4">
        No hydration error found. Make sure you are using @builder.io/react-hydration-overlay
      </div>
    );
  }
  if (isHydrationError) {
    return (
      <div className="hydration-error-wrapper relative w-full overflow-x-auto">
        <ReactDiffViewer
          styles={newStyles}
          oldValue={SSRHtml}
          newValue={CSRHtml}
          leftTitle={isStyleSheetAdded ? 'Server-Side Render' : ''}
          rightTitle={isStyleSheetAdded ? 'Client-Side Render' : ''}
          compareMethod={DiffMethod.WORDS}
          useDarkTheme
        />
      </div>
    );
  }
  return <div className="text-primary-300 px-6 py-4">No Hydration error found.</div>;
}
