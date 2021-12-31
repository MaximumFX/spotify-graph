<template>
	<button :class="classes" type="button">
		<slot/>
	</button>
</template>

<script>
export default {
	name: "VButton",
	props: {
		outline: Boolean,
	},
	computed: {
		classes() {
			const classes = [
				'px-4 py-2 text-white rounded border border-solid border-green-600',
				'hover:bg-green-600 hover:border-green-700',
				'active:bg-green-700 active:border-green-800',
				'disabled:opacity-75'
			]

			if (!this.outline) classes.push('bg-green-500')

			return classes
		}
	}
}
</script>

<style scoped>

</style>
