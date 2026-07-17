export interface MusicTrack {
	id: string
	title: string
	artist: string
	audio: string
	cover?: string
}

export interface PendingMusicUpload {
	trackId: string
	audioFile: File
	coverFile?: File
}
