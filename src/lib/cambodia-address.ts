/** @deprecated Use cambodia-gazetteer.ts — kept for type compatibility only */
export type Village = { name: string }
export type Commune = { name: string; villages?: Village[] }
export type District = { name: string; communes: Commune[] }
export type Province = { name: string; districts: District[] }
