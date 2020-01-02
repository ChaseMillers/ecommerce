const { Order, CartItem } = require("../models/order");
const { errorHandler } = require("../helpers/dbErrorHandler");

const email = process.env.ADMIN_EMAIL
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.API_EMAIL);


exports.orderById = (req, res, next, id) => {
    Order.findById(id)
        .populate("products.product", "name price")
        .exec((err, order) => {
            if (err || !order) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            req.order = order;
            next();
        });
};

exports.create = (req, res) => {
    // console.log("CREATE ORDER: ", req.body);
    req.body.order.user = req.profile;
    const order = new Order(req.body.order);
    order.save((error, data) => {
        let productGrouped = "";
        if (error) {
            return res.status(400).json({
                error: errorHandler(error)
            });
        }
        for (let i = 0; i < order.products.length; i ++)
        {
            productGrouped += 
                 `
                <p><b>Products:</b> ${order.products[i].name}</p>
                <p><b>Products Price:</b> ${order.products[i].price}</p>
                <p><b>Product Count:</b> ${order.products[i].count}</p>
                <hr />
                `
        }
    const emailData = {
            to: email,
            from: 'noreply@ecommerce.com',
            subject: `A new order is received`,
            html: 
                `
                    <h1>Order Confirmation</h1>
                    <hr />
                    <h2><b>Total Charge:</b> $${order.amount}</h2>
                    <h2><b>Total Products Selected:</b> ${order.products.length}</h2>
                    <h2>Shipping Address</h2>
                    <hr />
                    <p><b>Name:</b> ${order.name}</p>
                    <p><b>Email:</b> ${order.email}</p>
                    <p><b>Adress:</b> ${order.address}</p>
                    <p><b>Apt./Suite:</b> ${order.apt}</p>
                    <p><b>City:</b> ${order.city}</p>
                    <p><b>Zip:</b> ${order.zip}</p>
                    <p><b>State:</b> ${order.state}</p>
                    <p><b>Country:</b> ${order.country}</p>
                    <h2>Order Details</h2>
                    <hr />
                    ${productGrouped}
                `
        }
    sgMail.send(emailData);
    res.json(data);
        
    });
};

exports.listOrders = (req, res) => {
    Order.find()
        .populate("user", "_id name address")
        .sort("-created")
        .exec((err, orders) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(error)
                });
            }
            res.json(orders);
        });
};

exports.getStatusValues = (req, res) => {
    res.json(Order.schema.path("status").enumValues);
};

exports.updateOrderStatus = (req, res) => {
    Order.update(
        { _id: req.body.orderId },
        { $set: { status: req.body.status } },
        (err, order) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(order);
        }
    );
};
