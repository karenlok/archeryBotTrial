const sql = require('mssql');

// Connect to database
const config = {
    user: 'azureuser', // better stored in an app setting such as process.env.DB_USER
    password: 'ss1020HH', // better stored in an app setting such as process.env.DB_PASSWORD
    server: 'mysqlserverkaren.database.windows.net', // better stored in an app setting such as process.env.DB_SERVER
    port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
    database: 'mySampleDatabase', // better stored in an app setting such as process.env.DB_NAME
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}

async function ConnectAndQuery(location, date) {
    try {
        var poolConnection = await sql.connect(config);

        console.log("Reading rows from the Table...");
        // var resultSet = await poolConnection.request().query(`SELECT TOP 20 pc.Name as CategoryName,
        //     p.name as ProductName 
        //     FROM [SalesLT].[ProductCategory] pc
        //     JOIN [SalesLT].[Product] p ON pc.productcategoryid = p.productcategoryid`);

        var resultSet = await poolConnection.request().query(`Select * from [dbo].[archCompetition] where Location = '${location}' and Date = '${date}'`);
        console.log(`${resultSet.recordset.length} rows returned.`);

        // output column headers
        var columns = "";
        for (var column in resultSet.recordset.columns) {
            columns += column + ", ";
        }
        console.log("%s\t", columns.substring(0, columns.length - 2));

        // ouput row contents from default record set
        resultSet.recordset.forEach(row => {
            console.log("%s\t%s\t%s\t%s", row.CompetitionID, row.CompetitionName, row.Location, row.Date);
        });

        // return result
        return resultSet.recordset;

        // close connection only when we're certain application is finished
        poolConnection.close();
    } catch (err) {
        console.error(err.message);
    }
}

module.exports.ConnectAndQuery = ConnectAndQuery;
