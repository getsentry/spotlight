import { z } from "zod";

export const FrameInterface = z
  .object({
    filename: z.string().nullable(),
    function: z.string().nullable(),
    lineNo: z.number().nullable(),
    colNo: z.number().nullable(),
    absPath: z.string().nullable(),
    module: z.string().nullable(),
    // lineno, source code
    context: z.array(z.tuple([z.number(), z.string()])),
    inApp: z.boolean().optional(),
    vars: z.record(z.string(), z.unknown()).optional(),
  })
  .partial();

// XXX: Sentry's schema generally speaking is "assume all user input is missing"
// so we need to handle effectively every field being optional or nullable.
export const ExceptionInterface = z
  .object({
    mechanism: z
      .object({
        type: z.string().nullable(),
        handled: z.boolean().nullable(),
      })
      .partial(),
    type: z.string().nullable(),
    value: z.string().nullable(),
    stacktrace: z.object({
      frames: z.array(FrameInterface),
    }),
  })
  .partial();

export const ErrorEntrySchema = z
  .object({
    // XXX: Sentry can return either of these. Not sure why we never normalized it.
    values: z.array(ExceptionInterface.optional()),
    value: ExceptionInterface.nullable().optional(),
  })
  .partial();

export const RequestEntrySchema = z
  .object({
    method: z.string().nullable(),
    url: z.string().url().nullable(),
    // TODO:
    // query: z.array(z.tuple([z.string(), z.string()])).nullable(),
    // data: z.unknown().nullable(),
    // headers: z.array(z.tuple([z.string(), z.string()])).nullable(),
  })
  .partial();

export const MessageEntrySchema = z
  .object({
    formatted: z.string().nullable(),
    message: z.string().nullable(),
    params: z.array(z.unknown()).optional(),
  })
  .partial();

export const ThreadEntrySchema = z
  .object({
    id: z.number().nullable(),
    name: z.string().nullable(),
    current: z.boolean().nullable(),
    crashed: z.boolean().nullable(),
    state: z.string().nullable(),
    stacktrace: z
      .object({
        frames: z.array(FrameInterface),
      })
      .nullable(),
  })
  .partial();

export const ThreadsEntrySchema = z
  .object({
    values: z.array(ThreadEntrySchema),
  })
  .partial();

export const BreadcrumbSchema = z
  .object({
    timestamp: z.string().nullable(),
    type: z.string().nullable(),
    category: z.string().nullable(),
    level: z.string().nullable(),
    message: z.string().nullable(),
    data: z.record(z.unknown()).nullable(),
  })
  .partial();

export const BreadcrumbsEntrySchema = z
  .object({
    values: z.array(BreadcrumbSchema),
  })
  .partial();

const BaseEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string().nullable(),
  platform: z.string().nullable().optional(),
  type: z.unknown(),
  entries: z.array(
    z.union([
      z.object({
        type: z.literal("exception"),
        data: ErrorEntrySchema,
      }),
      z.object({
        type: z.literal("message"),
        data: MessageEntrySchema,
      }),
      z.object({
        type: z.literal("threads"),
        data: ThreadsEntrySchema,
      }),
      z.object({
        type: z.literal("request"),
        data: RequestEntrySchema,
      }),
      z.object({
        type: z.literal("breadcrumbs"),
        data: BreadcrumbsEntrySchema,
      }),
      z.object({
        type: z.literal("spans"),
        data: z.unknown(),
      }),
      z.object({
        type: z.string(),
        data: z.unknown(),
      }),
    ]),
  ),
  contexts: z
    .record(
      z.string(),
      z
        .object({
          type: z.union([z.literal("default"), z.literal("runtime"), z.literal("os"), z.literal("trace"), z.unknown()]),
        })
        .passthrough(),
    )
    .optional(),
  tags: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
});

export const ErrorEventSchema = BaseEventSchema.omit({
  type: true,
}).extend({
  type: z.literal("error"),
  culprit: z.string().nullable(),
  dateCreated: z.string().datetime(),
});

export const TransactionEventSchema = BaseEventSchema.omit({
  type: true,
}).extend({
  type: z.literal("transaction"),
  occurrence: z.object({
    issueTitle: z.string(),
    culprit: z.string().nullable(),
  }),
});

export const UnknownEventSchema = BaseEventSchema.omit({
  type: true,
}).extend({
  type: z.unknown(),
});

// XXX: This API response is kind of a disaster. We are not propagating the appropriate
// columns and it makes this really hard to work with. Errors and Transaction-based issues
// are completely different, for example.
export const EventSchema = z.union([ErrorEventSchema, TransactionEventSchema, UnknownEventSchema]);
