import blogIndex from '@/../public/blogs/index.json'
import EditBlogPage from './edit-blog-page'

export function generateStaticParams() {
	return (blogIndex as { slug: string }[]).map(({ slug }) => ({ slug }))
}

export default function Page() {
	return <EditBlogPage />
}
