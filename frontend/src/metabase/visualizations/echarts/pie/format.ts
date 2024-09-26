import { formatValue } from "metabase/lib/formatting";
import { computeMaxDecimalsForValues } from "metabase/visualizations/lib/utils";
import type { ComputedVisualizationSettings } from "metabase/visualizations/types";

import type { PieChartModel } from "./model/types";

export interface PieChartFormatters {
  formatMetric: (value: unknown, isCompact?: boolean) => string;
  formatPercent: (value: unknown, location: "legend" | "chart") => string;
}

export function getPieChartFormatters(
  chartModel: PieChartModel,
  settings: ComputedVisualizationSettings,
): PieChartFormatters {
  const { column: getColumnSettings } = settings;
  if (!getColumnSettings) {
    throw Error("`settings.column` is undefined");
  }

  const metricColSettings = getColumnSettings(
    chartModel.colDescs.metricDesc.column,
  );

  const formatMetric = (value: unknown, isCompact: boolean = false) =>
    String(
      formatValue(value, {
        ...metricColSettings,
        compact: isCompact,
      }),
    );

  const formatPercent = (value: unknown, location: "legend" | "chart") => {
    let decimals = settings["pie.decimal_places"];
    if (decimals == null) {
      decimals = computeMaxDecimalsForValues(
        chartModel.slices.map(s => s.data.normalizedPercentage),
        {
          style: "percent",
          maximumSignificantDigits: location === "legend" ? 3 : 2,
        },
      );
    }

    return String(
      formatValue(value, {
        column: metricColSettings.column,
        number_separators: metricColSettings.number_separators as string,
        number_style: "percent",
        decimals,
      }),
    );
  };

  return { formatMetric, formatPercent };
}
