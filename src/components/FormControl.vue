<template>
	<div class="flex flex-col space-y-2">
		<label :for="id" class="text-zinc-200 select-none font-medium">{{ label }}</label>
		<select
			v-if="type === 'select'" :id="id" v-model="val"
			class="appearance-none px-4 py-2 rounded-lg text-white bg-zinc-700 border border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-800">
			<option v-for="opt in options" :key="opt.id" :value="opt.id">{{opt.name}}</option>
		</select>
		<input
			v-else :id="id" :type="type" :placeholder="placeholder" v-model="val" :min="min" :max="max"
			class="px-4 py-2 rounded-lg text-white bg-zinc-700 border border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-800"
		/>
	</div>
</template>

<script>
export default {
	name: "FormControl",
	props: {
		id: String,
		label: String,
		placeholder: String,
		type: {
			type: String,
			default: 'text'
		},
		value: undefined,
		options: {
			type: Array,
			default: () => []
		},
		min: String,
		max: String
	},
	computed: {
		val: {
			get() {
				return this.value
			},
			set(value) {
				this.$emit('update:value', value)
			}
		},
	}
}
</script>

<style scoped>

</style>
