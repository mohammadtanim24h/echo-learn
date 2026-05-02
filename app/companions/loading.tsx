export default function CompanionsSkeleton() {
    return (
        <main>
            <section className="flex justify-between gap-4 max-sm:flex-col mb-6">
                <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-4">
                    <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
            </section>
            <section className="companions-grid mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="companion-card animate-pulse bg-gray-200"
                    >
                        <div className="flex justify-between items-center">
                            <div className="h-6 w-20 bg-gray-300 rounded" />
                            <div className="w-4 h-4 bg-gray-300 rounded" />
                        </div>
                        <div className="h-7 w-3/4 bg-gray-300 rounded mt-4" />
                        <div className="h-4 w-full bg-gray-300 rounded mt-2" />
                        <div className="h-4 w-1/2 bg-gray-300 rounded mt-2" />
                        <div className="flex items-center gap-2 mt-4">
                            <div className="w-4 h-4 bg-gray-300 rounded" />
                            <div className="h-4 w-24 bg-gray-300 rounded" />
                        </div>
                        <div className="h-10 w-full bg-gray-300 rounded mt-4" />
                    </div>
                ))}
            </section>
        </main>
    );
}
