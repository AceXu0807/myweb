'use client'

import { useMemo } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from '../app/(home)/stores/config-store'
import { CARD_SPACING } from '@/consts'
import MusicSVG from '@/svgs/music.svg'
import PlaySVG from '@/svgs/play.svg'
import { HomeDraggableLayer } from '../app/(home)/home-draggable-layer'
import { Pause } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useMusicPlayer } from '@/hooks/use-music-player'

export default function MusicCard() {
	const pathname = usePathname()
	const router = useRouter()
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const styles = cardStyles.musicCard
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard
	const calendarCardStyles = cardStyles.calendarCard
	const { tracks, currentIndex, isPlaying, progress, duration, togglePlayPause } = useMusicPlayer()
	const currentTrack = tracks[currentIndex]

	const isHomePage = pathname === '/'
	const isMusicPage = pathname === '/music'

	const position = useMemo(() => {
		if (!isHomePage) {
			return { x: center.width - styles.width - 16, y: center.height - styles.height - 16 }
		}

		return {
			x: styles.offsetX !== null ? center.x + styles.offsetX : center.x + CARD_SPACING + hiCardStyles.width / 2 - styles.offset,
			y: styles.offsetY !== null ? center.y + styles.offsetY : center.y - clockCardStyles.offset + CARD_SPACING + calendarCardStyles.height + CARD_SPACING
		}
	}, [isHomePage, center, styles, hiCardStyles, clockCardStyles, calendarCardStyles])

	const { x, y } = position

	// The compact card is hidden on the full music page, while the shared audio keeps playing.
	if (isMusicPage || (!isHomePage && !isPlaying)) return null

	return (
		<HomeDraggableLayer cardKey='musicCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className={clsx('flex items-center gap-3', !isHomePage && 'fixed')}>
				<button type='button' aria-label='打开音乐面板' onClick={() => router.push('/music')} className='absolute inset-0 z-10 cursor-pointer rounded-[inherit]' />
				{siteContent.enableChristmas && (
					<>
						<img src='/images/christmas/snow-10.webp' alt='Christmas decoration' className='pointer-events-none absolute' style={{ width: 120, left: -8, top: -12, opacity: 0.8 }} />
						<img src='/images/christmas/snow-11.webp' alt='Christmas decoration' className='pointer-events-none absolute' style={{ width: 80, right: -10, top: -12, opacity: 0.8 }} />
					</>
				)}

				{currentTrack?.cover ? <img src={currentTrack.cover} alt='' className='pointer-events-none relative z-20 h-10 w-10 rounded-xl object-cover' /> : <MusicSVG className='pointer-events-none relative z-20 h-8 w-8' />}

				<div className='pointer-events-none relative z-20 min-w-0 flex-1'>
					<div className='text-secondary truncate text-sm'>{currentTrack?.title || '暂无音乐'}</div>
					<div className='mt-1 h-2 rounded-full bg-white/60'>
						<div className='bg-linear h-full rounded-full transition-all duration-300' style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
					</div>
				</div>

				<button type='button' onClick={() => void togglePlayPause()} className='relative z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white transition-opacity hover:opacity-80' aria-label={isPlaying ? '暂停' : '播放'}>
					{isPlaying ? <Pause className='text-brand h-4 w-4' /> : <PlaySVG className='text-brand ml-1 h-4 w-4' />}
				</button>
			</Card>
		</HomeDraggableLayer>
	)
}
