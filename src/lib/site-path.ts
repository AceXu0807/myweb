const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function withBasePath(path: string | undefined) {
	if (!path || !path.startsWith('/') || path.startsWith('//')) return path || ''
	return `${basePath}${path}`
}
