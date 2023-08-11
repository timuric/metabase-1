/* eslint-disable react/prop-types */
import { SearchFilterComponent } from "metabase/search/types";
import { SearchFilterView } from "metabase/search/components/SearchFilterModal/filters/SearchFilterView";
import { Group } from "metabase/ui";
import { VerifiedFilterButton } from "metabase/search/components/SearchFilterModal/filters/VerifiedFilter/VerifiedFilter.styled";

export const VerifiedFilter: SearchFilterComponent<"verified"> = ({
  value = undefined,
  onChange,
  "data-testid": dataTestId,
}) => (
  <SearchFilterView title="Verified" data-testid={dataTestId}>
    <Group>
      <VerifiedFilterButton
        data-is-selected={value}
        isSelected={!!value}
        onClick={() => onChange(true)}
      >
        Only verified items
      </VerifiedFilterButton>
      <VerifiedFilterButton
        data-is-selected={value}
        isSelected={!value}
        onClick={() => onChange(undefined)}
      >
        All items
      </VerifiedFilterButton>
    </Group>
  </SearchFilterView>
);
