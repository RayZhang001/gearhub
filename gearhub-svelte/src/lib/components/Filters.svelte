<script lang="ts">
	import { gearList, activeCategory, activeFilters } from '$lib/stores';
	import type { GearItem } from '$lib/stores';

	$: options = getOptions($gearList, $activeCategory);

	function getOptions(list: GearItem[], category: string) {
		const opts = {
			types: new Set<string>(),
			focalGroups: new Set<string>(),
			filterSizes: new Set<string>(),
			mounts: new Set<string>()
		};

		list.forEach(item => {
			const tags = getLensTags(item, category);
			if (!tags.isVisible) return;

			if(tags.typeGroup) opts.types.add(tags.typeGroup);
			if(tags.focalGroup) opts.focalGroups.add(tags.focalGroup);
			if(tags.filterSize && tags.filterSize !== 'N/A') opts.filterSizes.add(tags.filterSize);
			if(tags.mount) opts.mounts.add(tags.mount);
		});

		return opts;
	}

	function getLensTags(item: GearItem, category: string) {
		const cat = item.category || 'Optics';
		
		if (cat !== category) return { isVisible: false };

		if (item.type === 'Body') return { isVisible: true, isBody: true, focalGroup: 'Body', typeGroup: 'Body', filterSize: 'N/A', mount: item.mount };
		
		if (cat !== 'Optics') {
			return {
				isVisible: true,
				isBody: false,
				typeGroup: item.type, 
				mount: item.mount,
				filterSize: item.filterSize
			};
		}

		let focalGroup = 'Standard';
		let minMm = 0, maxMm = 0;
		const clean = (item.focalLength || '').replace(/mm/g,'').trim();
		if(clean) {
			if(clean.includes('-')) { 
				[minMm, maxMm] = clean.split('-').map(Number); 
			} else { 
				minMm = maxMm = Number(clean); 
			}
			
			if (maxMm <= 35) focalGroup = 'Wide Angle';
			else if (minMm >= 70) focalGroup = 'Telephoto';
		}
		
		let typeGroup = 'Prime';
		if ((item.type || '').includes('Zoom')) typeGroup = 'Zoom';

		return {
			isVisible: true,
			isBody: false,
			focalGroup,
			typeGroup,
			filterSize: item.filterSize,
			mount: item.mount
		};
	}

	function toggleFilter(category: keyof typeof $activeFilters, value: string) {
		if ($activeFilters[category].has(value)) {
			$activeFilters[category].delete(value);
		} else {
			$activeFilters[category].add(value);
		}
		activeFilters.set($activeFilters);
	}

	function clearFilters() {
		activeFilters.set({
			types: new Set(),
			focalGroups: new Set(),
			filterSizes: new Set(),
			mounts: new Set()
		});
	}

	$: hasActive = Object.values($activeFilters).some(s => s.size > 0);
</script>

<div class="glass-panel rounded-xl p-5">
	<div class="flex justify-between items-center mb-3">
		<h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono">
			<iconify-icon icon="lucide:filter"></iconify-icon> <span>{$activeCategory.toUpperCase()}</span> FILTERS
		</h3>
		{#if hasActive}
			<button onclick={clearFilters} class="text-[10px] text-red-500 hover:text-white uppercase font-mono">RESET</button>
		{/if}
	</div>
	<div class="space-y-4">
		{#if options.types.size > 0}
			<div>
				<p class="text-[10px] text-gray-500 font-mono uppercase mb-2">Type</p>
				<div class="flex flex-wrap gap-2">
					{#each Array.from(options.types).sort() as val}
						<button onclick={() => toggleFilter('types', val)} 
							class="border px-2 py-1 rounded text-[10px] font-bold font-mono transition-all {$activeFilters.types.has(val) ? 'bg-sony-orange text-white border-sony-orange' : 'bg-black text-gray-400 border-gray-700 hover:border-gray-500'}">
							{val}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		{#if $activeCategory === 'Optics' && options.focalGroups.size > 0}
			<div>
				<p class="text-[10px] text-gray-500 font-mono uppercase mb-2">Focal Field</p>
				<div class="flex flex-wrap gap-2">
					{#each Array.from(options.focalGroups).sort() as val}
						<button onclick={() => toggleFilter('focalGroups', val)} 
							class="border px-2 py-1 rounded text-[10px] font-bold font-mono transition-all {$activeFilters.focalGroups.has(val) ? 'bg-sony-orange text-white border-sony-orange' : 'bg-black text-gray-400 border-gray-700 hover:border-gray-500'}">
							{val}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		{#if options.filterSizes.size > 0}
			<div>
				<p class="text-[10px] text-gray-500 font-mono uppercase mb-2">Filter / Size</p>
				<div class="flex flex-wrap gap-2">
					{#each Array.from(options.filterSizes).sort((a,b) => parseInt(a) - parseInt(b)) as val}
						<button onclick={() => toggleFilter('filterSizes', val)} 
							class="border px-2 py-1 rounded text-[10px] font-bold font-mono transition-all {$activeFilters.filterSizes.has(val) ? 'bg-sony-orange text-white border-sony-orange' : 'bg-black text-gray-400 border-gray-700 hover:border-gray-500'}">
							{val}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		{#if options.mounts.size > 0}
			<div>
				<p class="text-[10px] text-gray-500 font-mono uppercase mb-2">System / Mount</p>
				<div class="flex flex-wrap gap-2">
					{#each Array.from(options.mounts).sort() as val}
						<button onclick={() => toggleFilter('mounts', val)} 
							class="border px-2 py-1 rounded text-[10px] font-bold font-mono transition-all {$activeFilters.mounts.has(val) ? 'bg-sony-orange text-white border-sony-orange' : 'bg-black text-gray-400 border-gray-700 hover:border-gray-500'}">
							{val}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>