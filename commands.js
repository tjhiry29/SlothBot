module.exports = Commands = function() {
  this.registered_commands = [];
  this.prefix = "";
}

Commands.prototype.prefix = function(prefix) {
  this.prefix = prefix;
  return this;
}

Commands.prototype.on = function(input) {
  registered_command = checkRegistration(input); //Check to see if anything matches this input.
  if (registered_command != null) {
    match = buildMatch(match, options.params);
    var result = input.match(match);
    callback(result);
  } else {
    console.log("Couldn't process input, ${input}");
  }
}

Commands.prototype.checkRegistration = function(input) {
  for(command of Object.keys(registered_commands)) { //get keys
     if (input.match(command)) { //compare keys.
       return {match: command, options: registered_commands[command]}; // return the whole set.
     }
  }
  return null;
}

// Store registered commands as {match: options hash + callback}
Commands.prototype.register = function(match, options={}, callback) {
  options.callback = callback;
  this.registered_commands[match] = options;
  return this;
}

function buildMatch(match, params=0) {
  match = this.prefix + match;
  for (var i = 0; i < params; i++)  {
    match += "(.+)";
  }
  return match;
}
