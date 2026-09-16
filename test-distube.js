const ytdl = require('@distube/ytdl-core');
ytdl.getInfo('lYBUbBu4W08').then(info => {
  let format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
  console.log('format url:', format.url);
}).catch(err => console.error(err.message));
