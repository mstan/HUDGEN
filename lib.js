let mkdirp = require('mkdirp'); // create directories that don't exist
let fs = require('fs'); // filesystem reader.
let debug = require('debug')('HUDGEN:lib');

function copy(entry,dir) {
    let { name, path, parentDir, fullParentDir } = entry;

    if(name == 'hudanimations_tf.txt') debug('WARN: Using hudanmiations_tf.txt is not recommended. Use manifest instead.');

    mkdirp(`${__dirname}/src/${dir}/${parentDir}`, (err) => {
        if(err) throw new Error(err);
        fs.copyFileSync(`${__dirname}/src/custom/${path}`, `${__dirname}/src/${dir}/${path}`);
    });
}

function validateVDF(data) {
    data = data.replace(/(?:^\/{2}.+\n?)+/, ''); // strip comments
    /*
        For some reason if you have a VDF object, it's key value doesn't need quotes.
        This screws up the parser here because it needs quotes, so we have to implement
        our own check

        object {
    
        }

        "object" {
    
        }

         are both somehow valid
    */
    function checkForKeyQuotes(dataLine) {
        // get a set of all quote combinations in the string
        let quoteSets = 
        dataLine
        .trim() // trim whitespace
        .match(/(["'])(?:(?=(\\?))\2.)*?\1/) // regex to match quote sets
        // becaue .match returns null instead of an empty array if none are found, do this
        quoteSets = quoteSets || [];
        let hasQuotes = !!quoteSets.length;


        return hasQuotes;
    }


    let outputLines = [];
    let dataLines = 
        data
        .replace(/\t/g, '') // remove tabs
        .split(/\r?\n|\r/g) // split  by newline

    for(let i = 0; i < dataLines.length; i++) {
        let line = dataLines[i];

        // if the current line is '{', check to see if the last line needs
        // modification
        if(line == '{') {
            let headerHasQuotes = checkForKeyQuotes(dataLines[i-1]);

            if(!headerHasQuotes) {
                outputLines[i-1] = `"${dataLines[i-1]}"`;
            }
        }

        outputLines.push(line);
    }

    return outputLines.join('\n');
}

module.exports = {
    copy,
    validateVDF
}