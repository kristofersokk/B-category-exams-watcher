import type { Filter, Slot } from '.';
import { getCurrentDate } from './helpers';

export const TEMPLATE_NEW_ENTRIES = (diff: Slot[]): string => `
${getCurrentDate()}
New entries found: ${diff.length}

${JSON.stringify(diff, null, 4)}
`;

export const TEMPLATE_SETUP = (filter: Filter): string => `
Algas sõidueksami aegade jälgimine antud filtriga:
${JSON.stringify(filter, null, 4)}
`;
