import { useCallback, useMemo, useState } from "react";
import { useMount } from "react-use";
import { t } from "ttag";

import { Sidesheet, SidesheetCard } from "metabase/common/components/Sidesheet";
import { EntityIdCard } from "metabase/components/EntityIdCard";
import EditableText from "metabase/core/components/EditableText";
import { color } from "metabase/lib/colors";
import type { ObjectWithModel } from "metabase/lib/icon";
import { PLUGIN_COLLECTIONS } from "metabase/plugins";
import {
  Box,
  Group,
  FixedSizeIcon as Icon,
  Stack,
  Text,
  Title,
} from "metabase/ui";
import type { Collection } from "metabase-types/api";

export const CollectionSidesheet = ({
  onClose,
  collection,
  onUpdateCollection,
}: {
  onClose: () => void;
  collection: Collection;
  onUpdateCollection: (entity: Collection, values: Partial<Collection>) => void;
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

  const handleChangeDescription = useCallback(
    (description: string) => {
      onUpdateCollection(collection, { description: description || null });
    },
    [collection, onUpdateCollection],
  );

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
            <Stack spacing="md">
              <Stack spacing="xs">
                <Title lh={1} size="sm" color="text-light">
                  {t`Description`}
                </Title>
                <EditableDescription
                  collection={collection}
                  handleChangeDescription={handleChangeDescription}
                />
              </Stack>
              <Group noWrap spacing="sm">
                <Icon {...iconProps} />
                <Text lh={1}>{t`Official collection`}</Text>
              </Group>
            </Stack>
          </SidesheetCard>
        )}
        {collection.entity_id && (
          <EntityIdCard entityId={collection.entity_id} />
        )}
      </Stack>
    </Sidesheet>
  );
};

const EditableDescription = ({
  collection,
  handleChangeDescription,
}: {
  collection: Collection;
  handleChangeDescription: (description: string) => void;
}) => {
  const description = collection.description;
  const canWrite = collection.can_write;
  return (
    <Box
      component={EditableText}
      tabIndex={0}
      pos="relative"
      left={-5}
      lh={1.38}
      key={collection.id}
      initialValue={description}
      placeholder={
        !description && !canWrite ? t`No description` : t`Add description`
      }
      isDisabled={!canWrite}
      isOptional
      isMultiline
      isMarkdown
      onChange={handleChangeDescription}
      // For a11y, allow typing to activate the textarea
      onKeyDown={(e: React.KeyboardEvent) => {
        if (shouldPassKeyToTextarea(e.key)) {
          (e.currentTarget as HTMLTextAreaElement).click();
        }
      }}
      onKeyUp={(e: React.KeyboardEvent) => {
        if (!shouldPassKeyToTextarea(e.key)) {
          (e.currentTarget as HTMLTextAreaElement).click();
        }
      }}
    />
  );
};

/** All keypresses except Enter will be inserted into the textarea */
const shouldPassKeyToTextarea = (key: string) => key !== "Enter";
