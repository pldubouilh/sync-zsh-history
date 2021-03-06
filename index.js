#! /usr/bin/env node

var path = require('path');
var fs = require('fs');

var home = process.env.HOME;

var destFile = home + '/.zsh_history';

// process.argv: [node path, file path, arg[0] ]
var syncFile = process.argv[2];

function readFile(path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, 'utf8', function(err, data) {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(data.split('\n: ').filter(function(command) {
        return command && command.length;
      }).map(function(command) {
        command = command.replace(/(\\| )$/igm, '');
        if (command.slice(0, 2) !== ': ') {
          return ': ' + command + '\n';
        }
        return command + '\n';
      }));
    });
  });

}

function writeFile(path, content) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(path, content, 'utf8', function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(content);
      }
    });
  });
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

Promise.all([readFile(home + '/.zsh_history'), readFile(syncFile)])
  .then(function(values) {
    var sourceItems = values[0];
    var newItems = values[1];
    var items = [];
    Array.prototype.push.apply(items, sourceItems);
    Array.prototype.push.apply(items, newItems);
    items = items.filter(onlyUnique).sort();

    var newContent = items.join('');
    writeFile(destFile, newContent).then(function() {
      writeFile(syncFile, newContent);
      console.log('merge succeed! \nexisted commands '
        + sourceItems.length
        + '\nnew commands '
        + newItems.length
        + '\nduplicated '
        + (sourceItems.length + newItems.length - items.length)
        + '\ntotal ' + items.length);
    });

  });
