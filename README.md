# SlothBot
Discord Bot that plays Youtube Videos.

Using [Lethe.js](https://github.com/meew0/Lethe) as assistance for this project.

# TODO:
- User Permissions
- Set up a server.
- Find a better way to load up your discord token. (I'm sure a JSON object is way better.)

# Potential Upcoming Features:
- Maybe set up an esports live updater (That's going to be hard and lots of work)

# Installation:
- Make sure you have the bot setup on your discord developer portal
- Clone this repo `git clone https://github.com/tjhiry29/SlothBot.git`
- Install node-opus first. `npm install node-opus` There are probably going to be a bunch of issues, especially on Windows.
- Install ffmpeg with `sudo apt-get install ffmpeg` or [here](ffmpeg.zeranoe.com/builds/)
- Make sure you have npm installed, and run `npm install`
- To run the bot run `npm start DISCORD_API_KEY='...' YOUTUBE_API_KEY='...'`
	- You don't need the youtube api key for now (you can't search youtube videos though), but you do need the discord api key. (For obvious reasons)

# Commands:
- `-commmands` displays a list of commands.
- `-play 'youtubelink or query'` Will queue video and play if the queue is empty.
    - Ensure that the `youtubelink` looks something like:  https://youtube.com/watch?v=x where 'x' is the video code.
- `-stop` stops the current video and moves to the next if any.
- `-next` stops the current video and moves to the next if any.
- `-vol (volume or empty)` has one optional argument. If an argument is passed and is valid it sets the volume. Otherwise it prints the volume.
