Data needs pushed from an SDK into the Debugger. To do this we have a few constraints:

1. The Widget _must_ be pull-based, as theres no way for it to accept push data natively. We're using _Server Sent Events_ for this.
2. The SDK needs access to a sidecar in order to setup a push-based stream to power SSE. 
3. The SDK will send all events to this local sidecar, and the widget will connect to it to receive events.

Theres a race condition for when its running and when the UI connects. That could be ok as long as the sidecar maintains a ring buffer backlog (TODO).

The widget is an embeddable React application. It's currently using Tailwind which wouldn't work in prod without using an IFRAME (which would mean the sidecar has to render the iframe _in addition_ to the framework loading the trigger JS). Both the debugger and the trigger could be embedded from the same sidecar, which means the sidecar could be implemented per-language with a simple JS shim that also gets bundled (either via CDN or packaged locally, maybe both?).

