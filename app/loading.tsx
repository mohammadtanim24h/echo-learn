export default function HomeSkeleton() {
    return (
        <main>
            <h1 className="mb-4">Popular Companions</h1>
            <section className="home-section">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="companion-card animate-pulse bg-gray-200">
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
            <section className="home-section mb-6 flex gap-6">
                <div className="w-2/3 max-lg:w-full animate-pulse">
                    <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-gray-200 rounded-lg p-4 border border-gray-300">
                                <div className="h-6 w-3/4 bg-gray-300 rounded mb-2" />
                                <div className="h-4 w-full bg-gray-300 rounded mb-1" />
                                <div className="h-4 w-1/2 bg-gray-300 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-1/3 max-lg:w-full animate-pulse">
                    <div className="bg-gray-200 rounded-lg p-6 h-full flex flex-col justify-center items-center gap-4">
                        <div className="w-16 h-16 bg-gray-300 rounded-full" />
                        <div className="h-8 w-full bg-gray-300 rounded" />
                        <div className="h-4 w-full bg-gray-300 rounded" />
                        <div className="h-10 w-full bg-gray-300 rounded mt-4" />
                    </div>
                </div>
            </section>
        </main>
    );
}
