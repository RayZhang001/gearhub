<script lang="ts">
	import { gearList, saveToLocal } from '$lib/stores';
	import type { GearItem } from '$lib/stores';

	let { show = $bindable(false), closeModal } = $props<{ show?: boolean; closeModal: () => void }>();

	let editId = $state('');
	let isJsonMode = $state(false);
	let formData = $state<GearItem>({
		id: 0,
		category: 'Optics',
		name: '',
		type: 'Prime',
		mount: '',
		sensorFormat: 'Full Frame',
		weight: '',
		focalLength: '',
		aperture: '',
		minFocus: '',
		magnification: '',
		filterSize: '',
		price: 0,
		image: '',
		link: '',
		customFields: {}
	});
	let customFieldRows = $state<{key: string, value: string}[]>([]);
	let jsonInput = $state('');

	$effect(() => {
		if (!show) {
			editId = '';
			isJsonMode = false;
			clearForm();
		}
	});

	function clearForm() {
		formData = {
			id: 0,
			category: 'Optics',
			name: '',
			type: 'Prime',
			mount: '',
			sensorFormat: 'Full Frame',
			weight: '',
			focalLength: '',
			aperture: '',
			minFocus: '',
			magnification: '',
			filterSize: '',
			price: 0,
			image: '',
			link: '',
			customFields: {}
		};
		customFieldRows = [];
		jsonInput = '';
	}

	function toggleJsonMode() {
		if (!isJsonMode) {
			// Sync custom fields before switching to JSON
			formData.customFields = Object.fromEntries(customFieldRows.filter(r => r.key.trim()).map(r => [r.key, r.value]));
			jsonInput = JSON.stringify(formData, null, 4);
			isJsonMode = true;
		} else {
			try {
				formData = JSON.parse(jsonInput);
				customFieldRows = Object.entries(formData.customFields || {}).map(([key, value]) => ({key, value}));
				isJsonMode = false;
			} catch (e) {
				alert("Invalid JSON. Please fix errors before switching back.");
			}
		}
	}

	function addCustomField() {
		customFieldRows = [...customFieldRows, { key: '', value: '' }];
	}

	function removeCustomField(index: number) {
		customFieldRows = customFieldRows.filter((_, i) => i !== index);
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		
		let finalData: GearItem;
		if(isJsonMode) {
			try {
				finalData = JSON.parse(jsonInput);
			} catch(e) {
				alert("Invalid JSON");
				return;
			}
		} else {
			finalData = { ...formData };
			// Sync custom fields
			finalData.customFields = Object.fromEntries(customFieldRows.filter(r => r.key.trim()).map(r => [r.key, r.value]));
		}

		if(editId !== '') {
			const index = parseInt(editId);
			finalData.id = $gearList[index].id;
			$gearList[index] = finalData;
		} else {
			finalData.id = Date.now();
			$gearList.push(finalData);
		}
		
		saveToLocal($gearList);
		closeModal();
	}

	function editItem(index: number) {
		editId = index.toString();
		formData = { ...$gearList[index] };
		customFieldRows = Object.entries(formData.customFields || {}).map(([key, value]) => ({key, value}));
		show = true;
	}
</script>

