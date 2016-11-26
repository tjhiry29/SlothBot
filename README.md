# SlothBot
Discord Bot that plays Youtube Videos.

Using [Lethe.js](https://github.com/meew0/Lethe) as assistance for this project.

# TODO:
- Add node-opus to package.json
- Install ffmpeg
- Set up a server.
- Test functionality.
- Find a better way to load up your discord token.

# Potential Upcoming Features:
- Maybe set up an esports live updater (That's going to be hard and lots of work)

# Installation:
- Clone this repo `git clone https://github.com/tjhiry29/SlothBot.git`
- Install node-opus first. `npm install node-opus` There are probably going to be a bunch of issues, especially on Windows.
- Install ffmpeg with `sudo apt-get ffmpeg` or [here](ffmpeg.zeranoe.com/builds/)
- Make sure you have npm installed, and run `npm install`
- Put your discord token into a file called config.js.
    The contents should look a little something like this.
```
const token = "...";
exports.getToken = function() {
    return token;
}
module.exports = exports;
```
- To run the bot run `npm start`

# Commands:
- `ping` bot will return pong in the same channel.
- `-play 'youtubelink'` Will queue video and play if the queue is empty.
    - Ensure that the `youtubelink` looks something like:  https://youtube.com/watch?v=x where 'x' is the video code.
