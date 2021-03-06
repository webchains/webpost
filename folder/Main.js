const express = require('express');
const Post = require('./Post.js');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const md5 = require('md5');
const multer = require('multer');
// const Trees = require('./Tree.js');
const slowDown = require("express-slow-down");
const rateLimit = require("express-rate-limit");
const MongoStore = require('rate-limit-mongo');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
// const Struct = require('./Struct.js');
const https = require('https');
const http = require('http');
const Category = require('./Category.js');
const EC = require('elliptic').ec;
const {startFunc} = require('../config.js');
const {URL, URLSearchParams} = require('url');

class Main {
    constructor(checksum){
        this.checksum = checksum;
        this.type = process.env.TYPE;
        this.genesisAddress = process.env.ADDRESS;
        if(this.type === 'adminban'){
            this.admins = [];
            this.bans = [];
        } else if(this.type === 'adminclosed'){
            this.admins = [];
            this.mods = [];
        } else if(this.type === 'ban'){
            this.bans = [];
        } else if(this.type === 'closed'){
            this.mods = [];
        }
        this.index = process.env.INDEX;
        if(this.index === 'redirect'){
            this.redirect = process.env.REDIRECT;
        }
        this.updates = [];
        this.name = process.env.NAME;
        this.about = process.env.ABOUT;
        this.count = 0;
        this.ec = new EC('secp256k1');
        this.secureDomain = Number(process.env.SECUREDOMAIN);
        if(this.secureDomain){
            this.address = startFunc('https/wss');
        } else {
            this.address = startFunc('http/ws');
        }
        this.port = Number(process.env.PORT);
        this.secureServer = Number(process.env.SECURESERVER);
        if(this.secureServer){
            this.certificate = {cert: process.env.CERTFILE, key: process.env.CERTKEY};
        }
        this.server = null;
        this.heartbeat = Number(process.env.HEARTBEAT);
        // if(this.heartbeat){
        //     this.beats = [];
        // }
        this.proxy = Number(process.env.PROXY);
        this.limitConnections = Number(process.env.LIMITCONNECTIONS);
        this.dbRandom = process.env.RANDOM;
        this.dbName = 'mongodb://localhost:27017/' + md5(this.dbRandom);
        this.peerAddress = {httpurl: process.env.PEERHTTPURL, wsurl: process.env.PEERWSURL};
        // this.sockets = [];
        this.sockets = new Set();

        this.MESSAGE_TYPE = {
            beat: 'BEAT',
            update: 'UPDATE',
            admin: 'ADMIN',
            mod: 'MOD',
            ban: 'BAN',
            post: 'POST',
            reply: 'REPLY',
            interests: 'INTERESTS',
            category: 'CATEGORY'
        };
        
        this.app = express();

        this.app.use(cors());
        this.app.use(express.static('base'));
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(bodyParser.json());
        this.app.use(morgan('dev'));
        this.package = process.env.PACKAGE;
        if(this.proxy){
            this.app.enable('trust proxy');
        }
        if(this.limitConnections){
            this.limitDB = new MongoStore({uri: this.dbName, collectionName: 'limitRate'});
            this.slowDB = new MongoStore({uri: this.dbName, collectionName: 'slowRate'});
            this.limitContentConnect = rateLimit({windowMs: 60000, max: 20, store: this.limitDB});
            this.slowContentConnect = slowDown({windowMs: 60000, delayAfter: 10, delayMs: 2000, store: this.slowDB});
            this.app.use('/posts', this.limitContentConnect, this.slowContentConnect);
        }

        if(this.type === 'adminclosed'){
            this.system = (req, res, next) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || !req.body.category || typeof(req.body.category) !== 'string' || !/\w/.test(req.body.category) || req.body.category.length > 25 || this.main.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.main.genesisAddress && !this.main.admins.includes(this.main.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex')) && !this.main.mods.includes(this.main.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex')) || !req.file && !req.body.text){
                    return res.status(400).json('error');
                } else {
                    next();
                }
            }
        } else if(this.type === 'adminban'){
            this.system = (req, res, next) => {
                if(!req.body.main || typeof(req.body.main) !== 'string'  || !req.body.category || typeof(req.body.category) !== 'string' || !/\w/.test(req.body.category) || req.body.category.length > 25 || this.main.bans.includes(this.main.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex')) || !req.file && !req.body.text){
                    return res.status(400).json('error');
                } else {
                    next();
                }
            }
        } else if(this.type === 'ban'){
            this.system = (req, res, next) => {
                if(!req.body.main || typeof(req.body.main) !== 'string'  || !req.body.category || typeof(req.body.category) !== 'string' || !/\w/.test(req.body.category) || req.body.category.length > 25 || this.main.bans.includes(this.main.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex')) || !req.file && !req.body.text){
                    return res.status(400).json('error');
                } else {
                    next();
                }
            }
        } else if(this.type === 'closed'){
            this.system = (req, res, next) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || !req.body.category || typeof(req.body.category) !== 'string' || !/\w/.test(req.body.category) || req.body.category.length > 25 || this.main.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.main.genesisAddress && !this.main.mods.includes(this.main.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex')) || !req.file && !req.body.text){
                    return res.status(400).json('error');
                } else {
                    next();
                }
            }
        } else if(this.type === 'open'){
            this.system = (req, res, next) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || !req.body.category || typeof(req.body.category) !== 'string' || !/\w/.test(req.body.category) || req.body.category.length > 25 || !req.file && !req.body.text){
                    return res.status(400).json('error');
                } else {
                    next();
                }
            }
        }

        this.replySystems = (req, res, next) => {
            if(!req.body.main || typeof(req.body.main) !== 'string' || !req.file && !req.body.text){
                return res.status(400).json('error');
            } else {
                next();
            }
        }

        this.interestSystems = (req, res, next) => {
            if(!req.body.main || typeof(req.body.main) !== 'string'){
                return res.status(400).json('error');
            } else {
                next();
            }
        }

        this.categorySystems = (req, res, next) => {
            if(!req.body.category || !req.body.main){
                return res.status(400).json('error');
            } else {
                next();
            }
        }

        this.categorizeSystems = (req, res, next) => {
            if(req.params.category.length > 25 || !/\w/.test(req.params.category)){
                return res.status(400).json('error');
            } else {
                next();
            }
        }

        if(this.package === 'standard'){
            this.sizeLimit = 1000000;
            this.upload = multer({
                // configure multer storage -> saved directory and saved filename
                storage: multer.diskStorage({
                    destination: 'base/files',
                    filename: (req, file, cb) => {
                        cb(null, md5(Date.now() + file.originalname + file.filename) + path.extname(file.originalname));
                    }
                }),
                // limit files -> limit the file size to 1mb
                limits: { fileSize: this.sizeLimit }
            }).single('media');
        } else if(this.package === 'choose'){
            this.sizeLimit = Number(process.env.SIZELIMIT);
            this.upload = multer({
                // configure multer storage -> saved directory and saved filename
                storage: multer.diskStorage({
                    destination: 'base/files',
                    filename: (req, file, cb) => {
                        cb(null, md5(Date.now() + file.originalname + file.filename) + path.extname(file.originalname));
                    }
                }),
                // limit files -> limit the file size to 1mb
                limits: { fileSize: this.sizeLimit }
            }).single('media');
        } else if(this.package === 'unlimited'){
            this.upload = multer({
                // configure multer storage -> saved directory and saved filename
                storage: multer.diskStorage({
                    destination: 'base/files',
                    filename: (req, file, cb) => {
                        cb(null, md5(Date.now() + file.originalname + file.filename) + path.extname(file.originalname));
                    }
                })
            }).single('media');
        }

        if(this.index === 'html'){
            this.app.get('/', (req, res) => {
                return res.sendFile(path.resolve(__dirname, '../base/dist/index.html')); // potential update
                // return res.status(200).json('webcoin');
            });
        } else if(this.index === 'standard'){
            this.app.get('/', (req, res) => {
                // return res.sendFile(path.resolve(__dirname + '../base/dist/index.html')); // potential update
                return res.status(200).json('webpost');
            });
        } else if(this.index === 'redirect'){
            this.app.get('/', (req, res) => {
                return res.redirect(this.redirect);
            });
        }
        this.app.get('/updates', (req, res) => {
            return res.status(200).json(this.updates);
        });
        this.app.post('/updates', (req, res) => {
            if(!req.body.main || !req.body.checksum || this.genesisAddress !== this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') || this.updates.includes(req.body.checksum)){
                return res.status(400).json('error');
            } else {
                this.broadcastUpdate({type: 'update', update: req.body.checksum});
                this.updates.push(req.body.checksum);
                return res.status(200).json('success');
            }
        });
        this.app.delete('/updates', (req, res) => {
            if(!req.body.main || !req.body.checksum || this.genesisAddress !== this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') || !this.updates.includes(req.body.checksum)){
                return res.status(400).json('error');
            } else {
                this.broadcastUpdate({type: 'deupdate', update: req.body.checksum});
                this.updates = this.updates.filter(e => {return e !== req.body.checksum});
                return res.status(200).json('success');
            }
        });
        this.app.get('/data/posts/updated/:page/:limit', (req, res) => {
            Post.paginate({updated: {$ne: null}}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {updated: -1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/posts/popular/:page/:limit', (req, res) => {
            Post.paginate({popular: {$ne: null}}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {popular: 1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/posts/new/:page/:limit', (req, res) => {
            Post.paginate({updated: null, popular: null}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {timestamp: -1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/categories/hits/:page/:limit', (req, res) => {
            Category.paginate({}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {hit: -1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/categories/new/:page/:limit', (req, res) => {
            Category.paginate({updated: null, popular: null}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {timestamp: -1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/categories/updated/:page/:limit', (req, res) => {
            Category.paginate({updated: {$ne: null}}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {updated: -1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/categories/popular/:page/:limit', (req, res) => {
            Category.paginate({popular: {$ne: null}}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {popular: 1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/category/new/:category/:page/:limit', (req, res) => {
            Post.paginate({category: req.params.category, updated: null, popular: null}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {timestamp: -1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/category/updated/:category/:page/:limit', this.categorizeSystems, (req, res) => {
            Post.paginate({category: req.params.category, updated: {$ne: null}}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {updated: -1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/category/popular/:category/:page/:limit', this.categorizeSystems, (req, res) => {
            Post.paginate({category: req.params.category, popular: {$ne: null}}, {page: Number(req.params.page), limit: Number(req.params.limit), sort: {popular: 1}}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/post/:post', async (req, res) => {
            let post = await this.getPost(req.params.post);
            if(post){
                return res.status(200).json(post);
            } else {
                return res.status(400).json('error');
            }
        });
        this.app.get('/data', (req, res) => {
            return res.status(200).json({name: this.name, about: this.about, count: this.count, checksum: this.checksum, type: this.type, package: this.package});
        });
        this.app.get('/data/address/:address', (req, res) => {
            Post.find({user: req.params.address}, (error, data) => {
                if(error){
                    return res.status(500).json('error');
                } else if(data){
                    return res.status(200).json(data);
                }
            });
        });
        this.app.get('/data/category/upsert/:category', this.categorizeSystems, async (req, res) => {
            let categoryData = req.params.category;
            let count = await Post.find({category: categoryData}).count().exec();
            let mainCategory = await this.getCategory(categoryData);
            if(mainCategory){
                mainCategory.hit++;
                mainCategory.count = count;
                if(mainCategory.popular !== null){
                    mainCategory.popular = Date.now() - mainCategory.popular;
                } else {
                    mainCategory.popular = Date.now() - mainCategory.timestamp;
                }
                mainCategory.updated = Date.now();
                mainCategory.save();
                return res.status(200).json(mainCategory);
            } else {
                let hit = 1;
                let timestamp = Date.now();
                let popular = null;
                let updated = null;
                let categories = await this.categoryDB({category: categoryData, hit, count, timestamp, popular, updated});
                this.broadcastCategory({peer: this.address, category: categories, id: categoryData});
                return res.status(200).json(categories);
            }
        });
        this.app.get('/server', (req, res) => {
            return res.status(200).json(this.address);
        });
        this.app.post('/server', (req, res) => {
            if(!req.body.node || !req.body.type || req.body.type !== this.type || !req.body.checksum || this.checksum !== req.body.checksum && !this.updates.includes(req.body.checksum)){
                return res.status(400).json('error');
            } else {
                let connectPeer = req.body.node;
                this.connectNodePeer(connectPeer);
                return res.status(200).json({updates: this.updates, about: this.about, name: this.name, genesisAddress: this.genesisAddress, count: this.count});
            }
        });
        if(this.type === 'closed'){
            this.app.get('/mods', (req, res) => {
                return res.status(200).json(this.mods);
            });
            this.app.post('/mods', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    this.blockchain.mods.push(req.body.address);
                    this.broadcastMod({type: 'mod', mod: req.body.address});
                    return res.status(200).json(req.body.address + ' was added as an admin');
                }
            });
            this.app.delete('/mods', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    let addressIndex = this.blockchain.mods.indexOf(req.body.address);
                    if(addressIndex !== -1){
                        this.blockchain.mods.splice(addressIndex, 1);
                        this.broadcastMod({type: 'demod', mod: req.body.address});
                        return res.status(200).json(req.body.address + ' is removed from admins');
                    } else {
                        return res.status(200).json(req.body.address + ' is not an admin');
                    }
                }
            });
        } else if(this.type === 'ban'){
            this.app.get('/bans', (req, res) => {
                return res.status(200).json(this.bans);
            });
            this.app.post('/bans', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    this.blockchain.bans.push(req.body.address);
                    this.broadcastBan({type: 'ban', ban: req.body.address});
                    return res.status(200).json(req.body.address + ' was added to the bans');
                }
            });
            this.app.delete('/bans', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    let addressIndex = this.blockchain.bans.indexOf(req.body.address);
                    if(addressIndex !== -1){
                        this.blockchain.bans.splice(addressIndex, 1);
                        this.broadcastBan({type: 'deban', ban: req.body.address});
                        return res.status(200).json(req.body.address + ' is removed from bans');
                    } else {
                        return res.status(200).json(req.body.address + ' is not in bans');
                    }
                }
            });
        } else if(this.type === 'adminclosed'){
            this.app.get('/admins', (req, res) => {
                return res.status(200).json(this.admins);
            });
            this.app.post('/admins', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    this.blockchain.admins.push(req.body.address);
                    this.broadcastAdmin({type: 'admin', admin: req.body.address});
                    return res.status(200).json(req.body.address + ' was added as an admin');
                }
            });
            this.app.delete('/admins', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    let addressIndex = this.blockchain.admins.indexOf(req.body.address);
                    if(addressIndex !== -1){
                        this.blockchain.admins.splice(addressIndex, 1);
                        this.broadcastAdmin({type: 'deadmin', admin: req.body.address});
                        return res.status(200).json(req.body.address + ' is removed from admins');
                    } else {
                        return res.status(200).json(req.body.address + ' is not an admin');
                    }
                }
            });
            this.app.get('/mods', (req, res) => {
                return res.status(200).json(this.mods);
            });
            this.app.post('/mods', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    this.blockchain.mods.push(req.body.address);
                    this.broadcastMod({type: 'mod', mod: req.body.address});
                    return res.status(200).json(req.body.address + ' was added as an admin');
                }
            });
            this.app.delete('/mods', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    let addressIndex = this.blockchain.mods.indexOf(req.body.address);
                    if(addressIndex !== -1){
                        this.blockchain.mods.splice(addressIndex, 1);
                        this.broadcastMod({type: 'demod', mod: req.body.address});
                        return res.status(200).json(req.body.address + ' is removed from admins');
                    } else {
                        return res.status(200).json(req.body.address + ' is not an admin');
                    }
                }
            });
        } else if(this.type === 'adminban'){
            this.app.get('/admins', (req, res) => {
                return res.status(200).json(this.admins);
            });
            this.app.post('/admins', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    this.blockchain.admins.push(req.body.address);
                    this.broadcastAdmin({type: 'admin', admin: req.body.address});
                    return res.status(200).json(req.body.address + ' was added as an admin');
                }
            });
            this.app.delete('/admins', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress || !req.body.address || typeof(req.body.address) !== 'string'){
                    return res.status(400).json('error');
                } else {
                    let addressIndex = this.blockchain.admins.indexOf(req.body.address);
                    if(addressIndex !== -1){
                        this.blockchain.admins.splice(addressIndex, 1);
                        this.broadcastAdmin({type: 'deadmin', admin: req.body.address});
                        return res.status(200).json(req.body.address + ' is removed from admins');
                    } else {
                        return res.status(200).json(req.body.address + ' is not an admin');
                    }
                }
            });
            this.app.get('/bans', (req, res) => {
                return res.status(200).json(this.bans);
            });
            this.app.post('/bans', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || !req.body.address || typeof(req.body.address) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') === req.body.address || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress && !this.blockchain.admins.includes(this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex'))){
                    return res.status(400).json('error');
                } else {
                    this.blockchain.bans.push(req.body.address);
                    this.broadcastBan({type: 'ban', ban: req.body.address});
                    return res.status(200).json(req.body.address + ' was added to the bans');
                }
            });
            this.app.delete('/bans', (req, res) => {
                if(!req.body.main || typeof(req.body.main) !== 'string' || !req.body.address || typeof(req.body.address) !== 'string' || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') === req.body.address || this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') !== this.blockchain.genesisAddress && !this.blockchain.admins.includes(this.blockchain.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex'))){
                    return res.status(400).json('error');
                } else {
                    let addressIndex = this.blockchain.bans.indexOf(req.body.address);
                    if(addressIndex !== -1){
                        this.blockchain.bans.splice(addressIndex, 1);
                        this.broadcastBan({type: 'deban', ban: req.body.address});
                        return res.status(200).json(req.body.address + ' is removed from bans');
                    } else {
                        return res.status(200).json(req.body.address + ' is not in bans');
                    }
                }
            });
        }
        // this.app.post('/chain', (req, res) => {
        //     if(!req.body.peer || !req.body.type || req.body.type !== this.type || !req.body.checksum || this.checksum !== req.body.checksum && !this.updates.includes(req.body.checksum)){
        //         return res.status(400).json('error');
        //     } else {
        //         let connectPeer = {httpurl: req.body.peer.httpurl, wsurl: req.body.peer.wsurl};
        //         this.peers.push(connectPeer);
        //         this.connectNodePeer(connectPeer);
        //         return res.status(200).json({data: {latest: this.latest, peers: this.peers, updates: this.updates, checksum: this.checksum, about: this.about, current: this.current, name: this.name, genesisAddress: this.genesisAddress, state: {difficulty: this.difficulty, miningReward: this.miningReward}, transactions: this.count.transactions, posts: this.count.posts, medias: this.count.medias, type: this.type}});
        //     }
        // });
        // app.post('/main');
        this.app.get('/users', (req, res) => {
            let wallet = this.ec.genKeyPair();
            return res.status(200).json({name: this.name, about: this.about, privatekey: wallet.getPrivate('hex'), publickey: wallet.getPublic('hex'), message: 'NEVER SHARE YOUR PRIVATE KEY!!!!! ONLY USE YOUR PRIVATE KEY TO SEND COINS'});
        });
        this.app.post('/replies/:post', this.upload, this.replySystems, async (req, res) => {
            let post = await this.getPost(req.params.post);
            if(post){
                let text = req.body.text ? req.body.text : null;
                let media = req.file ? req.file.filename : null;
                let size = req.file ? req.file.size : null;
                let newPost = {timestamp: Date.now(), user: this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex'), text: text, media: media, size: size};
                post.replies.push(newPost);
                if(post.popular !== null){
                    post.popular = Date.now() - post.popular;
                } else {
                    post.popular = Date.now() - post.timestamp;
                }
                post.updated = Date.now();
                post.save();
                this.broadcastReply({peer: this.address, id: post._id, reply: newPost});
                return res.status(200).json(post);
            } else {
                return res.status(400).json('error');
            }
        });
        this.app.post('/interests/:post', this.interestSystems, async (req, res) => {
            let post = await this.getPost(req.params.post);
            if(post){
                let username = this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex');
                if(post.interests.includes(username)){
                    return res.status(400).json('error');
                } else {
                    post.interests.push(username);
                    if(post.popular !== null){
                        post.popular = Date.now() - post.popular;
                    } else {
                        post.popular = Date.now() - post.timestamp;
                    }
                    post.updated = Date.now();
                    post.save();
                    this.broadcastInterests({id: post._id, username});
                    return res.status(200).json(post);
                }
            } else {
                return res.status(400).json('error');
            }
        });
        // this.app.post('/categories', this.categorySystems, async (req, res) => {
        //     let categoryData = req.body.category;
        //     let mainCategory = await this.getCategory(categoryData);
        //     if(mainCategory){
        //         return res.status(400).json('error');
        //     } else {
        //         let id = nanoid();
        //         let categoryid = md5(this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex') + id);
        //         let userid = md5(this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex'));
        //         let hits = 0;
        //         let categories = await this.categoryDB({category: categoryData, id, categoryid, userid, hits});                      
        //         this.broadcastCategory({peer: {httpurl: this.address.httpurl, wsurl: this.address.wsurl}, category: categories, id: categoryData});
        //         return res.status(200).json(categories);
        //     }
        // });
        if(this.package === 'standard'){
            this.app.post('/posts', this.upload, this.system, async (req, res) => {
                let text = req.body.text ? req.body.text : null;
                let media = req.file ? req.file.filename : null;
                let size = req.file ? req.file.size : null;
                let category = req.body.category;
                let post = await this.postDB({timestamp: Date.now(), user: this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex'), text: text, media: media, category: category, replies: [], interests: [], size: size, popular: null, updated: null});                      
                this.broadcastPost({peer: this.address, post});
                this.count++;
                return res.status(200).json(post);
            });
            this.checkPost = async (post) => {
                if(!post.post.media){
                    await this.postDB(post.post);
                    this.count++;
                    // let newPost = await this.postDB(post.post);
                    // if(newPost.media){
                    //     this.downFiles(newPost.media, post.peer);
                    // }
                } else if(post.post.media && post.post.size < this.sizeLimit){
                    await this.postDB(post.post);
                    this.count++;
                    // let newPost = await this.postDB(post.post);
                    this.downFiles(post.post.media, post.peer);
                }
            }
        
            this.checkReply = async (posts) => {
                if(!posts.reply.media){
                    let newPost = await this.getPost(posts.id);
                    if(newPost){
                        newPost.replies.push(posts.reply);
                    if(newPost.popular !== null){
                        newPost.popular = Date.now() - newPost.popular;
                    } else {
                        newPost.popular = Date.now() - newPost.timestamp;
                    }
                    newPost.updated = Date.now();
                        newPost.save();
                    }
                } else if(posts.reply.media && posts.posts.size < this.sizeLimit){
                    let newPost = await this.getPost(posts.id);
                    if(newPost){
                        newPost.replies.push(posts.reply);
                    if(newPost.popular !== null){
                        newPost.popular = Date.now() - newPost.popular;
                    } else {
                        newPost.popular = Date.now() - newPost.timestamp;
                    }
                    newPost.updated = Date.now();
                        newPost.save();
                        // if(newPost.media){
                        //     this.downFiles(posts.posts.media, posts.peer);
                        // }
                        this.downFiles(posts.reply.media, posts.peer);
                    }
                }
            }
        } else if(this.package === 'choose'){
            this.app.post('/posts', this.upload, this.system, async (req, res) => {
                let text = req.body.text ? req.body.text : null;
                let media = req.file ? req.file.filename : null;
                let size = req.file ? req.file.size : null;
                let category = req.body.category;
                let post = await this.postDB({timestamp: Date.now(), user: this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex'), text: text, media: media, category: category, popular: null, updated: null, replies: [], interests: [], size: size});                      
                this.broadcastPost({peer: this.address, post});
                this.count++;
                return res.status(200).json(post);
            });
            this.checkPost = async (post) => {
                if(!post.post.media){
                    await this.postDB(post.post);
                    this.count++;
                    // let newPost = await this.postDB(post.post);
                    // if(newPost.media){
                    //     this.downFiles(newPost.media, post.peer);
                    // }
                } else if(post.post.media && post.post.size < this.sizeLimit){
                    await this.postDB(post.post);
                    this.count++;
                    // let newPost = await this.postDB(post.post);
                    this.downFiles(post.post.media, post.peer);
                }
            }
        
            this.checkReply = async (posts) => {
                if(!posts.reply.media){
                    let newPost = await this.getPost(posts.id);
                    if(newPost){
                        newPost.replies.push(posts.reply);
                    if(newPost.popular !== null){
                        newPost.popular = Date.now() - newPost.popular;
                    } else {
                        newPost.popular = Date.now() - newPost.timestamp;
                    }
                    newPost.updated = Date.now();
                        newPost.save();
                    }
                } else if(posts.reply.media && posts.posts.size < this.sizeLimit){
                    let newPost = await this.getPost(posts.id);
                    if(newPost){
                        newPost.replies.push(posts.reply);
                    if(newPost.popular !== null){
                        newPost.popular = Date.now() - newPost.popular;
                    } else {
                        newPost.popular = Date.now() - newPost.timestamp;
                    }
                    newPost.updated = Date.now();
                        newPost.save();
                        // if(newPost.media){
                        //     this.downFiles(posts.posts.media, posts.peer);
                        // }
                        this.downFiles(posts.reply.media, posts.peer);
                    }
                }
            }
        } else if(this.package === 'unlimited'){
            this.app.post('/posts', this.upload, this.system, async (req, res) => {
                let text = req.body.text ? req.body.text : null;
                let media = req.file ? req.file.filename : null;
                let size = req.file ? req.file.size : null;
                let category = req.body.category;
                let post = await this.postDB({timestamp: Date.now(), user: this.ec.keyFromPrivate(req.body.main, 'hex').getPublic('hex'), text: text, media: media, category: category, updated: null, popular: null, replies: [], interests: [], size: size});                      
                this.broadcastPost({peer: this.address, post});
                this.count++;
                return res.status(200).json(post);
            });
            this.checkPost = async (post) => {
                await this.postDB(post.post);
                this.count++;
                // let newPost = await this.postDB(post.post);
                if(post.post.media){
                    this.downFiles(post.post.media, post.peer);
                }
            }
        
            this.checkReply = async (posts) => {
                let newPost = await this.getPost(posts.id);
                if(newPost){
                    newPost.replies.push(posts.reply);
                    if(newPost.popular !== null){
                        newPost.popular = Date.now() - newPost.popular;
                    } else {
                        newPost.popular = Date.now() - newPost.timestamp;
                    }
                    newPost.updated = Date.now();
                    newPost.save();
                    // if(newPost.media){
                    //     this.downFiles(posts.posts.media, posts.peer);
                    // }
                    if(posts.reply.media){
                        this.downFiles(posts.reply.media, posts.peer);
                    }
                }
            }
        }
        this.app.get('*', (req, res) => {
            return res.status(200).json('not found');
        });
    }
    appListen(){
        if(this.secureServer){
            this.connect = https.createServer({cert: fs.readFileSync(this.certificate.cert), key: fs.readFileSync(this.certificate.key)}, this.app).listen(this.port, '0.0.0.0');
            console.log(`listening on for https on ${this.address.httpurl}`);
        } else {
            this.connect = http.createServer(this.app).listen(this.port, '0.0.0.0');
            console.log(`listening for http on ${this.address.httpurl}`);
        }
    }
    connectNode(){
        axios.post(this.peerAddress.httpurl + '/server', {node: this.address, type: this.type, checksum: this.checksum}, {timeout: 10000}).then(res => {
            let data = res.data;
            // this.checkSameType({type: data.type, checksum: data.checksum});
            this.syncChain(data);
        }).catch(error => {console.log(error + '\n' + 'could not connect');});
    }

    connectAdmins(){
        axios.get(this.peerAddress.httpurl + '/admins').then(res => {
            let data = res.data;
            this.admins = data;
        }).catch(error => {console.log(error + '\n' + 'could not connect');});
    }

    connectBans(){
        axios.get(this.peerAddress.httpurl + '/bans').then(res => {
            let data = res.data;
            this.bans = data;
        }).catch(error => {console.log(error + '\n' + 'could not connect');});
    }

    connectMods(){
        axios.get(this.peerAddress.httpurl + '/mods').then(res => {
            let data = res.data;
            this.mods = data;
        }).catch(error => {console.log(error + '\n' + 'could not connect');});
    }

    syncChain(data){
        this.name = data.name;
        this.about = data.about;
        this.updates = data.updates;
        this.genesisAddress = data.genesisAddress;
        this.count = data.count;
        if(this.type === 'adminclosed'){
            this.connectAdmins();
            this.connectMods();
        } else if(this.type === 'adminban'){
            this.connectAdmins();
            this.connectBans();
        } else if(this.type === 'ban'){
            this.connectBans();
        } else if(this.type === 'closed'){
            this.connectMods();
        }
        // console.log('peer 106',this.state.genesisHelp)
        console.log('replaced chain');
        console.log('connecting to peers and registering this peer');
    }

    // if the STARTUPDOWNLOAD option is on, then download all media files from the initial peer, default is off
    async getFiles(){
        let medias = await this.getMediasForDownload();
        for(let i = 0; i < medias.length; i++){
            if(medias[i].fromAddress !== 'REWARD'){
                this.downloadFiles(medias[i].media);
            }
        }
        console.log('done downloading all previous media');
    }

    getMediasForDownload(){
        let cursor = Media.find({}).cursor();
        return new Promise((resolve, reject) => {
            let fullMedias = [];
            cursor.on('data', data => {fullMedias.push(data);});
            cursor.on('end', () => {resolve(fullMedias);});
            cursor.on('error', error => {console.log(error);reject(false);});
        });
    }

    async downloadFiles(file){
        try {
            let res = await axios.get(`${this.peerAddress.httpurl}/files/${file}`, {responseType: 'stream'});
            res.data.pipe(fs.createWriteStream(__dirname + '/../base/files/' + file));
            console.log('got file from peer');
            // await new Promise((resolve, reject) => {
            //     res.data.on('error', error => reject(false));
            //     res.data.on('finish', () => resolve(true));
            // });
        } catch(error) {
            console.log('did not get file from peer');
            return false;
        }
    }

    async allFiles(medias, peer){
        for(let i = 0;i < medias.length;i++){
            if(medias[i].fromAddress !== 'REWARD'){
                let dataFile = await this.downFiles(medias[i].media, peer).then(res => {return res;}).catch(error => {return error;});
                if(dataFile){
                    console.log('got file');
                } else {
                    console.log('could not get file');
                }
            }
        }
        console.log('done getting all files for block');
    }

    async downFiles(file, peer){
        try {
            let res = await axios.get(`${peer.httpurl}/files/${file}`, {responseType: 'stream'});
            res.data.pipe(fs.createWriteStream(__dirname + '/../base/files/' + file));
            console.log('got file from peer');
            // await new Promise((resolve, reject) => {
            //     res.data.on('error', error => reject(false));
            //     res.data.on('finish', () => resolve(true));
            // });
        } catch(error) {
            console.log('did not get file from peer');
            return false;
        }
    }

    // start web socket server and listen to connections
    async servListen(){

        // const P2P_PORT = process.env.WSPORT;
        // const P2P_HOST = process.env.HOST;

        // create the p2p server with port as argument and also the host
        this.server = new WebSocket.Server({ server: this.connect });
        // this.server = new WebSocket.Server({ port: process.env.WSPORT, host: process.env.HOST, clientTracking: true });

        // event listener and a callback function for any new connection
        // on any new connection the current instance will send the current chain
        // to the newly connected peer
        this.server.on('connection', (socket, req) => {
            let url = new URL(this.address.wsurl + req.url);
            let address = {hash: url.searchParams.get('hash'), url: url.searchParams.get('url'), httpurl: url.searchParams.get('httpurl'), wsurl: url.searchParams.get('wsurl')};
            socket.address = address;
            this.connectSocket(socket);
            console.log('socket connected to server');
            // socket.on('open', () => {
            //     // console.log('socket connected to server');
            // });
            // socket.on('error', error => {
            //     console.log(error);
            //     this.removeSocket(socket.address.hash);
            // });
            // socket.on('close', (code, reason) => {
            //     console.log('peer disconnected', code, reason);
            //     this.removeSocket(socket.address.hash);
            //     // console.log('sockets length',this.sockets.length, this.sockets);
            //     // socket.terminate();
            // });
        });

        // event listener and callback for disconnections
        this.server.on('error', error => {
            console.log(error);
        });

        this.server.on('close', () => {
            console.log('a peer disconnected');
        });

        //------------------------------------------------------------------------------------------//
        // start the process of getting the chain from the intial peer and connecting to all peers
            await this.removeDB();
            this.connectNode();
        // this.connectToPeers();
        //------------------------------------------------------------------------------------------//

        console.log(`listening for wss on ${this.address.wsurl}`);
    }

    async removeDB(){
        await Post.deleteMany({});
        await Category.deleteMany({});
        return true;
    }

    connectNodePeer(peer){
            // create a socket for each peer
            let url = new URL(peer.wsurl);
            let queryParams = new URLSearchParams(url.search);
            queryParams.set('url', this.address.url);
            queryParams.set('hash', this.address.hash);
            queryParams.set('httpurl', this.address.httpurl);
            queryParams.set('wsurl', this.address.wsurl);
            const socket = new WebSocket(url.href + '?' + queryParams.toString());
            socket.address = peer;
            
            // open event listner is emitted when a connection is established
            // saving the socket in the array
            socket.on('open', async () => {
                await this.sendPost(socket);
                await this.sendCategory(socket);
                this.connectSocket(socket);
                // this.sockets.push(socket);
                this.sockets.add(socket);
                console.log("Socket connected");
            });
            socket.on('error', error => {
                console.log(error);
                // this.removeSocket(socket.address.hash);
                socket.close();
                // this.sockets.delete(socket);
            });
            socket.on('close', (code, reason) => {
                console.log('peer disconnected', code, reason);
                // this.removeSocket(socket.address.hash);
                this.sockets.delete(socket);
            });
    }

    // after making connection to a socket
    connectSocket(socket){

        let self = socket;
        if(this.heartbeat){
            self.beat = setInterval(() => {
                // console.log('ran heartbeat');
                // self.send(JSON.stringify("heartbeat"));
                self.send(JSON.stringify({
                    type: this.MESSAGE_TYPE.beat,
                    beat: "beat"
                  }));
            }, 30000);
        }

        // register a message event listener to the socket
        this.messageHandler(socket);
    }


    connectOnlyPeer(peer){
            // create a socket for each peer
            let url = new URL(peer.wsurl);
            let queryParams = new URLSearchParams(url.search);
            queryParams.set('url', this.address.url);
            queryParams.set('hash', this.address.hash);
            queryParams.set('httpurl', this.address.httpurl);
            queryParams.set('wsurl', this.address.wsurl);
            const socket = new WebSocket(url.href + '?' + queryParams.toString());
            socket.address = peer;
            
            // open event listner is emitted when a connection is established
            // saving the socket in the array
            socket.on('open', () => {
                this.connectSocket(socket);
                // this.sockets.push(socket);
                this.sockets.add(socket);
                console.log("Socket connected");
            });
            socket.on('error', error => {
                console.log(error);
                // this.removeSocket(socket.address.hash);
                socket.close();
                // this.sockets.delete(socket);
            });
            socket.on('close', (code, reason) => {
                console.log('peer disconnected', code, reason);
                // this.removeSocket(socket.address.hash);
                this.sockets.delete(socket);
            });
    }

    removeSocket(peer){
        for(let i = 0; i < this.sockets.length; i++){
            if(this.sockets[i].address.hash === peer || this.sockets[i].address.url === peer || this.sockets[i].address.httpurl === peer || this.sockets[i].address.wsurl === peer){
                if(this.sockets[i].beat){
                    clearInterval(this.sockets[i].beat);
                }
                this.sockets[i].close();
                // this.sockets[i].terminate();
                this.sockets.splice(i, 1);
                console.log('removed peer from main broadcast');
                return true;
                // break;
            }
        }
        // this.sockets.forEach((element, index, main) => {
        //     if(element.url === peer){
        //         main.splice(index, 1);
        //         console.log('removed peer from server');
        //     }
        // });
    }

    sendPost(socket){
        let cursor = Post.find({}).cursor();
        return new Promise((resolve, reject) => {
            cursor.on('data', data => {
                socket.send(JSON.stringify({type: this.MESSAGE_TYPE.post, post: {peer: this.address, post: data}}));
            });
            cursor.on('end', () => {
                resolve(true);
            });
            cursor.on('error', error => {
                console.log(error);
                reject(false);
            });
        });
    }

    sendCategory(socket){
        let cursor = Category.find({}).cursor();
        return new Promise((resolve, reject) => {
            cursor.on('data', data => {
                socket.send(JSON.stringify({type: this.MESSAGE_TYPE.category, category: {peer: this.address, id: data.category, category: data}}));
            });
            cursor.on('end', () => {
                resolve(true);
            });
            cursor.on('error', error => {
                console.log(error);
                reject(false);
            });
        });
    }

    broadcastUpdate(update){
        this.server.clients.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.update,
                update: update
              }));
        });
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.update,
                update: update
              }));
        });
    }

    broadcastAdmin(admin){
        this.server.clients.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.admin,
                admin: admin
              }));
        });
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.admin,
                admin: admin
              }));
        });
    }

    broadcastBan(ban){
        this.server.clients.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.ban,
                ban: ban
              }));
        });
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.ban,
                ban: ban
              }));
        });
    }

    broadcastMod(mod){
        this.server.clients.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.mod,
                mod: mod
              }));
        });
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.mod,
                mod: mod
              }));
        });
    }

    broadcastPost(post){
        this.server.clients.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.post,
                post: post
              }));
        });
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.post,
                post: post
              }));
        });
    }

    broadcastReply(reply){
        this.server.clients.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.reply,
                reply: reply
              }));
        });
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.reply,
                reply: reply
              }));
        });
    }

    broadcastInterests(interests){
        this.server.clients.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.interests,
                interests: interests
              }));
        });
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.interests,
                interests: interests
              }));
        });
    }

    broadcastCategory(category){
        this.server.clients.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.category,
                category: category
              }));
        });
        this.sockets.forEach(socket => {
            socket.send(JSON.stringify({
                type: this.MESSAGE_TYPE.category,
                category: category
              }));
        });
    }

    messageHandler(socket){
        //on recieving a message execute a callback function
        socket.on('message', async (message) => {
            const data = JSON.parse(message);
            // console.log("data ", data);

            switch(data.type){
                case this.MESSAGE_TYPE.admin:
                    // send the data to checkPeer() function to handle the data
                    this.checkAdmin(data.admin);
                    break;
                case this.MESSAGE_TYPE.post:
                    // send the data to checkPeer() function to handle the data
                    await this.checkPost(data.post);
                    break;
                case this.MESSAGE_TYPE.update:
                    // send the data to checkPeer() function to handle the data
                    this.checkUpdate(data.update);
                    break;
                case this.MESSAGE_TYPE.beat:
                    // send the data to checkPeer() function to handle the data
                    this.checkBeat(data.beat);
                    break;
                case this.MESSAGE_TYPE.ban:
                    // send the data to checkPeer() function to handle the data
                    this.checkBan(data.ban);
                    break;
                case this.MESSAGE_TYPE.mod:
                    // send the data to checkPeer() function to handle the data
                    this.checkMod(data.mod);
                    break;
                case this.MESSAGE_TYPE.reply:
                    // send the data to checkPeer() function to handle the data
                    await this.checkReply(data.reply);
                    break;
                case this.MESSAGE_TYPE.interests:
                    // send the data to checkPeer() function to handle the data
                    await this.checkInterests(data.interests);
                    break;
                case this.MESSAGE_TYPE.category:
                    // send the data to checkPeer() function to handle the data
                    await this.checkCategory(data.category);
                    break;
            }
            
        });
    }

    checkBeat(beat){
        console.log(beat + ' from node');
    }

    checkPeer(peer){
        this.connectOnlyPeer(peer);
        console.log('from peer');
    }

    async checkInterests(interests){
        let post = await this.getPost(interests.id);
        if(post){
            if(!post.interests.includes(interests.username)){
                post.interests.push(interests.username);
                if(post.popular !== null){
                    post.popular = Date.now() - post.popular;
                } else {
                    post.popular = Date.now() - post.timestamp;
                }
                post.updated = Date.now();
                post.save();
            }
        }
    }

    async checkCategory(category){
        let mainCategory = await this.getCategory(category.id);
        if(!mainCategory){
            await this.categoryDB(category.category);
        }
    }

    checkUpdate(update){
        if(update.type === 'update'){
            this.updates.push(update.update);
        } else if(update.type === 'deupdate'){
            this.updates = this.updates.filter(e => {return e !== update.update});
        }
    }

    // add transaction
    // async checkPost(post){
    //     let newPost = await this.postDB(post.post);
    //     if(newPost.media){
    //         this.downFiles(newPost.media, post.peer);
    //     }
    // }

    // async checkReply(posts){
    //     let newPost = await this.getPost(posts.id);
    //     if(newPost){
    //         newPost.replies.push(posts.posts);
    //         newPost.save();
    //         if(newPost.media){
    //             this.downFiles(post.media, posts.peer);
    //         }
    //     }
    //     // Post.findOne({_id: posts.id}, (error, data) => {
    //     //     if(error){
    //     //         return false;
    //     //     } else if(!data){
    //     //         return false;
    //     //     } else if(data){
    //     //         data.replies.push(posts.posts);
    //     //     }
    //     // });
    // }

    // validate admin from peer
    checkAdmin(admin){
        if(admin.type === 'admin'){
            this.admins.push(admin.admin);
        } else if(admin.type === 'deadmin'){
            let iter = this.admins.indexOf(admin.admin);
            if(iter !== -1){
                this.admins.splice(iter, 1);
            }
        }
    }

    // validate ban from peer
    checkBan(ban){
        if(ban.type === 'ban'){
            this.blockchain.bans.push(ban.ban);
        } else if(ban.type === 'deban'){
            let iter = this.blockchain.bans.indexOf(ban.ban);
            if(iter !== -1){
                this.blockchain.bans.splice(iter, 1);
            }
        }
    }

    // validate mod from peer
    checkMod(mod){
        if(data.type === 'mod'){
            this.blockchain.mods.push(mod.mod);
        } else if(data.type === 'demod'){
            let iter = this.blockchain.mods.indexOf(mod.mod);
            if(iter !== -1){
                this.blockchain.mods.splice(iter, 1);
            }
        }
    }

    // save a post on DB
    async postDB(post){
        let res = await new Post(post).save();
        return res;
    }

    async categoryDB(category){
        let res = await new Category(category).save();
        return res;
    }

    async getCategory(category){
        let res = await Category.findOne({category: category}).exec();
        return res;
    }

    async getPost(post){
        let res = await Post.findOne({_id: post}).exec();
        return res;
    }

    getPosts(){
        let cursor = Post.find({}).cursor();
        return new Promise((resolve, reject) => {
            let allPosts = [];
            cursor.on('data', data => {allPosts.push(data);});
            cursor.on('end', () => {resolve(allPosts);});
            cursor.on('error', error => {console.log(error);reject(false);});
        });
    }

}

module.exports = Main;