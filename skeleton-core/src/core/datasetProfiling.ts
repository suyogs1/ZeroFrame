// Dataset profiling utilities
// Computes basic statistics from sample rows

import type { Dataset, DatasetProfile, ColumnProfile } from '../types';

/**
 * Compute dataset profile from sample rows
 * Uses first 50 rows (or whatever is in sampleRows) to generate statistics
 */
export function computeDatasetProfile(dataset: Dataset): DatasetProfile | undefined {
  if (!dataset.sampleRows || !dataset.columns || dataset.sampleRows.length === 0) {
    return undefined;
  }

  const rows = dataset.sampleRows;
  const cols = dataset.columns;

  const profiles: ColumnProfile[] = cols.map(col => {
    const values = rows.map(r => (r as any)[col.name]);
    const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
    const nullCount = values.length - nonNull.length;
    const exampleValues = nonNull.slice(0, 5).map(v => String(v));

    let distinctCount: number | undefined;
    let minValue: string | undefined;
    let maxValue: string | undefined;
    let avg: number | undefined;

    if (nonNull.length > 0) {
      distinctCount = new Set(nonNull.map(v => String(v))).size;

      if (col.type === 'number') {
        const nums = nonNull.map(v => Number(v)).filter(v => !Number.isNaN(v));
        if (nums.length > 0) {
          const min = Math.min(...nums);
          const max = Math.max(...nums);
          const sum = nums.reduce((a, b) => a + b, 0);
          avg = sum / nums.length;
          minValue = String(min);
          maxValue = String(max);
        }
      } else if (col.type === 'date') {
        const dates = nonNull
          .map(v => new Date(String(v)))
          .filter(d => !Number.isNaN(d.getTime()));
        if (dates.length > 0) {
          const timestamps = dates.map(d => d.getTime());
          const min = new Date(Math.min(...timestamps));
          const max = new Date(Math.max(...timestamps));
          minValue = min.toISOString();
          maxValue = max.toISOString();
        }
      } else {
        // string / boolean: compute lexicographic min/max
        const strs = nonNull.map(v => String(v)).sort();
        minValue = strs[0];
        maxValue = strs[strs.length - 1];
      }
    }

    return {
      columnName: col.name,
      type: col.type,
      distinctCount,
      nullCount,
      minValue,
      maxValue,
      avg,
      exampleValues,
    };
  });

  return {
    lastProfiledAt: new Date().toISOString(),
    rowCount: dataset.rowCount ?? dataset.sampleRows.length,
    columnProfiles: profiles,
  };
}

/**
 * Format profile statistics for display
 */
export function formatProfileStat(
  profile: ColumnProfile,
  stat: 'distinctCount' | 'nullCount' | 'minValue' | 'maxValue' | 'avg'
): string {
  const value = profile[stat];
  if (value === undefined) return 'N/A';
  
  if (stat === 'avg' && typeof value === 'number') {
    return value.toFixed(2);
  }
  
  return String(value);
}

/**
 * Get null percentage for a column
 */
export function getNullPercentage(profile: ColumnProfile, totalRows: number): number {
  if (!profile.nullCount || totalRows === 0) return 0;
  return (profile.nullCount / totalRows) * 100;
}
