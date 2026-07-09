export function isGoogleDriveArchiveConfigured() {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
    process.env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID,
  );
}

export function googleDriveArchiveWarning() {
  if (isGoogleDriveArchiveConfigured()) return null;
  return "Google Drive archive is not configured; legal corpus search still works from Turso.";
}
