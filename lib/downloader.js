var path = require('path');
var url = require('url');
var http = require('http');
var fs = require('fs');
var write_file;
//what global variable do we have?
var complete = false;
var content_length = 0;
var downloaded_bytes = 0;

exports.download = function(remote_file, local_file, num) {
    return new  Promise((resolve, reject) => {
        console.log('filenames', remote_file, local_file, num );
        if ( num > 3 ) {
            console.log( 'Too many redirects' );
        }
        //remember who we are
        var self = this;
        //set some default values
        var redirect = false;
        var new_remote = null;
        var write_to_file = false;
        var write_file_ready = false;
        //parse the url of the remote_file file
        var u = url.parse(remote_file);
        //set the options for the 'get' from the remote_file file
        var opts = {
            host: u.hostname,
            port: u.port,
            path: u.pathname
        };
        //get the file
        var request = http.get(opts, function(response ) {
            switch(response.statusCode) {
                case 200:
                    //this is good
                    //what is the content length?
                    content_length = response.headers['content-length'];
                    break;
                case 302:
                    new_remote = response.headers.location;
                    self.download(new_remote, local_file, num+1 );
                    return;
                    break;
                case 403:
                    console.error(response.headers);
                    reject("Error 403: Not Authorized to view resource");
                case 404:
                    console.log("File Not Found");
                    reject("Error 404: File Not Found")

                default:
                    //what is default in this situation? 404?
                    request.abort();
                    reject();
                    return;
            }
            response.on('data', function(chunk) {
                //are we supposed to be writing to file?
                if(!write_file_ready) {
                    //set up the write file
                    write_file = fs.createWriteStream(local_file);
                    write_file_ready = true;
                }
                write_file.write(chunk);
                downloaded_bytes+=chunk.length;
                percent = parseInt( (downloaded_bytes/content_length)*100 );
                console.log( percent );
            });
            response.on('end', function() {
                complete = true;
                write_file.end();
                console.log('successfully wrote the file');
                resolve({
                    success: true,
                })
            });
        });
        request.on('error', function(e) {
            console.log("Got error: " + e.message);
            reject ({
                message: "Error: " + e
            })
        });
    })
}
