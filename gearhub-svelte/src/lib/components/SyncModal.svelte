<script lang="ts">
	import type { GearItem } from '$lib/stores';

	let { show = $bindable(false), localItems, serverItems, onConfirm, onCancel } = $props<{
		show: boolean;
		localItems: GearItem[];
		serverItems: GearItem[];
		onConfirm: () => void;
		onCancel: () => void;
	}>();

	// Calculate diffs
	let addedItems = $derived(serverItems.filter(s => !localItems.find(l => l.id === s.id)));
	let removedItems = $derived(localItems.filter(l => !serverItems.find(s => s.id === l.id)));
	let modifiedItems = $derived(serverItems.filter(s => {
		const local = localItems.find(l => l.id === s.id);
		return local && JSON.stringify(local) !== JSON.stringify(s);
	}));

	// For modified items, we are reverting to server version, so "updates" are what we get back.
</script>

{#if show}
	<div class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
		<div class="glass-panel w-full max-w-2xl p-6 rounded-xl border border-gray-700 relative flex flex-col max-h-[90vh]">
			<h2 class="text-xl font-bold text-white font-mono mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">
				<iconify-icon icon="lucide:refresh-cw" class="mr-2"></iconify-icon> Sync with Server Preset
			</h2>

			<div class="flex-grow overflow-y-auto space-y-6 pr-2">
				{#if addedItems.length > 0}
					<div>
						<h3 class="text-sm font-bold text-green-500 mb-2 font-mono flex items-center">
							<iconify-icon icon="lucide:plus-circle" class="mr-1"></iconify-icon> ADDING ({addedItems.length})
						</h3>
						<ul class="space-y-1">
							{#each addedItems as item}
								<li class="text-xs text-gray-300 bg-green-900/20 border border-green-900/50 p-2 rounded flex justify-between">
									<span>{item.name}</span>
									<span class="text-gray-500 font-mono">{item.type}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if removedItems.length > 0}
					<div>
						<h3 class="text-sm font-bold text-red-500 mb-2 font-mono flex items-center">
							<iconify-icon icon="lucide:trash-2" class="mr-1"></iconify-icon> REMOVING (Local Only) ({removedItems.length})
						</h3>
						<ul class="space-y-1">
							{#each removedItems as item}
								<li class="text-xs text-gray-300 bg-red-900/20 border border-red-900/50 p-2 rounded flex justify-between">
									<span>{item.name}</span>
									<span class="text-gray-500 font-mono">{item.type}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if modifiedItems.length > 0}
					<div>
						<h3 class="text-sm font-bold text-yellow-500 mb-2 font-mono flex items-center">
							<iconify-icon icon="lucide:alert-triangle" class="mr-1"></iconify-icon> REVERTING CHANGES ({modifiedItems.length})
						</h3>
						<ul class="space-y-1">
							{#each modifiedItems as item}
								<li class="text-xs text-gray-300 bg-yellow-900/20 border border-yellow-900/50 p-2 rounded flex justify-between">
									<span>{item.name}</span>
									<span class="text-gray-500 font-mono">Reset to Default</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if addedItems.length === 0 && removedItems.length === 0 && modifiedItems.length === 0}
					<div class="text-center text-gray-500 py-8 font-mono">
						Your library is already in sync with the server preset.
					</div>
				{/if}
			</div>

			<div class="mt-6 flex justify-end gap-3 border-t border-gray-800 pt-4">
				<button onclick={onCancel} class="px-4 py-2 rounded text-xs font-bold font-mono text-gray-400 hover:text-white transition">CANCEL</button>
				<button onclick={onConfirm} class="bg-sony-orange hover:bg-orange-600 text-white px-6 py-2 rounded text-xs font-bold font-mono transition flex items-center gap-2">
					<iconify-icon icon="lucide:check"></iconify-icon> CONFIRM RESET
				</button>
			</div>
		</div>
	</div>
{/if}