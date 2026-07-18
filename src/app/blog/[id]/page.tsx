import blogIndex from '@/../public/blogs/index.json'
import BlogDetailPage from './blog-detail-page'

export function generateStaticParams() {
	return (blogIndex as { slug: string }[]).map(({ slug }) => ({ id: slug }))
}

export default function Page() {
	return <BlogDetailPage />
}
