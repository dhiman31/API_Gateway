const express = require('express');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const {PORT} = require('../src/config/serverConfig');
const axios = require('axios');
const { error } = require('node:console');

const app = express();
const limiter = rateLimit({
	windowMs: 2 * 60 * 1000, // 2 minutes (time period)
	limit: 5 // Limit each IP to 5 requests per `window` (here, per 15 minutes).
})

app.use(limiter)
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const proxy = createProxyMiddleware({
                target: 'http://localhost:3000',
                changeOrigin: true,
                pathRewrite: {
                        '^/bookingService': ''
                    }
            });

const isAuthenPath = 'http://localhost:3001/api/v1/user/isAuthenticated';

const isAuthenticatedMiddleware = async (req,res,next) => {
    try {
        const token = req.headers['x-access-token'];
        const response = await axios.get(isAuthenPath, {
            headers: {
            'x-access-token': token
            }
        });

        if (!response.data.success) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        next();

    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

app.use(
    '/bookingService', 
    isAuthenticatedMiddleware,
    proxy
);

app.get('/home', (req, res) => {
    return res.json({message: 'OK'});
})

// app.get('/api/v1/city');

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
