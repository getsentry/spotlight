Data needs pushed from an SDK into the Debugger. To do this we have a few constraints:

1. The Widget _must_ be pull-based, as theres no way for it to accept push data natively. We're using _Server Sent Events_ for this.
2. The SDK needs access to a sidecar in order to setup a push-based stream to power SSE. 
3. The SDK will send all events to this local sidecar, and the widget will connect to it to receive events.

Theres a race condition for when its running and when the UI connects. That could be ok as long as the sidecar maintains a ring buffer backlog (TODO).

The widget is an embeddable React application. It's currently using Tailwind which wouldn't work in prod without using an IFRAME (which would mean the sidecar has to render the iframe _in addition_ to the framework loading the trigger JS). Both the debugger and the trigger could be embedded from the same sidecar, which means the sidecar could be implemented per-language with a simple JS shim that also gets bundled (either via CDN or packaged locally, maybe both?).

## TODO

1. Multi service POC. Both for multiple python services as well as a JS intercept.

For multi sidecar what we could do is:

- Have the first process create a sidecar
- Pass sidecar connection info downstream via baggage
- Sub services funnel payloads back to the root sidecar, which then transfers them to the JS widget

2. Per-trace clustering. You've effectively got a stream open, but if the stream changes, that is, you SPA to another location (and the core trace ID changes) it should hide all old events. This is probably a way to navigate to a "list of traces captuerd", and it just defaults by showing the current one.

3. Some kind of pinning. There's a little bit of a confusing flow that would happen if you had multiple windows open, creating multiple requests. Or if you're on a shared env and multiple people are making requests. May be solvable via the trace clustering solution.

Another issue we've hit is the fact that we need various exposure to hooks:

1. Python was somewhat easy to hook in _capture_event

2. JavaScript is a nightmare, and requiers overrides in a number of spots. Somewhat easy in Node (extend _captureEvent or w/e). Browser is awful. Can't inject via integrations as integrations don't do a damn thing, and the only other way would be beforeSend (which probalby doesnt trigger).

3. Some events are not fully materialized event in captureEvent. For example, Node seems to be missing some things like timestamps and event_ids in transactions.

4. JS SDK seems to not pass baggage if DSN is not set.

5. JS SDK - why does captureCheckIn not call captureEvent? Its duplicating an enabled check. More malformed data.

6. Sentry's frontend is generating multiple trace IDs for what should be one trace (e.g. on the issues list load)

7. The parent span (e.g. the root span or root transaction span) is not present in the span tree.

8. Sampling would need to happen outside of the payload creation, so we can still get debug information locally and only apply sampling decisions to if we send data upstream or not.

Generally speaking we need:

- Better hooks, they're all half baked and incomplete
- A "event was fully processed" hook should exist in all SDKs.

Sidecar concerns:

- There's a race condition for when yuou connect to the sidecar, which means it needs to keep a buffer of events. That said, its possible to connect and get either 1) no events, 2) too old of events. We need to solve this one.

- Python implementation is hypothetically superior right now, but its got some issues w/ deadlocking the uwsgi process.
