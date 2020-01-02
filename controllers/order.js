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
                `<hr />
                <p><b>Products:</b> ${order.products[i].name}</p>
                <p><b>Products Price:</b> ${order.products[i].price}</p>
                <p><b>Product Count:</b> ${order.products[i].count}</p>
                `
        }
    const emailData = {
            to: email,
            from: 'noreply@ecommerce.com',
            subject: `A new order is received`,
            html: 
                `
                    <h1>Order Confirmation</h1>
                    <br />
                    <li><p><b>Total Charge:</b> $${order.amount}</p></li>
                    <li><p><b>Total Products Selected:</b> ${order.products.length}</p></li>
                    <h2>Order Details</h2>
                    <hr />
                    ${productGrouped}
                    <h2>Shipping Address</h2>
                    <hr />
                    <li><p><b>Name:</b> ${order.name}</p></li>
                    <li><p><b>Email:</b> ${order.email}</p></li>
                    <li><p><b>Adress:</b> ${order.address}</p></li>
                    <li><p><b>Apt./Suite:</b> ${order.apt}</p></li>
                    <li><p><b>City:</b> ${order.city}</p></li>
                    <li><p><b>Zip:</b> ${order.zip}</p></li>
                    <li><p><b>State:</b> ${order.state}</p></li>
                    <li><p><b>Country:</b> ${order.country}</p></li>
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
