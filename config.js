const fs = require('fs-extra');
const glob = require('glob');
const md5 = require('md5');
// const path = require('path');

// const MINING_RATE = 60000;

// const initialBalance = 5;

function mineDifficulty(startTime, endTime, difficulty){
    let changeDifficulty = difficulty;
    if(changeDifficulty < 1){
        changeDifficulty = 1;
        return changeDifficulty;
    } else if(endTime - startTime > 30000){
        changeDifficulty = changeDifficulty - 1;
        return changeDifficulty;
    } else if(endTime - startTime < 30000){
        changeDifficulty = changeDifficulty + 1;
        return changeDifficulty;
    }
}

function minerDifficulty(difficulty){
    let changeDifficulty = difficulty;
    let randomDifficulty = Math.floor(Math.random() * 2);
    if(changeDifficulty < 1){
        changeDifficulty = 1;
        return changeDifficulty;
    } else if(randomDifficulty){
        changeDifficulty = changeDifficulty + 1;
        return changeDifficulty;
    } else if(!randomDifficulty){
        changeDifficulty = changeDifficulty - 1;
        return changeDifficulty;
    }
}

// checking and making folders-------------------------------------------------------------------------
async function createFolders(path){
    let checkFolder = await promiseFolder(path).then(res => {return true;}).catch(error => {return false;});
    if(checkFolder){
        return true;
    } else {
        let makeFolders = await makeFolder(path).then(res => {return true;}).catch(error =>{return false;});
        if(makeFolders){
            return true;
        } else {
            return false;
        }
    }
}
function promiseFolder(path){
    return new Promise((resolve, reject) => {
        fs.access(path, error => {
            if(error){
                reject(new Error('can not promise a folder'));
            } else {
                resolve(true);
            }
        });
    });
}
function makeFolder(path){
    return new Promise((resolve, reject) => {
        fs.mkdir(path, {recursive: true}, error => {
            if(error){
                reject(new Error('can not make folder'));
            } else {
                resolve(true);
            }
        });
    });
}
// checking and making folders---------------------------------------------------------------------------

function writeDataFile(path, data){
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, error => {
            if(error){
                console.log(error)
                reject(new Error('can not write file'));
            } else {
                resolve(true);
            }
        });
    });
}

// ---------------------------------------------- delete folders and files --------------------------------
async function deleteFolder(folder){
    let removed = await fs.remove(folder).then(res => {return true;}).catch(error => {console.log(error);return false;});
    return removed;
}
// ---------------------------------------------- delete folders and files --------------------------------

function readDataFile(path){
    return new Promise((resolve, reject) => {
        fs.readFile(path, (error, data) => {
            if(error){
                reject(new Error('can not read file'));
            } else if(data){
                resolve(data);
                // console.log('loadWallet', this.balance, this.publicKey, this.privateKey);
            }
        });
    });
}

function folderName(num){
    return Math.round(num/1000) * 1000;
}

function helpReward(){
    if(Number(process.env.HELP)){
        let giveAmount;
        let keepAmount;
        if(!Number(process.env.GIVE) || Number(process.env.GIVE) > 100){
            giveAmount = 50;
            keepAmount = 100 - giveAmount;
        } else {
            giveAmount = Number(process.env.GIVE);
            keepAmount = 100 - giveAmount;
        }
        return {help: true, give: giveAmount, keep: keepAmount};
    } else {
        return {help: false, give: null, keep: null};
    }
}

function helperReward(data){
    if(Number(data.help)){
        let giveAmount;
        let keepAmount;
        if(!Number(data.give) || Number(data.give) > 100){
            giveAmount = 50;
            keepAmount = 100 - giveAmount;
        } else {
            giveAmount = Number(data.give);
            keepAmount = 100 - giveAmount;
        }
        return {help: true, give: giveAmount, keep: keepAmount};
    } else {
        return {help: false, give: null, keep: null};
    }
}

function removeTransaction(transaction, pending){
    pending = pending.filter(data => {return data.txid !== transaction.txid});
}

function removePost(post, pending){
    pending = pending.filter(data => {return data.pid !== post.pid});
}

async function removeMedia(media, pending){
    let deletedFile = await fs.unlink(__dirname + '/base/files/' + media.media).then(res => {console.log(res);return true;}).catch(error => {console.log(error); return false;});
    deletedFile ? console.log('deleted invalid media') : console.log('could not delete invalid media');
    pending = pending.filter(data => {return data.mid !== media.mid});
}

function mainCheck(data){
    const files = glob.sync(data + '/**/*.js', {ignore: [data + '/node_modules/**', data + '/base/**', data + '/data/**', '.env', '.gitignore']});
    files.sort();
    let allFiles = '';
    for(let i = 0;i < files.length;i++){
        allFiles += fs.readFileSync(files[i]);
    }
    allFiles = allFiles.replace(/\s+/g, '');
    let everyFiles = md5(allFiles);
    console.log(everyFiles);
    fs.writeFileSync('./.webchain', everyFiles);
    return everyFiles;
}

function sideCheck(checksum, checksums){
    if(checksums.includes(checksum)){
        console.log('checksum is good');
    } else {
        console.log('checksum of this chain has been changed, exitting');
        process.exit(0);
    }
}

module.exports = {mineDifficulty, folderName, createFolders, writeDataFile, readDataFile, promiseFolder, makeFolder, deleteFolder, helpReward, minerDifficulty, helperReward, mainCheck, sideCheck};