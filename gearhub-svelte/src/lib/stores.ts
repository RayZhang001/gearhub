import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface GearItem {
	id: number | string;
	name: string;
	type: string;
	mount?: string;
	sensorFormat?: string;
	weight?: string;
	focalLength?: string;
	aperture?: string;
	minFocus?: string;
	magnification?: string;
	filterSize?: string;
	price?: number;
	image?: string;
	link?: string;
	category?: string;
	customFields?: Record<string, string>;
}

export const gearList = writable<GearItem[]>([]);
export const loadoutSet = writable<Set<number>>(new Set());
export const activeCategory = writable<string>('Optics');
export const activeFilters = writable({
	types: new Set<string>(),
	focalGroups: new Set<string>(),
	filterSizes: new Set<string>(),
	mounts: new Set<string>()
});

const STORAGE_KEY = 'my_lens_db_v5';

export function saveToLocal(list: GearItem[]) {
	if (browser) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	}
}

export function loadFromLocal(): GearItem[] {
	if (browser) {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	}
	return [];
}