import React from 'react';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 5 }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg run-in-sequence">
            <div className="animate-pulse">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center px-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-200">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="flex items-center px-6 py-4 space-x-4">
                            {Array.from({ length: columns }).map((_, j) => (
                                <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
