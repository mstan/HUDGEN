// dependencies
let fs = require('fs'); // filesystem reader.
let vdf = require('simple-vdf-mstan'); //translating VDF <-> JSON
let deepmerge = require('deepmerge'); // recursive json reading
let deepdiff = require('deep-diff'); // compare deep differences
let readdirp = require('readdirp'); // recursive dir reading
let mkdirp = require('mkdirp'); // create directories that don't exist
let debug = require('debug')('HUDGEN:diff');
let _ = require('lodash');

let { copy, validateVDF } = require('./lib');
let { DUPLICATE_KEY } = require('./config.js')


// configuration for readdirp
let config = {
    root: __dirname + '/src/custom/', // our "base file list" is user modified files
    fileFilter: [ '*.res', '*.txt', '*.vdf'] // txt for animations, res for all else
}

// run readdirp with the above config
readdirp(config)
    .on('data', (entry) => {
        let fileType = entry.name.split('.')[1];

        if(fileType == 'res') {
            // if it is a res file, try to compare and parse
            try {
                compare(entry)
            // while crude, right now we're going to see if the error is ENOENT
            } catch(e) {
                let isFileMissing = e.message.toString().indexOf('ENOENT') > -1;

                // If it IS file missing error, parsing was presumably okay
                // Just copy it for now, then.
                if(isFileMissing) {
                    // copy it instead
                    copy(entry, 'diff')
                } else {
                    // actually throw the error
                    //throw new Error(e);
                }
            }
        } else if (fileType == 'txt') {
            copy(entry,'diff');
        } else if (fileType == 'vdf') {
            copy(entry,'diff');
        }
    })



// a function to take a user VDF piece, and merge it into the base file
function compare(entry) {
    let { path, parentDir, fullParentDir } = entry;
    debug(`Handling data for ${path} (${fullParentDir})`)

    let custom = fs.readFileSync(`${__dirname}/src/custom/${path}`, 'utf8');
        custom = validateVDF(custom);
        custom = vdf.parse(custom, DUPLICATE_KEY);

    let original = fs.readFileSync(`${__dirname}/src/official/${path}`, 'utf8');
        original = validateVDF(original);
        original = vdf.parse(original, DUPLICATE_KEY);



    let diff = deepdiff(custom, original);
    let output = {};

    // there was no difference. break out.
    if(!diff) return;

    // compare each and build structure based on results
    diff.forEach(function(element) {
        // kind is the type of modification
        // path is the json path structuring
        // rhs is right hand side element
        let { kind, path, lhs, rhs } = element;

        // we only want new or edited properties
        if(kind == 'N') {
            debug(`New Element`); // this means the custom one did not have it, but stock needs to
            //debug(element);
            _.set(output, path, rhs);
        } else if(kind =='E') {
            debug('Edited Element'); // this means the element differs from stock. we prefer the custom one.
            //debug(element);
            _.set(output, path, lhs);
        } else if(kind == 'D') {
            debug('Deleted element.') // this means this was added in the custom one, not in stock. add these.
            debug(element);
            _.set(output,path,lhs);
        }
    })

    output = vdf.stringify(output, true, DUPLICATE_KEY);

    mkdirp(`${__dirname}/src/diff/${parentDir}`, (err) => {
        if(err) throw new Error(err);
        fs.writeFileSync(`${__dirname}/src/diff/${path}`, output, 'utf8');
    });
}
