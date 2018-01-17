var passport = require('passport');
var express = require('express');
var router = express.Router();
var Tips = require("../models/tips");
var Users = require("../models/user");
var Broadcasters = require("../models/broadcaster");

var ApiResponse = require('../helpers/ApiResponse')

exports = module.exports = function(io) {

    let socket = null;
    io.on('connection', function (soc) {
        socket = soc

        socket.on('sendTip', (tip, cb) => {
            // find user
            Users.findOne({slug: tip.from.slug}, (err, user) => {
                if (err){
                    if (cb) cb({err})
                } else if (tip.amount > user.coins.balance) { // check their balance
                    if (cb) cb({errors: 'Declined. Not Enough Tokens.'})
                } else {
                    let transaction = {
                        category: 'tip',
                        amount: tip.amount,
                        creatdAt: Date.now(),
                        details: 'Tip to ' + tip.to.username
                    }
                    // deduct the amount and save
                    user.coins.balance -= tip.amount
                    user.coins.transactions.push(transaction)
                    user.save((err, user) => {
                        if (err) {
                            if(cb)cb({err})
                        } else {
                            // find the broadcaster
                            Broadcasters.findOne({slug: tip.to.slug}, (err, broadcaster)=> {
                                if (err) { if(cb) cb({err}) }
                                else {

                                    let transaction2 = {
                                        category: 'tip',
                                        amount: tip.amount,
                                        creatdAt: Date.now(),
                                        details: 'Tip from ' + tip.from.username
                                    }
                                    // add the amount and save
                                    broadcaster.coins.balance += tip.amount
                                    broadcaster.coins.transactions.push(transaction2)
                                    broadcaster.save((err, broadcaster) => {
                                        if (err) { if(cb)cb({err})
                                        } else {
                                            let room = tip.to.room
                                            tip = new Tips  (tip)
                                            tip.save((err, tip) => {
                                                if (err) {
                                                    if(cb) cb({err})
                                                } else {
                                                    tip.balance = user.coins
                                                    if (cb) cb(tip)
                                                    socket.emit('transmitTip', tip)
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        })
    })

    return router;
}

