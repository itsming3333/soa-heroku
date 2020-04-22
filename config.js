const config = {
    database :{
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    },
    server:{
        host: "127.0.0.1",
        port: 3000
    }
}

module.exports = config;
