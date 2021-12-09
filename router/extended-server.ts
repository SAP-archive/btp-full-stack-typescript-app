import jwtDecode from 'jwt-decode';

const approuter = require('@sap/approuter');
const ar = approuter();

ar.beforeRequestHandler.use('/userInfo', (req: any, res: any) => {
    if (!req.user) {
        res.statusCode = 403;
        res.end('Missing JWT Token');
    } else {
        const user = req.user
        const token = jwtDecode(user.token.accessToken) as any;

        res.statusCode = 200;
        res.setHeader("Content-type", "application/json");
        res.end(JSON.stringify({
            "loginName": user.id,
            "firstName": token.given_name,
            "lastName": token.family_name,
            "email": token.email,
            "origin": token.origin,
            "roles": token["xs.system.attributes"]["xs.rolecollections"],
            "sessionTimeout": req.routerConfig.sessionTimeout
        }));
    }
});
ar.start();