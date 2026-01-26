interface YoutubePlayerProps {
  videoId: string;
  title?: string;
}

export function YoutubePlayer({ videoId, title = "YouTube video" }: YoutubePlayerProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

export default YoutubePlayer;
