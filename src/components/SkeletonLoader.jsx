const Bar = ({ className = "" }) => <div className={`shimmer ${className}`} />;

const SkeletonCards = ({ count = 6 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <Bar className="w-10 h-10 rounded-lg" />
                    <Bar className="w-16 h-5 rounded-full" />
                </div>
                <Bar className="w-2/3 h-4 rounded" />
                <Bar className="w-1/3 h-3 rounded" />
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Bar className="w-9 h-9 rounded-full" />
                    <div className="flex-1 flex flex-col gap-2">
                        <Bar className="w-1/2 h-3 rounded" />
                        <Bar className="w-1/3 h-3 rounded" />
                    </div>
                </div>
            </div>
        ))}
    </>
);

const SkeletonTableRows = ({ rows = 5, columns = 5 }) => (
    <>
        {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b last:border-0">
                <td className="p-4">
                    <div className="flex items-center gap-3">
                        <Bar className="w-9 h-9 rounded-full" />
                        <div className="flex flex-col gap-2">
                            <Bar className="w-28 h-3 rounded" />
                            <Bar className="w-20 h-2.5 rounded" />
                        </div>
                    </div>
                </td>
                {Array.from({ length: Math.max(0, columns - 1) }).map((_, c) => (
                    <td key={c} className="p-4"><Bar className="w-16 h-3 rounded" /></td>
                ))}
            </tr>
        ))}
    </>
);

const SkeletonList = ({ rows = 4 }) => (
    <div className="flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
                <Bar className="w-8 h-8 rounded-full" />
                <div className="flex-1 flex flex-col gap-2">
                    <Bar className="w-3/4 h-3 rounded" />
                    <Bar className="w-1/2 h-2.5 rounded" />
                </div>
            </div>
        ))}
    </div>
);

// variant="cards" | "table" | "list"  — table returns bare <tr>s for use inside <tbody>
const SkeletonLoader = ({ variant = "cards", ...props }) => {
    if (variant === "table") return <SkeletonTableRows {...props} />;
    if (variant === "list") return <SkeletonList {...props} />;
    return <SkeletonCards {...props} />;
};

export default SkeletonLoader;