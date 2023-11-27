export default function ViteInspect() {
  return (
    <div className="h-full w-full divide-y divide-indigo-900 bg-indigo-950">
      <div className="flex h-full w-full flex-col gap-2">
        <iframe src="http://localhost:4321/__inspect/" className="h-full w-full" />
      </div>
    </div>
  );
}
