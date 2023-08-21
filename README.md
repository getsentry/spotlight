## Data Collection

Data needs pushed from an SDK into the Debugger. To do this we have a few constraints:

1. The Widget _must_ be pull-based, as theres no way for it to accept push data natively. We're using _Server Sent Events_ for this.
2. The SDK needs access to a sidecar in order to setup a push-based stream to power SSE. 
3. The SDK will send all events to this local sidecar, and the widget will connect to it to receive events.


