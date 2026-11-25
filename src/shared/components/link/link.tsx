import NextLink from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof NextLink>;

const Link = ({ prefetch = false, ...props }: Props) => (
  <NextLink prefetch={prefetch} {...props} />
);

export default Link;
