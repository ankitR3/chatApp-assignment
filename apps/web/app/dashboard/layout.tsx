
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className='flex min-h-screen dark:bg-[#f3f4f6] bg-black transition-colors'>
            <main>{children}</main>
        </div>
    )
}