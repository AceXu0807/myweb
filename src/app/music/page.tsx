'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Disc3, ListMusic, Music2, Pause, Play, Plus, SkipBack, SkipForward, Upload, Volume2, X } from 'lucide-react'
import { toast } from 'sonner'
import initialList from './list.json'
import type { MusicTrack } from './types'
import { pushMusic } from './services/push-music'
import { useAuthStore } from '@/hooks/use-auth'
import { DialogModal } from '@/components/dialog-modal'
import { cn } from '@/lib/utils'

const MAX_AUDIO_SIZE = 25 * 1024 * 1024

export default function MusicPage() {
	const [tracks, setTracks] = useState<MusicTrack[]>(initialList as MusicTrack[])
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isPlaying, setIsPlaying] = useState(false)
	const [progress, setProgress] = useState(0)
	const [duration, setDuration] = useState(0)
	const [volume, setVolume] = useState(0.8)
	const [uploadOpen, setUploadOpen] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const audioRef = useRef<HTMLAudioElement>(null)
	const keyInputRef = useRef<HTMLInputElement>(null)
	const { isAuth, setPrivateKey } = useAuthStore()
	const currentTrack = tracks[currentIndex]

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return
		audio.volume = volume
	}, [volume])

	useEffect(() => {
		setProgress(0)
		setDuration(0)
		if (isPlaying) audioRef.current?.play().catch(() => setIsPlaying(false))
	}, [currentIndex])

	const selectTrack = (index: number) => {
		setCurrentIndex(index)
		setIsPlaying(true)
	}

	const togglePlay = async () => {
		const audio = audioRef.current
		if (!audio) return
		if (audio.paused) {
			await audio.play()
			setIsPlaying(true)
		} else {
			audio.pause()
			setIsPlaying(false)
		}
	}

	const moveTrack = (direction: 1 | -1) => {
		if (!tracks.length) return
		setCurrentIndex(index => (index + direction + tracks.length) % tracks.length)
		setIsPlaying(true)
	}

	const handleAddClick = () => {
		if (isAuth) setUploadOpen(true)
		else keyInputRef.current?.click()
	}

	const handleKeyFile = async (file: File) => {
		try {
			setPrivateKey(await file.text())
			setUploadOpen(true)
			toast.success('密钥已导入，可以上传音乐了')
		} catch {
			toast.error('密钥读取失败')
		}
	}

	const handleUpload = async (data: { title: string; artist: string; audioFile: File; coverFile?: File }) => {
		if (data.audioFile.size > MAX_AUDIO_SIZE) {
			toast.error('MP3 文件不能超过 25MB')
			return
		}

		setIsSaving(true)
		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
		const nextTracks = [...tracks, { id, title: data.title, artist: data.artist, audio: '' }]

		try {
			const publishedTracks = await pushMusic(nextTracks, { trackId: id, audioFile: data.audioFile, coverFile: data.coverFile })
			setTracks(publishedTracks)
			setCurrentIndex(publishedTracks.length - 1)
			setUploadOpen(false)
			toast.success('音乐已发布，Vercel 正在更新')
		} catch (error) {
			console.error(error)
			toast.error('上传失败，请检查 GitHub App 权限后重试')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className='mx-auto min-h-screen w-full max-w-6xl px-5 pt-28 pb-24 sm:px-8'>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async event => {
					const file = event.target.files?.[0]
					if (file) await handleKeyFile(file)
					event.currentTarget.value = ''
				}}
			/>

			<div className='mb-8'>
				<div>
					<div className='text-brand mb-2 flex items-center gap-2 text-sm font-medium'><Music2 className='h-4 w-4' /> MUSIC</div>
					<h1 className='text-3xl font-bold sm:text-4xl'>音乐收藏室</h1>
					<p className='text-secondary mt-2 text-sm'>在旋律里留一会儿，收藏此刻想听的声音。</p>
				</div>
			</div>

			<div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]'>
				<motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className='card relative overflow-hidden p-5 sm:p-8'>
					<div className='grid items-center gap-8 sm:grid-cols-[minmax(220px,320px)_1fr]'>
						<div className='relative mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-[2rem] bg-white/40 shadow-xl'>
							{currentTrack?.cover ? (
								<img src={currentTrack.cover} alt={`${currentTrack.title} 封面`} className='h-full w-full object-cover' />
							) : (
								<div className='from-brand/25 to-brand-secondary/25 flex h-full items-center justify-center bg-gradient-to-br'><Disc3 className={cn('text-brand h-28 w-28', isPlaying && 'animate-spin [animation-duration:8s]')} /></div>
							)}
						</div>

						<div className='min-w-0 text-center sm:text-left'>
							<p className='text-secondary text-xs tracking-[0.25em] uppercase'>Now Playing</p>
							<h2 className='mt-3 truncate text-2xl font-bold'>{currentTrack?.title || '暂无音乐'}</h2>
							<p className='text-secondary mt-1 truncate'>{currentTrack?.artist || '—'}</p>

							<div className='mt-8'>
								<input
									type='range'
									min={0}
									max={duration || 0}
									value={Math.min(progress, duration || 0)}
									onChange={event => {
										const time = Number(event.target.value)
										if (audioRef.current) audioRef.current.currentTime = time
										setProgress(time)
									}}
									className='accent-brand w-full'
								/>
								<div className='text-secondary mt-1 flex justify-between text-xs'><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
							</div>

							<div className='mt-6 flex items-center justify-center gap-4 sm:justify-start'>
								<button onClick={() => moveTrack(-1)} className='rounded-full bg-white/55 p-3 transition hover:bg-white/80' aria-label='上一首'><SkipBack className='h-5 w-5' /></button>
								<button onClick={togglePlay} className='bg-brand flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105' aria-label={isPlaying ? '暂停' : '播放'}>
									{isPlaying ? <Pause className='h-7 w-7' /> : <Play className='ml-1 h-7 w-7' />}
								</button>
								<button onClick={() => moveTrack(1)} className='rounded-full bg-white/55 p-3 transition hover:bg-white/80' aria-label='下一首'><SkipForward className='h-5 w-5' /></button>
							</div>

							<div className='mt-6 flex items-center gap-3'><Volume2 className='text-secondary h-4 w-4' /><input type='range' min={0} max={1} step={0.05} value={volume} onChange={event => setVolume(Number(event.target.value))} className='accent-brand w-full max-w-44' /></div>
						</div>
					</div>

					{currentTrack && (
						<audio
							ref={audioRef}
							src={currentTrack.audio}
							onTimeUpdate={event => setProgress(event.currentTarget.currentTime)}
							onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)}
							onPlay={() => setIsPlaying(true)}
							onPause={() => setIsPlaying(false)}
							onEnded={() => moveTrack(1)}
						/>
					)}
				</motion.section>

				<motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className='card relative flex min-h-[620px] flex-col p-4 sm:p-5'>
					<div className='mb-4 flex items-center gap-2 px-2'><ListMusic className='text-brand h-5 w-5' /><h2 className='font-bold'>播放列表</h2><span className='text-secondary ml-auto text-xs'>{tracks.length} 首</span></div>
					<div className='min-h-0 flex-1 space-y-2 overflow-y-auto pr-1'>
						{tracks.map((track, index) => (
							<button key={track.id} onClick={() => selectTrack(index)} className={cn('flex w-full items-center gap-3 rounded-2xl p-3 text-left transition', index === currentIndex ? 'bg-white/75 shadow-sm' : 'hover:bg-white/45')}>
								<div className='h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/50'>{track.cover ? <img src={track.cover} alt='' className='h-full w-full object-cover' /> : <Music2 className='text-brand m-3 h-6 w-6' />}</div>
								<div className='min-w-0 flex-1'><p className='truncate text-sm font-semibold'>{track.title}</p><p className='text-secondary truncate text-xs'>{track.artist}</p></div>
								{index === currentIndex && isPlaying ? <Pause className='text-brand h-4 w-4' /> : <Play className='text-secondary h-4 w-4' />}
							</button>
						))}
					</div>
					<div className='mt-5 border-t border-white/35 pt-4'>
						<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAddClick} className='brand-btn w-full justify-center gap-2 px-4 py-3'>
							<Plus className='h-4 w-4' /> {isAuth ? '添加音乐' : '导入密钥并添加'}
						</motion.button>
					</div>
				</motion.aside>
			</div>

			{uploadOpen && <MusicUploadDialog saving={isSaving} onClose={() => !isSaving && setUploadOpen(false)} onSubmit={handleUpload} />}
		</div>
	)
}

