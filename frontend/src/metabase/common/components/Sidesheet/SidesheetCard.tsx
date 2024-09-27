import type React from "react";

import CS from "metabase/css/core/index.css";
import {
  Paper,
  type PaperProps,
  Stack,
  type StackProps,
  Title,
} from "metabase/ui";

type SidesheetCardProps = {
  title?: React.ReactNode;
  children: React.ReactNode;
  stackProps?: StackProps;
} & PaperProps;

export const SidesheetCard = ({
  title,
  children,
  stackProps,
  ...paperProps
}: SidesheetCardProps) => {
  return (
    <Paper p="lg" withBorder shadow="none" {...paperProps}>
      {title && (
        <Title lh={1} mb=".75rem" size="sm" c="var(--mb-color-text-light)">
          {title}
        </Title>
      )}
      <Stack spacing="md" className={CS.textMedium} {...stackProps}>
        {children}
      </Stack>
    </Paper>
  );
};
