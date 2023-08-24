# Spotlight

Spotlight is Sentry for Development. Inspired by an old project that I worked on (Django Debug Toolbar), Spotlight brings a rich debug overlay into development environments, and it does it by leveraging the existing power of Sentry's SDKs.

At a high level, Spotlight consists of three projects:

1. An JavaScript overlay that renders inside of your application. The overlay is a simple npm package, and can seamlessly run in any web application (or even independently!).

2. A proxy server which which enables push-based communication to the overlay. This is achieved via a simple HTTP relay, allowing SDKs to push events to it (even without a DSN being configured!), and allow the overlay to receive events using an event stream.

3. A variety of SDK changes, enabling the SDK to fully manifest events and envelopes even when the DSN is not set. This means SDKs generate a full production-grade payload of their data all the time, and when spotlight is enabled (e.g. in dev) those get fired off. 

To adopt Spotlight, a customer would only need to load the dependency in their application:

```shell
npm add sentry-spotlight
```

```typescript
import * as Spotlight from "sentry-spotlight";
Spotlight.init();
```

That's it! A data relay will automatically launch from one of the SDKs, and all available SDKs will communicate with it. No configuration is required at the SDK level.

The overlay itself behaves a little differently from Sentry. That's intentional both because this is for local development, but also because we don't believe our production implementation of certain components is our final implementation.

Ruight now the overlay consists of three components:

- Errors - very similar to Sentry
- Traces - all transactions get clustered into a trace view, othewrise similar to Sentry
- SDKs - simple data on which SDKs have streamed events up

We do not render Replays, Profiling data, or Attachments currently. Profiles and Attachments feel useful, Replays less so unless you're running a remote/headless UI.

## Zero to One

To make this production grade there's a number of changes we'd want to make.

First and foremost is how the relay works. Currently there is a sidecar implemented in both sentry-javascript and sentry-python. Whoever gets the port first wins. The implementations are independent (desirable for compatibility), but are also not equal.

The next issue we see on the relay is that its always-on. Its a little odd behaviorally that a web server is launching when, for example, you are simply running a CLI command. This could be resolved by making the relay lazy, but if the relay is lazy it _must_ buffer data. Per the first problem, the relays do not implement this uniformly at the moment.

Third is how the SDKs communicate with the Relay. Its just assumed its always available on `:8969`. That obviously wouldn't be true, and the main concern is making sure its only pushed to, and only running when we're in a development environment (how do we detect that?).

On the same front of SDK communication, we'd want to pass the relay information (the port, if its active) downstream via baggage. Its ok for SDKs to attempt to auto discover it, but it'd be a lot more reliable if our trace baggage contained the relay connection information.

For the overlay there's also a number of improvements that we'd like to make:

- Cluster similar events together, primarily visually. You might hit 40 "resource not found" errors, and while you may want to look at that, it makes navigating the UI quite difficult.

- SDKs could contain more information, such as the process they're running under, the number of events received, and meta configuration (release, environment, etc). They could also guide you on how to send data to Sentry (e.g. set the DSN).

- More debug information would be useful locally. Take a look at Django's error page - it contains information around the HTTP request headers, environment configuration, and other settings. We could enable those kinds of debug experiences from the SDK and lock them to only working with Spotlight. Some of this should be available within the trace, and could just need better exposure.

- Framework native integration. The overlay already supports the concept of "fullscreen by default", which means we could hook some frameworks error pages and simply load Spotlight in place of their existing (or non-existant) error page.

## Technical Notes

There's some interesting choices I made, and I learned along the way.

### CSS Scoping

