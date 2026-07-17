'use client'

import { createBlob, createCommit, createTree, getRef, toBase64Utf8, type TreeItem, updateRef } from '@/lib/github-client'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { getFileExt } from '@/lib/utils'
import type { MusicTrack, PendingMusicUpload } from '../types'

export async function pushMusic(tracks: MusicTrack[], upload: PendingMusicUpload): Promise<MusicTrack[]> {
	const token = await getAuthToken()
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const treeItems: TreeItem[] = []

	const audioHash = await hashFileSHA256(upload.audioFile)
	const audioExt = getFileExt(upload.audioFile.name) || '.mp3'
	const audioPath = `public/music/uploads/${audioHash}${audioExt}`
	const audioBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, await fileToBase64NoPrefix(upload.audioFile), 'base64')
	treeItems.push({ path: audioPath, mode: '100644', type: 'blob', sha: audioBlob.sha })

	let coverUrl: string | undefined
	if (upload.coverFile) {
		const coverHash = await hashFileSHA256(upload.coverFile)
		const coverExt = getFileExt(upload.coverFile.name) || '.jpg'
		const coverPath = `public/images/music/${coverHash}${coverExt}`
		const coverBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, await fileToBase64NoPrefix(upload.coverFile), 'base64')
		treeItems.push({ path: coverPath, mode: '100644', type: 'blob', sha: coverBlob.sha })
		coverUrl = coverPath.replace('public', '')
	}

	const updatedTracks = tracks.map(track =>
		track.id === upload.trackId ? { ...track, audio: audioPath.replace('public', ''), cover: coverUrl } : track
	)
	const listBlob = await createBlob(
		token,
		GITHUB_CONFIG.OWNER,
		GITHUB_CONFIG.REPO,
		toBase64Utf8(JSON.stringify(updatedTracks, null, '\t')),
		'base64'
	)
	treeItems.push({ path: 'src/app/music/list.json', mode: '100644', type: 'blob', sha: listBlob.sha })

	const tree = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, refData.sha)
	const commit = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, '添加音乐', tree.sha, [refData.sha])
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commit.sha)

	return updatedTracks
}
