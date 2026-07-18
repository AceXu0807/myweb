'use client'
import { PropsWithChildren, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useCenterInit } from '@/hooks/use-center'
import NavCard from '@/components/nav-card'
import { Toaster } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useSize, useSizeInit } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { ScrollTopButton } from '@/components/scroll-top-button'
import MusicCard from '@/components/music-card'

const BlurredBubblesBackground = dynamic(() => import('./backgrounds/blurred-bubbles'), { ssr: false })

export default function Layout({ children }: PropsWithChildren) {
	const [showBackgroundEffects, setShowBackgroundEffects] = useState(false)
	useCenterInit()
	useSizeInit()
	const { cardStyles, siteContent, regenerateKey } = useConfigStore()
	const { maxSM, init } = useSize()

	const backgroundImages = (siteContent.backgroundImages ?? []) as Array<{ id: string; url: string }>
	const currentBackgroundImageId = siteContent.currentBackgroundImageId
	const currentBackgroundImage =
		currentBackgroundImageId && currentBackgroundImageId.trim() ? backgroundImages.find(item => item.id === currentBackgroundImageId) : null

	useEffect(() => {
		const loadEffects = () => setShowBackgroundEffects(true)
		const idleCallback = window.requestIdleCallback?.(loadEffects, { timeout: 1200 })
		const timeoutId = idleCallback ? undefined : window.setTimeout(loadEffects, 900)

		return () => {
			if (idleCallback) window.cancelIdleCallback?.(idleCallback)
			if (timeoutId) window.clearTimeout(timeoutId)
		}
	}, [])

	return (
		<>
			<Toaster
				position='bottom-right'
				richColors
				icons={{
					success: <CircleCheckIcon className='size-4' />,
					info: <InfoIcon className='size-4' />,
					warning: <TriangleAlertIcon className='size-4' />,
					error: <OctagonXIcon className='size-4' />,
					loading: <Loader2Icon className='size-4 animate-spin' />
				}}
				style={
					{
						'--border-radius': '12px'
					} as React.CSSProperties
				}
			/>
			{currentBackgroundImage && (
				<div
					className='fixed inset-0 z-0 overflow-hidden'
					style={{
						backgroundImage: `url(${currentBackgroundImage.url})`,
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						backgroundRepeat: 'no-repeat'
					}}
				/>
			)}
			{showBackgroundEffects && <BlurredBubblesBackground colors={siteContent.backgroundColors} regenerateKey={regenerateKey} />}

			<main className='relative z-10 h-full'>
				{children}
				<NavCard />

				{!maxSM && cardStyles.musicCard?.enabled !== false && <MusicCard />}
			</main>

			{maxSM && init && <ScrollTopButton className='bg-brand/20 fixed right-6 bottom-8 z-50 shadow-md' />}
		</>
	)
}
