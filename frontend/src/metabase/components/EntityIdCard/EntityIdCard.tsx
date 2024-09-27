import { useRef, useState } from "react";
import { t } from "ttag";

import { SidesheetCard } from "metabase/common/components/Sidesheet";
import { useDocsUrl } from "metabase/common/hooks";
import { useCallOnEnter } from "metabase/common/utils/keyboard";
import { CopyButton } from "metabase/components/CopyButton";
import Link from "metabase/core/components/Link";
import { Flex, Group, Icon, Paper, Popover, Text } from "metabase/ui";

import Styles from "./EntityIdCard.module.css";

const EntityIdTitle = () => {
  const { url: docsLink, showMetabaseLinks } = useDocsUrl(
    "installation-and-operation/serialization",
  );
  const [infoPopoverOpen, setInfoPopoverOpen] = useState(false);

  const openPopoverOnEnter = useCallOnEnter(() =>
    setInfoPopoverOpen(open => !open),
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <Group spacing="sm">
      {t`Entity ID`}
      <Popover position="top-start" opened={infoPopoverOpen}>
        <Popover.Target>
          <Icon
            onClick={() => setInfoPopoverOpen(open => !open)}
            onBlur={e => {
              if (!dropdownRef.current?.contains(e.relatedTarget)) {
                setInfoPopoverOpen(false);
              }
            }}
            tabIndex={0}
            name="info"
            className={Styles.InfoIcon}
            onKeyDown={openPopoverOnEnter}
          />
        </Popover.Target>
        <Popover.Dropdown>
          <Paper p="md" maw="13rem" ref={dropdownRef}>
            <Text size="sm">
              {t`When using serialization, replace the sequential ID with this global entity ID to have stable URLs across environments. Also useful when troubleshooting serialization.`}{" "}
              {showMetabaseLinks && (
                <>
                  <Link
                    target="_new"
                    to={docsLink}
                    style={{ color: "var(--mb-color-brand)" }}
                  >
                    Learn more
                  </Link>
                </>
              )}
            </Text>
          </Paper>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
};

export function EntityIdCard({ entityId }: { entityId: string }) {
  return (
    <SidesheetCard title={<EntityIdTitle />}>
      <Flex gap="sm">
        <Text lh={1}>{entityId}</Text>
        <CopyButton className={Styles.CopyButton} value={entityId} />
      </Flex>
    </SidesheetCard>
  );
}
