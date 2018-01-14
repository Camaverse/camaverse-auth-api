var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var router = express.Router();
var Purchases = require("../models/purchases");
var Users = require("../models/user");


var ApiResponse = require('../ApiResponse')
const Success = ApiResponse.SuccessResponse

const getPerUnit = (units) => {
    /*
    100	$12.99	0%	Buy!
        250	$27.99	13%	Buy!
        500	$49.99	23%	Buy!
        1000	$92.99	28%	Buy!
        1500	$134.99	30%
        */

    const fullPricePerCoin = 12.99 / 100
    const regularPriceOfPurchase = units * fullPricePerCoin

    let discount = 1;
    if (units >= 1500) discount = .70
    else if (units >= 1000) discount = .72
    else if (units >= 500) discount = .77
    else if (units >= 250) discount = .87

    const salePriceOfPurchase = regularPriceOfPurchase * discount
    const salePricePerUnit = salePriceOfPurchase / units

    return salePricePerUnit
}

const getTotalPrice = (perUnit, units) => {
    return perUnit * units
}

exports = module.exports = function(io) {

    let socket = null;
    io.on('connection', function (soc) {
        socket = soc

        socket.on('buyCoins', (purchase, cb) => {
            const perUnit = getPerUnit(purchase.units)
            purchase = new Purchases(purchase)
            purchase.price = {
                perUnit,
                total: getTotalPrice(perUnit,purchase.units)
            }

            console.log( purchase )

            purchase.save((err, doc) => {

                if (err) cb(err)
                else {

                    let qry = {slug: purchase.from.slug}
                    let transaction = {
                        category: 'load',
                        amount: purchase.units,
                        creatdAt: Date.now(),
                        details: 'Token Purchase',
                        purchase: doc._id
                    }
                    let update = {
                        $inc: {'coins.balance': purchase.units},
                        $push: {'coins.transactions': transaction}
                    }
                    let options = {
                        fields: 'coins',
                        new: true
                    }

                    console.log(update)

                    Users.findOneAndUpdate(qry, update, options, (err, user) => {
                        if (err) cb({err})
                        else {
                            cb(user)
                        }
                    })
                }
            })
        })
    })

    return router
}
