---
title: Write your own Integration
description: A guide how to write a Spotlight Integration
sidebar:
  label: 'Building an Integration'
  order: 999
---

An integration in Spotlight is rather powerful. It can completely change the behavior, add, remove functionality from
Spotlight.

By default, Spotlight really only is a slim skeleton for configured integrations. The minimal configuration of an
integration has to have is and name and a version.

## Integration Ordering

All integrations are run in the order that they are configured. For instance, for the array `[sentry(), astro()]` in the
`init` call, `sentry()` will run before `astro()` and astro might overwrite things perviously configured.

Your integration should ideally run in any order. If this isn’t possible, we recommend documenting that your integration
needs to come first or last in your user’s integrations configuration array.
