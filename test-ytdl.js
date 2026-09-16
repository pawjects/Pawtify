const ytdl = require('ytdl-core');
ytdl.getInfo('lYBUbBu4W08').then(info => console.log('success')).catch(err => console.error(err));
