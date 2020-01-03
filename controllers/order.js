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
    let productGrouped = "";
    order.save((error, data) => {
    
        if (error) {
            return res.status(400).json({
                error: errorHandler(error)
            });
        }
        for (let i = 0; i < order.products.length; i ++)
        {
            productGrouped += 
                `
                <li><b>Product:</b> ${order.products[i].name}</li>
                <li><b>Price:</b> $${order.products[i].price}</li>
                <li><b>Count:</b> ${order.products[i].count}</li>
                <br />
                `
        }
  
    const emailData = {
            to: `${order.email}`,
            from: 'noreply@ecommerce.com',
            subject: `A new order is received`,
            html: 
                `
                    <h1>Order Confirmation</h1>
                    <h2>Total: $${order.amount}</h2>
                    <br />
                    <h3>Products: ${order.products.length}</h3>
                    <hr />
                    <ul style="list-style-type: none;">
                        ${productGrouped}
                    </ul>
                    <h3>Shipping Address</h3>
                    <hr />
                    <ul style="list-style-type: none;">
                        <li><b>Name:</b> ${order.name}</li>
                        <li><b>Email:</b> ${order.email}</li>
                        <li><b>Adress:</b> ${order.address}</li>
                        <li><b>Apt./Suite:</b> ${order.apt}</li>
                        <li><b>City:</b> ${order.city}</li>
                        <li><b>Zip:</b> ${order.zip}</li>
                        <li><b>State:</b> ${order.state}</li>
                        <li><b>Country:</b> ${order.country}</li>
                    </ul>
                `
        }
    const clientEmailData = {
            to: order.email,
            from: 'noreply@ecommerce.com',
            subject: `A new order is received`,
            html: 
                `
                    <h1>Thanks For Your Purchase!</h1>
                    <h2>Items will be shipped in 1-3 busniess days.</h2>
                    <h1>Order Confirmation</h1>
                    <h2>Total: $${order.amount}</h2>
                    <br />
                    <h3>Products: ${order.products.length}</h3>
                    <hr />
                    <ul style="list-style-type: none;">
                        ${productGrouped}
                    </ul>
                    <h3>Shipping Address</h3>
                    <hr />
                    <ul style="list-style-type: none;">
                        <li><b>Name:</b> ${order.name}</li>
                        <li><b>Email:</b> ${order.email}</li>
                        <li><b>Adress:</b> ${order.address}</li>
                        <li><b>Apt./Suite:</b> ${order.apt}</li>
                        <li><b>City:</b> ${order.city}</li>
                        <li><b>Zip:</b> ${order.zip}</li>
                        <li><b>State:</b> ${order.state}</li>
                        <li><b>Country:</b> ${order.country}</li>
                    </ul>
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