{#if show}
	<div class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
		<div class="glass-panel w-full max-w-lg p-6 rounded-xl border border-gray-700 relative my-8">
			<button onclick={closeModal} class="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close modal">
				<iconify-icon icon="lucide:x"></iconify-icon>
			</button>
			
			<div class="flex justify-between items-center mb-6 pr-8">
				<h2 class="text-xl font-bold text-white font-mono" id="modal-title">{editId ? 'EDIT_COMPONENT' : 'ADD_COMPONENT'}</h2>
				<button type="button" onclick={toggleJsonMode} class="text-[10px] text-sony-orange hover:text-white font-mono border border-gray-700 hover:border-sony-orange px-2 py-1 rounded transition">
					<iconify-icon icon="lucide:code"></iconify-icon> {isJsonMode ? 'FORM VIEW' : 'JSON MODE'}
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				{#if !isJsonMode}
					<!-- Common Fields -->
					<div class="space-y-3">
						<select bind:value={formData.category} class="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none text-sony-orange font-bold">
							<option value="Optics">Category: OPTICS (Lens/Body)</option>
							<option value="Lighting">Category: LIGHTING</option>
							<option value="Accessories">Category: ACCESSORIES</option>
						</select>

						<input bind:value={formData.name} type="text" placeholder="Name" class="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white focus:border-sony-orange outline-none" required>
						
						<div class="grid grid-cols-2 gap-3">
							<select bind:value={formData.type} class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
								{#if formData.category === 'Optics'}
									<option>Prime</option><option>Zoom</option><option>Tele-Zoom</option><option>Wide-Zoom</option><option>Body</option>
								{:else if formData.category === 'Lighting'}
									<option>Flash</option><option>Trigger</option><option>Light</option><option>Modifier</option>
								{:else}
									<option>Tripod</option><option>Filter</option><option>Bag</option><option>Storage</option><option>Other</option>
								{/if}
							</select>

							<input bind:value={formData.price} type="number" placeholder="Price ($)" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
							<input bind:value={formData.weight} type="text" placeholder="Weight (e.g. 500g)" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">

							{#if formData.category === 'Optics'}
								<input bind:value={formData.mount} type="text" placeholder="Mount (e.g. Sony E)" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
								<select bind:value={formData.sensorFormat} class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
									<option>Full Frame</option><option>APS-C</option><option>MFT</option>
								</select>
								<input bind:value={formData.focalLength} type="text" placeholder="Focal (e.g. 28-75mm)" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
								<input bind:value={formData.aperture} type="text" placeholder="Aperture" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
								<input bind:value={formData.minFocus} type="text" placeholder="Min Focus (0.5m)" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
								<input bind:value={formData.magnification} type="text" placeholder="Magnification (0.14x)" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
								<input bind:value={formData.filterSize} type="text" placeholder="Filter Size (67mm)" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
							{:else if formData.category === 'Lighting'}
								<input bind:value={formData.mount} type="text" placeholder="Mount (e.g. Hotshoe)" class="bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
							{/if}
						</div>
						
						<!-- Custom Fields Section -->
						<div class="pt-2 border-t border-gray-800">
							<div class="flex justify-between items-center mb-2">
								<span class="text-xs font-mono text-gray-500 uppercase">Custom Specs</span>
								<button type="button" onclick={addCustomField} class="text-[10px] text-sony-orange hover:text-white font-mono flex items-center gap-1">
									<iconify-icon icon="lucide:plus"></iconify-icon> ADD FIELD
								</button>
							</div>
							<div class="space-y-2">
								{#each customFieldRows as field, i}
									<div class="flex gap-2">
										<input bind:value={field.key} placeholder="Label (e.g. Watts)" class="w-1/3 bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-sony-orange outline-none">
										<input bind:value={field.value} placeholder="Value (e.g. 600W)" class="flex-grow bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-sony-orange outline-none">
										<button type="button" onclick={() => removeCustomField(i)} class="text-red-500 hover:text-red-400 px-1" aria-label="Remove field">
											<iconify-icon icon="lucide:trash-2"></iconify-icon>
										</button>
									</div>
								{/each}
							</div>
						</div>

						<input bind:value={formData.image} type="text" placeholder="Image URL" class="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
						<input bind:value={formData.link} type="text" placeholder="Official Link" class="w-full bg-black border border-gray-700 rounded p-2 text-sm text-white outline-none">
					</div>
				{:else}
					<textarea bind:value={jsonInput} class="w-full h-80 bg-black border border-gray-700 rounded p-3 text-xs text-green-400 font-mono outline-none focus:border-sony-orange resize-none" spellcheck="false" placeholder="// Paste JSON object here..."></textarea>
				{/if}

				<button type="submit" class="w-full bg-sony-orange hover:bg-orange-600 text-white font-bold py-2 rounded mt-2 transition font-mono">EXECUTE SAVE</button>
			</form>
		</div>
	</div>
{/if}