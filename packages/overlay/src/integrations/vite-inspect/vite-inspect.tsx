export default function ViteInspect() {
  return (
    <div className="divide-primary-900 bg-primary-950 h-full w-full divide-y">
      <div className="flex h-full w-full flex-col gap-2">
        <iframe title="vite-inspect" src="http://localhost:4321/__inspect/" className="h-full w-full" />
      </div>
    </div>
  );
}
