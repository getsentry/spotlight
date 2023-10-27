import { init } from "./index.tsx";
import type { Integration } from "./integrations/integration.ts";


const testIntegration = {
    name: 'test',
    processEvent: async ({data}) => {
        // if (!contentType) {
        //     return true;
        // }
        return {foo: data};
    },
    tabs: [
        {
            name: 'Tab 1',
            content: ({integrationData}) => <div>{integrationData[''].map(d => d.foo)}</div>
        }
    ]
} satisfies Integration<{foo: string}>;


init({ fullScreen: true, integrations: [testIntegration] });

