const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

// Load env variables
const env = dotenv.config().parsed || {};

module.exports = {
    entry: './src/rag-chat-widget.js',
    output: {
        filename: process.env.NODE_ENV === 'production' 
            ? 'rag-chat-widget.min.js' 
            : 'rag-chat-widget.bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        library: {
            name: 'RagChat',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this'
    },
    mode: process.env.NODE_ENV || 'development',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: '> 0.25%, not dead',
                                useBuiltIns: 'usage',
                                corejs: 3
                            }]
                        ]
                    }
                }
            }
        ]
    },
    optimization: {
        minimize: process.env.NODE_ENV === 'production',
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                    },
                    compress: {
                        drop_console: false,  // Keep console for debugging
                        drop_debugger: true,
                        // Don't remove sessionId code
                        pure_funcs: []
                    },
                    mangle: {
                        // Don't mangle sessionId related code
                        reserved: ['getSessionId', 'sessionId', 'ragChatSessionId']
                    }
                },
                extractComments: false
            }),
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(env)
        }),
        new HtmlWebpackPlugin({
            template: 'index.template.html',
            templateParameters: {
                RAG_CHAT_TOKEN: env.RAG_CHAT_TOKEN || '',
                RAG_CHAT_URL: env.RAG_CHAT_URL || ''
            },
            inject: 'body'
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        hot: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src *; img-src 'self' data: https:;"
        }
    }
};
