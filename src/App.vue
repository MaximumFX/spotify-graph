<template>
	<main class="flex flex-col">
		<Container class="py-8 flex-grow">
			<Row class="justify-center mb-4">
				<Col width="1/2" class="text-center">
					<h1 class="mb-2">Spotify Graph</h1>
					<p class="mb-6">Get your Spotify listening history from the bottom of <a href="https://www.spotify.com/ca-en/account/privacy/" target="_blank">https://www.spotify.com/ca-en/account/privacy/</a> and upload all StreamingHistory json files here.</p>
					<div class="flex justify-center">
						<div class="w-96">
							<input type="file" multiple @change="previewFiles" accept="application/json" class="form-control
    block w-full
    px-3 py-1.5 m-0
    text-base font-normal text-white
    bg-green-800 bg-clip-padding
    border border-solid border-green-900
    rounded
    transition ease-in-out
    focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none">
						</div>
					</div>
				</Col>
			</Row>
			<Row class="justify-center mb-4">
				<Col width="fit">
					<v-button @click="showSettings = !showSettings" outline>Show settings</v-button>
				</Col>
				<Col width="fit">
					<v-button @click="createGraph" :disabled="loading || !files.length">{{ loading ? 'Loading...' : 'Create graph'}}</v-button>
				</Col>
			</Row>
			<Row class="justify-center">
				<Col v-show="showSettings" width="1/2">
					<div class="p-4 mb-4 rounded border border-solid border-zinc-700 bg-zinc-800">
						<div class="grid grid-cols-2 gap-4 mb-4">
							<form-control id="graphWidth" label="Graph width" type="number" v-model:value="settings.graphWidth"/>
							<form-control id="graphHeight" label="Graph height" type="number" v-model:value="settings.graphHeight"/>
							<form-control id="minMs" label="Minimum listened ms (per song)" type="number" v-model:value="settings.minMs"/>
							<form-control id="minPlays" label="Minimum plays (per artist)" type="number" v-model:value="settings.minPlays"/>
							<form-control id="groupBy" label="Group data by" type="select" v-model:value="settings.groupBy" :options="groupBy"/>
						</div>
						<form-control class="mb-4" id="minPlays" label="Ignore artists (case specific, separated by ,)" type="text" v-model:value="settings.ignoreArtists"/>
						<div class="grid grid-cols-2 gap-4">
							<form-control id="dateStart" label="Start date" type="date" v-model:value="settings.dateStart" :min="dateMin" :max="settings.dateEnd"/>
							<form-control id="dateEnd" label="End date" type="date" v-model:value="settings.dateEnd" :min="settings.dateStart" :max="dateMax"/>
						</div>
					</div>
				</Col>
				<Col>
					<div ref="svg"></div>
				</Col>
				<Col width="fit" v-if="artists.length">
					<div class="text-center mb-4">
						<v-button @click="download">Download as png</v-button>
					</div>
					<h1 class="mb-2">Top 15 Artists</h1>
					<ol class="list-decimal list-inside">
						<li v-for="i in 15" :key="i"><span class="text-white font-medium">{{artists[i-1].name}}</span>: {{artists[i-1].count}} times</li>
					</ol>

				</Col>
			</Row>
		</Container>
		<Container class="bg-zinc-800 py-3">
			<Row>
				<Col width="fit">
					Made by <a href="https://maximumfx.nl/" target="_blank">MaximumFX</a>
				</Col>
				<Col width="fit" class="ml-auto">
					<a href="https://github.com/MaximumFX/spotify-graph/" target="_blank">GitHub</a>
				</Col>
			</Row>
		</Container>
	</main>
</template>

<script>
import Row from "@/components/Row.vue";
import Container from "@/components/Container.vue";
import Col from "@/components/Col.vue";
import VButton from "@/components/VButton.vue";
import Graph, {GroupBy, formatDate} from "@/js/Graph";
import FormControl from "@/components/FormControl";
import { saveAs } from 'file-saver';

