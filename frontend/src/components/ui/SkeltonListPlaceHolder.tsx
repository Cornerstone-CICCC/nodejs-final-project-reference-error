export const skeletonListPlaceholder = ({ count = 4 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, id) => (
        <div
          // NOTE: Using index as key is not recommended, but in this case it's acceptable
          // because the list is static and does not change during the component's lifecycle.
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={id}
          className="w-full p-4 border border-gray-200 rounded-lg shadow animate-pulse dark:border-gray-700"
        >
          <div className="h-4 bg-gray-200 rounded-full w-1/3 mb-2.5" />
          <div className="h-3 bg-gray-200 rounded-full w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        </div>
      ))}
    </div>
  );
};
