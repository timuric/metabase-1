import { useMemo, useState } from "react";
import { useMount } from "react-use";
import { t } from "ttag";

import Search from "metabase/entities/search";

import { Sidesheet, SidesheetCard } from "metabase/common/components/Sidesheet";
import { EntityIdCard } from "metabase/components/EntityIdCard";
import { Group, FixedSizeIcon as Icon, Stack, Text } from "metabase/ui";
import type { Collection } from "metabase-types/api";
import { getIcon, type ObjectWithModel } from "metabase/lib/icon";
import { PLUGIN_COLLECTIONS } from "metabase/plugins";
import { color } from "metabase/lib/colors";

export const CollectionSidesheet = ({
  onClose,
  collection,
}: {
  onClose: () => void;
  collection: Collection;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useMount(() => {
    // this component is not rendered until it is "open"
    // but we want to set isOpen after it mounts to get
    // pretty animations
    setIsOpen(true);
  });

  const iconProps = useMemo(() => {
    const icon = PLUGIN_COLLECTIONS.getIcon({
      ...collection,
      model: "collection",
    } as ObjectWithModel);
    if (icon.color) {
      icon.color = color(icon.color);
    }
    return icon;
  }, [collection]);

  return (
    <Sidesheet
      title={t`Info`}
      isOpen={isOpen}
      data-testid="collection-sidesheet"
      size="md"
      onClose={onClose}
    >
      <Stack spacing="lg">
        {collection.authority_level === "official" && (
          <SidesheetCard>
            <Group noWrap spacing="sm">
              <Icon {...iconProps} />
              <Text lh={1}>{t`Official Collection`}</Text>
            </Group>
          </SidesheetCard>
        )}
        {collection.entity_id && (
          <EntityIdCard entityId={collection.entity_id} />
        )}
      </Stack>
    </Sidesheet>
  );
};