function getSVGString(svgNode) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	const cssStyleText = getCSSStyles(svgNode);
	appendCSS(cssStyleText, svgNode);

	const serializer = new XMLSerializer();
	var svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

	return svgString;

	function getCSSStyles(parentElement) {
		let c;
		let i;
		const selectorTextArr = [];

		// Add Parent element Id and Classes to the list
		selectorTextArr.push('#' + parentElement.id);
		for (c = 0; c < parentElement.classList.length; c++)
			if (!contains('.' + parentElement.classList[c], selectorTextArr))
				selectorTextArr.push('.' + parentElement.classList[c]);

		// Add Children element Ids and Classes to the list
		const nodes = parentElement.getElementsByTagName("*");
		for (i = 0; i < nodes.length; i++) {
			const id = nodes[i].id;
			if (!contains('#' + id, selectorTextArr))
				selectorTextArr.push('#' + id);

			const classes = nodes[i].classList;
			for (c = 0; c < classes.length; c++)
				if (!contains('.' + classes[c], selectorTextArr))
					selectorTextArr.push('.' + classes[c]);
		}

		// Extract CSS Rules
		let extractedCSSText = "";
		for (i = 0; i < document.styleSheets.length; i++) {
			const s = document.styleSheets[i];

			try {
				if (!s.cssRules) continue;
			} catch (e) {
				if (e.name !== 'SecurityError') throw e; // for Firefox
				continue;
			}

			const cssRules = s.cssRules;
			for (let r = 0; r < cssRules.length; r++) {
				if (contains(cssRules[r].selectorText, selectorTextArr))
					extractedCSSText += cssRules[r].cssText;
			}
		}


		return extractedCSSText;

		function contains(str, arr) {
			return arr.indexOf(str) !== -1;
		}

	}

	function appendCSS(cssText, element) {
		const styleElement = document.createElement("style");
		styleElement.setAttribute("type", "text/css");
		styleElement.innerHTML = cssText;
		const refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore(styleElement, refNode);
	}
}
const svgString2Image = (svgString, width, height) => new Promise((resolve) => {
	// var format = format ? format : 'png';
	console.log(1)
	const imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))) // Convert SVG string to data URL

	console.log(2)
	const canvas = document.createElement("canvas")
	const context = canvas.getContext("2d")

	console.log(3)
	canvas.width = width
	canvas.height = height

	const image = new Image()
	console.log(4)
	image.onload = () => {
		console.log(6)
		context.clearRect(0, 0, width, height)
		context.drawImage(image, 0, 0, width, height)

		console.log(7)
		canvas.toBlob((blob) => {
			console.log(8)
			const filesize = Math.round(blob.length / 1024) + ' KB'
			resolve({blob, filesize})
		})
	}
	image.onerror = err => console.error(err)
	image.src = imgsrc
	console.log(5)
})

export default {
	name: 'App',
	components: {FormControl, VButton, Col, Container, Row},
	data() {
		return {
			files: [],
			svg: '',
			loading: false,
			showSettings: false,
			settings: {
				graphWidth: 1920,
				graphHeight: 800,
				minMs: 1000,
				minPlays: 250,
				ignoreArtists: '',
				groupBy: GroupBy.MONTH,
				dateStart: formatDate(new Date()),
				dateEnd: formatDate(new Date()),
			},
			dateMin: formatDate(new Date()),
			dateMax: formatDate(new Date()),

			groupBy: Object.entries(GroupBy).filter(a => isNaN(Number(a[0]))).map(a => ({id: a[1], name: a[0]})),
			artists: []
		}
	},
	created() {
		console.log(GroupBy.MONTH)
	},
	methods: {
		previewFiles(event) {
			for (const file of event.target.files) {
				const reader = new FileReader()
				reader.onload = (event) => {
					this.files.push(JSON.parse(event.target.result))
					this.updateDates()
				}
				reader.readAsText(file)
			}
		},
		updateDates() {
			const dates = [...new Set([...this.files].flat().map(a => a.endTime.split(' ')[0]))].sort((a, b) => a.localeCompare(b))
			this.dateMin = this.settings.dateStart = dates[0]
			this.dateMax = this.settings.dateEnd = dates[dates.length - 1]
			console.log(dates[0], dates[dates.length - 1])
		},
		async createGraph() {
			console.log('Creating graph', this.settings)
			this.$refs.svg.innerHTML = ''
			this.artists = []
			this.loading = true
			//todo file & settings validation
			if (this.files.length) {
				setTimeout(async () => {
					try {
						const graph = await Graph.createArtistGraph(this.files, this.settings)
						this.$refs.svg.appendChild(graph.chart)
						this.artists = Object.entries(graph.artistCount).map(a => ({name: a[0], count: a[1]})).sort((a, b) => b.count - a.count)
						this.loading = false
					} catch (e) {
						console.error(e)
						this.loading = false
					}
				}, 1000)
			}
		},
		async download() {
			console.log('Creating png')
			const data = await svgString2Image(getSVGString(this.$refs.svg.firstChild), this.settings.graphWidth, this.settings.graphHeight, 'png')
			saveAs( data.blob, 'spotify-chart.png' )
		}
	}
}
</script>

<style>
html, body {
	@apply bg-zinc-900 text-zinc-400
}

main {
	min-height: 100vh;
}
</style>
