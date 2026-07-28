// Bridges the vite-plugin-svgr@5 type model (default export via `*.svg?react`)
// to the import shape the spotlight UI still uses: `import { ReactComponent } from "./foo.svg"`.
// The runtime Vite plugin is configured in `vite.config.base.ts` to transform
// `*.svg` as a React component as well as `*.svg?react`.
declare module "*.svg" {
  import type { FunctionComponent, ComponentProps } from "react";

  export const ReactComponent: FunctionComponent<
    ComponentProps<"svg"> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
    }
  >;

  const Component: FunctionComponent<
    ComponentProps<"svg"> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
    }
  >;

  export default Component;
}
