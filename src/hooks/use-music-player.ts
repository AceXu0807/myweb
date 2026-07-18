'use client'

import { create } from 'zustand'
import initialList from '@/app/music/list.json'
import type { MusicTrack } from '@/app/music/types'
import { withBasePath } from '@/lib/site-path'

type MusicPlayerState = {
	tracks: MusicTrack[]
	currentIndex: number
	isPlaying: boolean
	progress: number
	duration: number
	volume: number
	setTracks: (tracks: MusicTrack[]) => void
	selectTrack: (index: number, autoplay?: boolean) => Promise<void>
	togglePlayPause: () => Promise<void>
	previousTrack: () => Promise<void>
	nextTrack: () => Promise<void>
	seek: (time: number) => void
	setVolume: (volume: number) => void
}

let sharedAudio: HTMLAudioElement | null = null

function ensureAudio() {
	if (typeof window === 'undefined') return null
	if (sharedAudio) return sharedAudio

	sharedAudio = new Audio()
	sharedAudio.volume = useMusicPlayer.getState().volume
	sharedAudio.addEventListener('timeupdate', () => useMusicPlayer.setState({ progress: sharedAudio?.currentTime || 0 }))
	sharedAudio.addEventListener('loadedmetadata', () => useMusicPlayer.setState({ duration: sharedAudio?.duration || 0 }))
	sharedAudio.addEventListener('play', () => useMusicPlayer.setState({ isPlaying: true }))
	sharedAudio.addEventListener('pause', () => useMusicPlayer.setState({ isPlaying: false }))
	sharedAudio.addEventListener('ended', () => void useMusicPlayer.getState().nextTrack())

	return sharedAudio
}

export const useMusicPlayer = create<MusicPlayerState>((set, get) => ({
	tracks: initialList as MusicTrack[],
	currentIndex: 0,
	isPlaying: false,
	progress: 0,
	duration: 0,
	volume: 0.8,

	setTracks: tracks => {
		const currentId = get().tracks[get().currentIndex]?.id
		const currentIndex = Math.max(0, tracks.findIndex(track => track.id === currentId))
		set({ tracks, currentIndex })
	},

	selectTrack: async (index, autoplay = true) => {
		const { tracks } = get()
		if (!tracks.length) return
		const nextIndex = (index + tracks.length) % tracks.length
		const track = tracks[nextIndex]
		const audio = ensureAudio()
		if (!audio) return

		const source = withBasePath(track.audio)
		const expectedSource = new URL(source, window.location.origin).href
		if (audio.src !== expectedSource) {
			audio.pause()
			audio.src = source
			audio.load()
			set({ currentIndex: nextIndex, progress: 0, duration: 0, isPlaying: false })
		} else {
			set({ currentIndex: nextIndex })
		}

		if (autoplay) {
			try {
				await audio.play()
			} catch {
				set({ isPlaying: false })
			}
		}
	},

	togglePlayPause: async () => {
		const { tracks, currentIndex } = get()
		if (!tracks.length) return
		const audio = ensureAudio()
		if (!audio) return

		if (audio.paused) {
			if (!audio.src) {
				await get().selectTrack(currentIndex)
				return
			}
			try {
				await audio.play()
			} catch {
				set({ isPlaying: false })
			}
		} else {
			audio.pause()
		}
	},

	previousTrack: async () => {
		const { tracks, currentIndex } = get()
		if (tracks.length) await get().selectTrack(currentIndex - 1)
	},

	nextTrack: async () => {
		const { tracks, currentIndex } = get()
		if (tracks.length) await get().selectTrack(currentIndex + 1)
	},

	seek: time => {
		const audio = ensureAudio()
		if (!audio) return
		audio.currentTime = time
		set({ progress: time })
	},

	setVolume: volume => {
		const normalizedVolume = Math.min(1, Math.max(0, volume))
		const audio = ensureAudio()
		if (audio) audio.volume = normalizedVolume
		set({ volume: normalizedVolume })
	}
}))
