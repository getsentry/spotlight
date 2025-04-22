os=$(uname -s | tr '[:upper:]' '[:lower:]' | cut -c -7)
arch=$(uname -m | tr '[:upper:]' '[:lower:]' | cut -c -7)
suffix=''

if [ "$os" = "linux" ]; then
  os='linux'
elif [ "$os" = "darwin" ]; then
  os='darwin'
elif [ "$os" = "msys_nt" ]; then
  os='win'
  suffix='.exe'
else
  echo "Unsupported OS: $os"
  exit 1
fi

if [ "$arch" = "x86_64" ]; then
  arch='x64'
elif [ "$arch" = "aarch64" ]; then
  arch='arm64'
elif [ "$arch" = "arm64" ]; then
  arch='arm64'
else
  echo "Unsupported architecture: $arch"
  exit 1
fi

spotlight_path='~/.local/bin/spotlight'
spotlight_file="spotlight-$os-$arch$suffix"
mkdir -p $(dirname $spotlight_path)
echo "Downloading $spotlight_file..."
curl --progress-bar -fL "https://github.com/getsentry/spotlight/releases/latest/download/$spotlight_file" -o $spotlight_path
chmod +x $spotlight_path
echo "Spotlight installed to $spotlight_path"
echo "Run 'rm $spotlight_path' to uninstall"
$spotlight_path
