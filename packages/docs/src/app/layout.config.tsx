import Logo from "@/components/Logo";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { FaDiscord, FaXTwitter } from "react-icons/fa6";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <Logo />,
  },
  links: [
    {
      type: "icon",
      icon: <FaXTwitter />,
      text: "X",
      url: "https://x.com/gaborcsapo",
    },
    {
      type: "icon",
      icon: <FaDiscord />,
      text: "Discord",
      url: "https://discord.gg/sentry",
    },
  ],
  githubUrl: "https://github.com/getsentry/spotlight",
};
