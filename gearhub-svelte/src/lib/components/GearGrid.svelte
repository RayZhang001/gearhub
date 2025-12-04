<script lang="ts">
	import { gearList, loadoutSet, activeCategory, activeFilters } from '$lib/stores';
	import type { GearItem } from '$lib/stores';

	let { editItem } = $props<{ editItem: (index: number) => void }>();

	let filteredItems = $derived(getFilteredItems($gearList, $activeCategory, $activeFilters));

	function getFilteredItems(list: GearItem[], category: string, filters: typeof $activeFilters) {
		return list.map((item, index) => ({...item, originalIndex: index}))
			.filter(item => {
				const tags = getLensTags(item, category);
				if(!tags.isVisible) return false;

				if (filters.mounts.size > 0 && tags.mount && !filters.mounts.has(tags.mount)) return false;
				if (filters.types.size > 0 && tags.typeGroup && !filters.types.has(tags.typeGroup)) return false;
				if (filters.focalGroups.size > 0 && tags.focalGroup && !filters.focalGroups.has(tags.focalGroup)) return false;
				if (filters.filterSizes.size > 0 && tags.filterSize && !filters.filterSizes.has(tags.filterSize)) return false;
				return true;
			});
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

	function toggleLoadout(index: number) {
		if ($loadoutSet.has(index)) {
			$loadoutSet.delete(index);
		} else {
			$loadoutSet.add(index);
		}
		loadoutSet.set($loadoutSet);
	}

	function getCompatStatus(item: GearItem, activeBody: GearItem | undefined): string {
		if ($activeCategory === 'Optics' && activeBody && item.type !== 'Body') {
			if (item.mount && item.mount !== activeBody.mount) {
				return 'incompatible';
			} else if (activeBody.sensorFormat === 'Full Frame' && item.sensorFormat === 'APS-C') {
				return 'crop';
			}
		}
		return 'ok';
	}

	function getWarningMsg(status: string): string {
		if (status === 'incompatible') {
			return 'INCOMPATIBLE MOUNT';
		} else if (status === 'crop') {
			return 'APS-C CROP MODE';
		}
		return '';
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
	{#each filteredItems as item (item.originalIndex)}
		{@const index = item.originalIndex}
		{@const isSelected = $loadoutSet.has(index)}
		{@const activeBody = $gearList.find(g => g.type === 'Body' && $loadoutSet.has($gearList.indexOf(g)))}
		{@const compatStatus = getCompatStatus(item, activeBody)}
		{@const warningMsg = getWarningMsg(compatStatus)}
		
		<div 
			class="glass-panel lens-card rounded-xl overflow-hidden flex flex-col h-full border relative group cursor-pointer {isSelected ? 'border-sony-orange ring-1 ring-sony-orange !bg-sony-orange/20' : 'border-gray-800'} {compatStatus === 'incompatible' ? 'state-incompatible' : ''} {compatStatus === 'crop' ? 'state-crop' : ''}"
			onclick={() => { if (compatStatus !== 'incompatible') toggleLoadout(index); }}
			onkeydown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && compatStatus !== 'incompatible') toggleLoadout(index); }}
			role="button"
			tabindex="0"
		>
			{#if warningMsg}
				<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 {compatStatus === 'incompatible' ? 'bg-red-600' : 'bg-yellow-600 text-black'} px-3 py-1 font-bold text-xs rounded shadow-lg whitespace-nowrap">
					{warningMsg}
				</div>
			{/if}
			
			<div class="absolute top-0 right-0 p-3 z-20">
				<button onclick={(e) => { e.stopPropagation(); editItem(index); }} class="pointer-events-auto text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition" aria-label="Edit item">
					<iconify-icon icon="lucide:pencil"></iconify-icon>
				</button>
			</div>
			
			<div class="h-36 bg-white/5 p-4 flex items-center justify-center relative">
				<img src={item.image || 'https://via.placeholder.com/300x200?text=No+Image'} class="max-h-full max-w-full object-contain filter drop-shadow-lg group-hover:scale-110 transition duration-500" alt={item.name}>
			</div>
			<div class="p-3 flex-grow flex flex-col">
				<div class="flex justify-between items-center mb-1">
					<span class="text-[9px] font-bold text-sony-orange font-mono uppercase tracking-widest">{item.type}</span>
					<span class="text-[9px] text-gray-500 border border-gray-700 px-1 rounded">{item.filterSize || 'N/A'}</span>
				</div>
				<h3 class="text-xs font-bold text-white mb-2 leading-tight">{item.name}</h3>
				{@render getSpecs(item)}
			</div>
		</div>
	{/each}
</div>

{#snippet getSpecs(item: GearItem)}
	{#if $activeCategory === 'Optics'}
		<div class="mt-auto grid grid-cols-3 gap-y-2 gap-x-1 text-[10px] text-gray-400 border-t border-gray-800 pt-2 font-mono text-center">
			<div class="flex flex-col items-center" title="Mount">
				<iconify-icon icon="fa7-solid:ring" class="mb-1"></iconify-icon>
				{item.mount || '-'}
			</div>
			<div class="flex flex-col items-center border-r border-gray-800" title="Focal Length">
				<iconify-icon icon="bxs:ruler" class="mb-1 text-gray-500"></iconify-icon>
				{item.focalLength || '-'}
			</div>
			<div class="flex flex-col items-center border-r border-gray-800" title="Aperture">
				<iconify-icon icon="oi:aperture" class="mb-1 text-gray-500 text-[0.6rem]"></iconify-icon>
				{item.aperture || '-'}
			</div>
			<div class="flex flex-col items-center border-r border-t border-gray-800 pt-2" title="Filter Thread">
				<iconify-icon icon="mdi:diameter-variant" class="mb-1 text-gray-500"></iconify-icon>
				{item.filterSize ? item.filterSize : '-'}
			</div>
			<div class="flex flex-col items-center border-r border-t border-gray-800 pt-2" title="Min Focus">
				<iconify-icon icon="mdi:flower-tulip" class="mb-1 text-gray-500"></iconify-icon>
				{item.minFocus || '-'}
			</div>
			<div class="flex flex-col items-center border-t border-gray-800 pt-2" title="Magnification">
				<iconify-icon icon="mdi:magnify-plus" class="mb-1 text-gray-500"></iconify-icon>
				{item.magnification || '-'}
			</div>
		</div>
	{:else}
		<div class="mt-auto text-[10px] text-gray-400 border-t border-gray-800 pt-2 font-mono">
			{#if item.customFields && Object.keys(item.customFields).length > 0}
				<div class="grid grid-cols-2 gap-1 text-center">
					{#each Object.entries(item.customFields).slice(0, 4) as [key, value]}
						<div class="flex flex-col items-center border-gray-800 p-1">
							<span class="text-[8px] text-gray-500 uppercase leading-none mb-0.5">{key}</span>
							<span class="text-white leading-none">{value}</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-1 text-center">
					<div class="flex flex-col items-center border-r border-gray-800">
						<iconify-icon icon="lucide:copyright" class="mb-1 text-sony-orange"></iconify-icon>
						{item.mount || 'Univ.'}
					</div>
					<div class="flex flex-col items-center">
						<iconify-icon icon="lucide:ban" class="mb-1 text-gray-600"></iconify-icon>
						{item.filterSize || '-'}
					</div>
				</div>
			{/if}
		</div>
	{/if}
	<div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/50">
		<span class="text-[10px] text-gray-500 font-mono">{item.weight || ''}</span>
		{#if item.link}
			<a href={item.link} target="_blank" onclick={(e) => e.stopPropagation()} class="text-[10px] text-sony-orange hover:text-white flex items-center gap-1 font-bold z-20">
				SPECS <iconify-icon icon="lucide:external-link"></iconify-icon>
			</a>
		{/if}
	</div>
{/snippet}