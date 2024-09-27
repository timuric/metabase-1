import { useCallback, useState } from "react";
import { useMount } from "react-use";
import { t } from "ttag";

import { Sidesheet, SidesheetCard } from "metabase/common/components/Sidesheet";
import { EntityIdCard } from "metabase/components/EntityIdCard";
import EditableText from "metabase/core/components/EditableText";
import { PLUGIN_COLLECTION_COMPONENTS } from "metabase/plugins";
import { Box, Stack, Title } from "metabase/ui";
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

  const handleChangeDescription = useCallback(
    (description: string) => {
      onUpdateCollection(collection, {
        description: description.trim() || null,
      });
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
        <SidesheetCard pb="lg">
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
            <PLUGIN_COLLECTION_COMPONENTS.CollectionAuthorityLevelDisplay
              collection={collection}
            />
          </Stack>
        </SidesheetCard>
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
  const description = collection.description?.trim() || null;
  const canWrite = collection.can_write;
  return (
    <Box
      component={EditableText}
      onChange={handleChangeDescription}
      initialValue={description}
      placeholder={
        !description && !canWrite ? t`No description` : t`Add description`
      }
      isDisabled={!canWrite}
      isOptional
      isMultiline
      isMarkdown
      key={collection.id}
      pos="relative"
      left={-4.5}
      lh={1.38}
    />
  );
};
