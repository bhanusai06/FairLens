const envBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  '';

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!envBaseUrl) {
    return normalizedPath;
  }

  return `${envBaseUrl.replace(/\/$/, '')}${normalizedPath}`;
}
