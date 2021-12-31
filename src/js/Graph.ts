// @ts-ignore
import Streamgraph from "./Streamgraph.js"

interface Song {
	endTime: string
	artistName: string
	trackName: string
	msPlayed: number
}
interface DatedArtist {
	date: string
	artistName: string
	count: number
}

interface GraphSettings {
	graphWidth: number
	graphHeight: number
	minMs: number
	minPlays: number
	ignoreArtists: string
	groupBy: GroupBy
	dateStart: string
	dateEnd: string
}

export enum GroupBy {
	DAY, WEEK, MONTH
}

export const formatDate = (date: Date) => {
	return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}
export default class Graph {
	static createArtistGraph = async (files: Song[][], {graphWidth, graphHeight, minMs, minPlays, ignoreArtists, groupBy, dateStart: dS, dateEnd: dE}: GraphSettings = {
		graphWidth: 1280,
		graphHeight: 800,
		minMs: 1000,
		minPlays: 250,
		ignoreArtists: '',
		groupBy: GroupBy.MONTH,
		dateStart: formatDate(new Date()),
		dateEnd: formatDate(new Date()),
	}) => {
		const artists: string[] = []
		const artistCount: {
			[key: string]: number
		} = {}
		const history: {
			[key: string]: string[]
		} = {}
		const allSongs: DatedArtist[] = []

		const ignoredArtists = ignoreArtists.split(',').map(a => a.trim())
		const dateStart = new Date(dS)
		const dateEnd = new Date(dE)

		// Load songs
		for (const file of files) {
			file.forEach((song: Song) => {
				if (song.msPlayed > minMs && !ignoredArtists.includes(song.artistName)) {
					const date = song.endTime.split(' ')[0]
					if (new Date(date) > dateStart && new Date(date) < dateEnd) {
						if (history.hasOwnProperty(date))
							history[date].push(song.artistName)
						else
							history[date] = [song.artistName]

						allSongs.push({
							date, artistName: song.artistName, count: 1
						})

						if (!artists.includes(song.artistName)) artists.push(song.artistName)
						if (!artistCount.hasOwnProperty(song.artistName)) artistCount[song.artistName] = 1
						else artistCount[song.artistName]++
					}
				}
			})
		}

		function getMonday(d: string) {
			const date = new Date(d)
			const day = date.getDay(),
				diff = date.getDate() - day + (day == 0 ? -6:1)
			return new Date(date.setDate(diff))
		}

		const grouped: {
			[key: string]: DatedArtist[]
		} = {};
		//add artists
		[...allSongs].forEach((value) => {
			const date: Date = new Date(value.date)
			let d: string = value.date
			if (groupBy === GroupBy.MONTH)
				d = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}`
			else if (groupBy === GroupBy.WEEK) {
				const monday = getMonday(value.date)
				d = `${monday.getFullYear()}-${(monday.getMonth()+1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`
			}
			else if (groupBy === GroupBy.DAY)
				d = value.date
			grouped[d] = grouped[d] || []
			if (grouped[d].some(a => a.artistName === value.artistName)) {
				// @ts-ignore
				grouped[d].find(a => a.artistName === value.artistName).count++
			}
			else grouped[d].push({...value, date: d})
		})

		//add artists with 0 count
		Object.keys(grouped).forEach(date => {
			artists.forEach(artist => {
				if (!grouped[date].find(b => b.artistName === artist))
					grouped[date].push({ date: date, artistName: artist, count: 0 })
			})
		})

		const groupedArray = (Object.values(grouped).flat() as DatedArtist[])
			.filter(a => artistCount[a.artistName] > minPlays)
			.sort((a, b) => a.date.localeCompare(b.date))

		const chart = Streamgraph(groupedArray, {
			x: (d: DatedArtist) => new Date(d.date),
			y: (d: DatedArtist) => d.count,
			z: (d: DatedArtist) => d.artistName,
			width: graphWidth, height: graphHeight
		})
		return {chart, artistCount}
	}
}
