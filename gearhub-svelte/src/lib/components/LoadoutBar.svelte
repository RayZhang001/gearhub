<script lang="ts">
	import { gearList, loadoutSet } from '$lib/stores';

	$: totalWeight = getTotalWeight($gearList, $loadoutSet);
	$: activeBody = $gearList.find((_, idx) => $loadoutSet.has(idx) && $gearList[idx].type === 'Body');

	function getTotalWeight(list: typeof $gearList, loadout: Set<number>) {
		let total = 0;
		loadout.forEach(idx => {
			const wStr = list[idx].weight || "0g";
			const wInt = parseInt(wStr.replace('g','').trim()) || 0;
			total += wInt;
		});
		return total;
	}

	function clearLoadout() {
		loadoutSet.set(new Set());
	}
</script>

<div class="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-sony-orange/50 p-4 z-40 backdrop-blur-lg transform transition-transform duration-300 {$loadoutSet.size > 0 ? '' : 'translate-y-full'}">
	<div class="max-w-7xl mx-auto flex justify-between items-center">
		<div class="flex items-center gap-4">
			<iconify-icon icon="lucide:suitcase" class="text-sony-orange text-2xl"></iconify-icon>
			<div>
				<p class="text-xs text-gray-400 uppercase">Loadout Weight</p>
				<p class="text-xl font-bold font-mono text-white">{totalWeight} g</p>
			</div>
			{#if activeBody}
				<div class="hidden md:block ml-4 px-3 py-1 bg-gray-800 rounded text-xs font-mono border border-gray-600">
					<span class="text-gray-500">BODY:</span> <span class="text-white font-bold {activeBody ? 'text-sony-orange' : ''}">{activeBody.name}</span>
				</div>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<button onclick={clearLoadout} class="text-xs text-red-500 hover:text-white underline">Clear</button>
		</div>
	</div>
</div>