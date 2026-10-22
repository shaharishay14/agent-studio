// Sky is dark only: every page sits on night
function Layout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen bg-night text-white">{children}</div>
}

export default Layout;
