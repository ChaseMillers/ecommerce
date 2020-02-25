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
    // console.log('CREATE ORDER: ', req.body);
    req.body.order.user = req.profile;
    const order = new Order(req.body.order);
    order.save((error, data) => {
        if (error) {
            return res.status(400).json({
                error: errorHandler(error)
            });
        }
        // User.find({ categories: { $in: categories } }).exec((err, users) => {}
        // console.log('ORDER IS JUST SAVED >>> ', order);
        // send email alert to admin
        // order.address
        // order.products.length
        // order.amount
    
    const emailData = {
            to: email,
            from: 'noreply@ecommerce.com',
            subject: `A new order is received`,
            html: 
                `
                <h1>Order Confirmation</h1>
                <h2>Total: $${order.amount}</h2>
                <h2>Transaction ID: ${order.transaction_id}</h2>
                <h2>Order status: ${order.status}</h2>
                <br />
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
                <h3>Products: ${order.products.length}</h3>
                <hr />
                <ul style="list-style-type: none;">
                ${order.products
                    .map(p => {
                        return `<div>
                        <li><b>Product Name:</b> ${p.name}</li>
                        <li><b>Product Price:</b> ${p.price}</li>
                        <li><b>Product Quantity:</b> ${p.count}</li>
                    </div>`;
                    })}
                </ul>
                `
    };
    sgMail
        .send(emailData)
        .then(sent => console.log('SENT >>>', sent))
        .catch(err => console.log('ERR >>>', err));
    
    // email to buyer
    const EmailData2 = {
            to: order.email,
            from: 'noreply@ecommerce.com',
            subject: `Your order receipt`,
            html: 
                `
                <h1>Thanks For Your Purchase!</h1>
                <p>Items will be shipped in 1-3 business days.</p>
                <br />
                <h2>Order Confirmation</h2>
                <h3>Total: $${order.amount}</h3>
                <h3>Transaction ID: 
                ${order.transaction_id}</h3>
                <hr />
                <h3>Shipping Address</h3>
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
                <h3>Products: ${order.products.length}</h3>
                <hr />
                <ul style="list-style-type: none;">
                    ${order.products
                        .map(p => {
                            return `<div>
                                <li><b>Product Name:</b> ${p.name}</li>
                                <li><b>Product Price:</b> ${p.price}</li>
                                <li><b>Product Quantity:</b> ${p.count}</li>
                        </div>`;
                        })}
                    </ul>
                `
        };
  
        sgMail
        .send(EmailData2)
        .then(sent => console.log('SENT 2 >>>', sent))
        .catch(err => console.log('ERR 2 >>>', err));
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
