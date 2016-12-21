// A simple command parser.
// Register your commands with options and a callback.
// Then use 'on' to parse the input and return any params if necessary.

// Options for now expects a params if available.

module.exports = Commands = function() {
  this.registered_commands = [];
  this.prefix = "";
}

Commands.prototype.setPrefix = function(prefix) {
  this.prefix = prefix;
  return this;
}

// Pass through is meant to be a discord message. I'd prefer not to do it this way,
// as I'd prefer to keep this module completely independent of knowledge of Discord-js
// so it can be used as a command processer for anything else.
Commands.prototype.on = function(input, pass_through) {
  if (this.prefix != "" && !input.match("^" + this.prefix)) return;
  var registered_command = this.checkRegistration(input); //Check to see if anything matches this input.
  if (registered_command) {
    var result = null;
    if (registered_command.result) {
      result = registered_command.result
    } else {
      var match = buildMatch(registered_command.command, registered_command.params, this.prefix);
      result = input.match(match);
    }
    registered_command.callback(pass_through, result);
  } else {
    console.log("Couldn't process input," + input);
  }
}

Commands.prototype.checkRegistration = function(input) {
  for(var command of Object.keys(this.registered_commands)) {
     if (input.match("\\b" + command + "\\b")) {
       return this.registered_commands[command];
     }
  }
  return null;
}

// Store registered commands as {match: options hash + callback}
Commands.prototype.register = function(command, options={}, callback) {
  options.callback = callback;
  options.command = command;
  this.registered_commands[command] = options;
  return this;
}

function buildMatch(match, params=0, prefix="") {
  match = prefix + match;
  for (var i = 0; i < params; i++)  {
    match += " (.+)";
  }
  return match;
}