Because this is an embedded overlay we needed to scope styles to only our code, and at the same time we needed to make sure the parent document didn't impact us. To do this we're using a [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM). This allows us to fully render all of our components, our styles (which is just [Tailwind](https://tailwindcss.com/)!), inside of what might as well be considered an iframe.

### Relay Sidecar

The relay has a bunch of challenges to make it work:

- It should be invisible to the user, thus it launches from the SDKs themselves. This also means it could attempt to launch multiple processes.

- It needs to be seamless, meaning we can't install a sidecar that requires a Python runtime if we're using Node.

- It needs to cleanly start up and shutdown - this proved annoying in Python (and doesnt cleanly shut down).

- It needs to both buffer events to deal w/ the async nature of when the overlay loads, but also expire events so future loads arent filled with previous requests. This could be made a lot better with some kind of session ID (or if traces were more encapsulated) so you could auto hide prior sessions.

In the end I ended up with a variation of a circular buffer for keeping events around, using a time-based expiration to ensure only recent events were pushed out.

### Data Quality

If anything, this project has showcased the importance of data quality. While our error data is generally good, there's a number of areas for improvement, some of which are extermely critical.

#### JavaScript

- We inject browser related instrumentation as faux spans, except those spans are not accurate. e.g. the "browser.request" span will show up _after_ the server has received and hydrated the request. Traces need to _look_ correct, and this not only doesnt _look_ correct, but it isn't. 

- What is and isnt a trace is extremely confusing once you start rendering full traces. When does a trace end? More importantly than that, when does it start? For example, when I click a link on the page, the trace is still going, but once the browser receives the navigation it creates a new trace.

- There are a lot of cases where we fail to achieve a parent (root) transaction, meaning we're left with a bunch of siblings that have to be clustered together. This shouldn't happen, and happens even in Remix where we have end-to-end instrumentation available to us.

- Various data is missing. I patched the SDK a bunch to materialize as much of the payload as I could, but for example the `status` attribute is sometimes not persent on transactions.

- Within errors, filenames are illegible. We do not strip prefixes in any situation so we're left with long absolute paths for application-relative code. This problem is even worse with node packages (and subpackages). Example of app-local code:

```shell 
# what Sentry shows as filename
/home/dcramer/src/peated/apps/api/src/routes/triggerSentry.tsx

# This would be better
src/peated/apps/api/src/routes/triggerSentry.tsx

# This would be best, and accurate
~/src/routes/triggerSentry.tsx
```

- When you stitch together a full trace you see a lot of gaps. One of the biggest is "what service is this". We do not have names of services, process names, or any other kind of identifying information exposed.

- Orphan spans exist from setTimeout calls (no parent, but valid trace)

## Notes from Development

(this is a loose collection of scribbles I made while building the POC)

Data needs pushed from an SDK into the Debugger. To do this we have a few constraints:

1. The Widget _must_ be pull-based, as theres no way for it to accept push data natively. We're using _Server Sent Events_ for this.
2. The SDK needs access to a sidecar in order to setup a push-based stream to power SSE. 
3. The SDK will send all events to this local sidecar, and the widget will connect to it to receive events.

Theres a race condition for when its running and when the UI connects. That could be ok as long as the sidecar maintains a ring buffer backlog (TODO).

The widget is an embeddable React application. It's currently using Tailwind which wouldn't work in prod without using an IFRAME (which would mean the sidecar has to render the iframe _in addition_ to the framework loading the trigger JS). Both the debugger and the trigger could be embedded from the same sidecar, which means the sidecar could be implemented per-language with a simple JS shim that also gets bundled (either via CDN or packaged locally, maybe both?).

### TODO

1. Multi service POC. Both for multiple python services as well as a JS intercept.

For multi sidecar what we could do is:

- Have the first process create a sidecar
- Pass sidecar connection info downstream via baggage
- Sub services funnel payloads back to the root sidecar, which then transfers them to the JS widget

2. Per-trace clustering. You've effectively got a stream open, but if the stream changes, that is, you SPA to another location (and the core trace ID changes) it should hide all old events. This is probably a way to navigate to a "list of traces captuerd", and it just defaults by showing the current one.

3. Some kind of pinning. There's a little bit of a confusing flow that would happen if you had multiple windows open, creating multiple requests. Or if you're on a shared env and multiple people are making requests. May be solvable via the trace clustering solution.

Another issue we've hit is the fact that we need various exposure to hooks:

1. ~Python was somewhat easy to hook in _capture_event~. We're now hooking the envelope endpoints. Python still easy.

2. JavaScript is a nightmare, and requiers overrides in a number of spots. Somewhat easy in Node (extend _captureEvent or w/e). Browser is awful. Can't inject via integrations as integrations don't do a damn thing, and the only other way would be beforeSend (which probalby doesnt trigger).

3. Some events are not fully materialized event in captureEvent. For example, Node seems to be missing some things like timestamps and event_ids in transactions.

4. JS SDK seems to not pass baggage if DSN is not set.

5. JS SDK - why does captureCheckIn not call captureEvent? Its duplicating an enabled check. More malformed data.

6. Sentry's frontend is generating multiple trace IDs for what should be one trace (e.g. on the issues list load)

7. The parent span (e.g. the root span or root transaction span) is not present in the span tree.

8. Sampling would need to happen outside of the payload creation, so we can still get debug information locally and only apply sampling decisions to if we send data upstream or not.

9. Attachments are probably not parsed correclty out of the Envelope. Docs are quite complex to read.

10. When you navigate to a new page in Remix its creating a transaction coupled to the prior trace (the origin load), and upon navigation creates a new trace. I'm not sure I'd expect this behavior.

Generally speaking we need:

- Better hooks, they're all half baked and incomplete
- A "event was fully processed" hook should exist in all SDKs.

Sidecar concerns:

- There's a race condition for when yuou connect to the sidecar, which means it needs to keep a buffer of events. That said, its possible to connect and get either 1) no events, 2) too old of events. We need to solve this one.

- Python implementation is hypothetically superior right now, but its got some issues w/ deadlocking the uwsgi process.


### Setup POC

Pull down `sentry-python` (most up to date sidecar implementation)

```shell
git clone git@github.com:getsentry/sentry-python.git ~/src/sentry-python
cd ~/src/sentry-python
git checkout feat/hackweek-2023-spotlight
```

If you **are using the Python SDK** simply symlink the SDK into your project:

```shell
cd ~/src/myproject
pip install -e ~/src/sentry-python
```

If you **not using the Python SDK** in your app, run the sidecar manually:

```shell
cd ~/src/sentry-python
python sentry_sdk/spotlight.py &
```

If you **are using the JavaScript SDK** in your app, setup the repo similarly within your project:

```shell
git clone git@github.com:getsentry/sentry-python.git ~/src/sentry-python
cd ~/src/sentry-python
git checkout feat/hackweek-2023-spotlight
```

Note: `sentry-python` has the most functional sidecar implementation currently. Both SDKs automatically attempt to keep a sidecar running, so its a race to whomever claims the port.

Lastly, add Spotlight to your app:

```ts
import * as Spotlight from "sentry-spotlight";
Spotlight.init();
```
