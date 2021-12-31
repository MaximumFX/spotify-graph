<template>
	<div :class="['px-3 mt-6', 'w-' + width]">
		<slot/>
	</div>
</template>

<script>
export default {
	name: "Col",
	props: {
		width: {
			type: String,
			default: 'full'
		}
	}
}
</script>

<style scoped>

</style>
