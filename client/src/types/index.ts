/**
 * Central barrel for shared client types.
 *
 * Prefer importing from here (or a specific file below) over re-declaring
 * shapes locally. All modules in this folder are type- or const-only except
 * `navigation.ts`, which also exports a tiny readonly constant.
 */
export * from './base';
export * from './navigation';
export * from './toast';
export * from './social';
export * from './room';
export * from './learning';