function MusicUploadDialog({ saving, onClose, onSubmit }: { saving: boolean; onClose: () => void; onSubmit: (data: { title: string; artist: string; audioFile: File; coverFile?: File }) => void }) {
	const [title, setTitle] = useState('')
	const [artist, setArtist] = useState('')
	const [audioFile, setAudioFile] = useState<File | null>(null)
	const [coverFile, setCoverFile] = useState<File | null>(null)
	const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : null), [coverFile])

	useEffect(() => {
		return () => {
			if (coverPreview) URL.revokeObjectURL(coverPreview)
		}
	}, [coverPreview])

	return (
		<DialogModal open onClose={onClose} disableCloseOnOverlay={saving} className='card w-full max-w-lg p-6'>
			<div className='mb-5 flex items-center justify-between'><div><h2 className='text-xl font-bold'>添加音乐</h2><p className='text-secondary mt-1 text-xs'>MP3 最大 25MB，封面支持常见图片格式。</p></div><button onClick={onClose} disabled={saving} className='rounded-full p-2 hover:bg-white/60'><X className='h-5 w-5' /></button></div>
			<form
				onSubmit={event => {
					event.preventDefault()
					if (!title.trim() || !artist.trim() || !audioFile) return toast.error('请填写歌名、歌手并选择 MP3')
					onSubmit({ title: title.trim(), artist: artist.trim(), audioFile, coverFile: coverFile || undefined })
				}}
				className='space-y-4'>
				<div className='grid grid-cols-2 gap-3'><label className='text-secondary text-sm'>歌名<input value={title} onChange={event => setTitle(event.target.value)} className='mt-1 w-full rounded-xl border bg-white/55 px-3 py-2.5 text-primary' /></label><label className='text-secondary text-sm'>歌手<input value={artist} onChange={event => setArtist(event.target.value)} className='mt-1 w-full rounded-xl border bg-white/55 px-3 py-2.5 text-primary' /></label></div>
				<label className='flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed bg-white/35 p-4 transition hover:bg-white/55'><Upload className='text-brand h-6 w-6' /><div className='min-w-0'><p className='text-sm font-medium'>{audioFile?.name || '选择 MP3 文件'}</p><p className='text-secondary text-xs'>点击浏览本地文件</p></div><input type='file' accept='audio/mpeg,.mp3' className='hidden' onChange={event => setAudioFile(event.target.files?.[0] || null)} /></label>
				<label className='flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed bg-white/35 p-4 transition hover:bg-white/55'>
					<div className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/50'>{coverPreview ? <img src={coverPreview} alt='封面预览' className='h-full w-full object-cover' /> : <Music2 className='text-brand h-6 w-6' />}</div>
					<div><p className='text-sm font-medium'>{coverFile?.name || '选择封面（可选）'}</p><p className='text-secondary text-xs'>JPG、PNG、WebP</p></div><input type='file' accept='image/*' className='hidden' onChange={event => setCoverFile(event.target.files?.[0] || null)} />
				</label>
				<button type='submit' disabled={saving} className='brand-btn w-full justify-center py-3'>{saving ? '正在上传并发布…' : '上传音乐'}</button>
			</form>
		</DialogModal>
	)
}

function formatTime(seconds: number) {
	if (!Number.isFinite(seconds)) return '0:00'
	const minutes = Math.floor(seconds / 60)
	return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
}
