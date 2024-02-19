import { React } from '@spotlightjs/spotlight';

function CustomTabContent() {
  React.useEffect(() => {
    console.log('custom tab content');
  }, []);
  return <div>Custom Tab Content</div>;
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
