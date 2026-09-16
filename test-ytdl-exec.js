const youtubedl = require('youtube-dl-exec');
youtubedl('https://www.youtube.com/watch?v=lYBUbBu4W08', {
  dumpJson: true,
  noWarnings: true,
  noCallHome: true,
  noCheckCertificate: true,
  preferFreeFormats: true,
  youtubeSkipDashManifest: true,
  referer: 'https://www.youtube.com/'
}).then(output => {
  const formats = output.formats.filter(f => f.vcodec === 'none' && f.acodec !== 'none');
  console.log('Audio URL:', formats.length > 0 ? formats[0].url : 'None found');
}).catch(console.error);
