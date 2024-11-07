import { React } from '@spotlightjs/spotlight';

function CustomTabContent() {
  React.useEffect(() => {
    console.log('custom tab content');
  }, []);
  // Cannot use JSX syntax here as NextJS React and Spotlight React are different!
  return React.createElement('div', null, 'Custom Tab Content');
}

export function customIntegration() {
  return {
    name: 'custom-integration',
    tabs: () => [
      {
        id: 'custom',
        title: 'Custom Integration',
        content: CustomTabContent,
      },
    ],
  };
}
