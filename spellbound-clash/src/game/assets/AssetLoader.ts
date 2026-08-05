export function loadAsset(path: string): HTMLImageElement {
  const image = new Image();
  image.src = path;
  return image;
}

export function loadAssets(paths: string[]): HTMLImageElement[] {
  return paths.map((path) => loadAsset(path));
}
