import type { DialogRequest } from '../src/shared/types.ts';
export const activeDialog: { value: DialogRequest | null };
export function closeDialog(): void;
export function showDialog(request: DialogRequest): Promise<{ buttonId: string | null }>;
