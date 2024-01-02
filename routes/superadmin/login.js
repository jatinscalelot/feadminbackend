let express = require("express");
let router = express.Router();
const mongoConnection = require('../../utilities/connections');
const responseManager = require('../../utilities/response.manager');
const constants = require('../../utilities/constants');
const helper = require('../../utilities/helper');
const adminModel = require('../../models/superadmin/admins.model');
const roleModel = require('../../models/superadmin/roles.model');
const mongoose = require('mongoose');
router.post('/', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { adminid, password } = req.body;
    if(adminid && password && password.length >= 8){
        let primary = mongoConnection.useDb(constants.DEFAULT_DB);
        let superadminData = await primary.model(constants.MODELS.admins, adminModel).findOne({adminid: adminid, status: true}).lean();
        if(superadminData && superadminData != null && superadminData.status == true && superadminData.roleId && superadminData.roleId != '' && mongoose.Types.ObjectId.isValid(superadminData.roleId)){
            let decPassword = await helper.passwordDecryptor(superadminData.password);
            if(decPassword == password){
                let roleData = await primary.model(constants.MODELS.roles, roleModel).findById(superadminData.roleId).lean();
                let accessToken = await helper.generateAccessToken({ superadminid : superadminData._id.toString() });
                return responseManager.onSuccess('Super Admin login successfully!', {token : accessToken, role : roleData}, res);
            }else{
                return responseManager.badrequest({message : 'Invalid password, please try again'}, res);
            }
        }else{
            return responseManager.badrequest({message : 'Invalid admin id or password please try again'}, res);
        }
    }else{
        return responseManager.badrequest({message : 'Invalid admin id or password please try again'}, res);
    } 
});
router.post('/updatepassword', helper.authenticateToken, async (req, res) => {});
router.post('/forgetpassword', helper.authenticateToken, async (req, res) => {});
router.post('/encPass', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { password } = req.body;
    let encPassword = await helper.passwordEncryptor(password);
    return responseManager.onSuccess('Password!', {password : encPassword}, res);
});
router.post('/decPass', async (req, res) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const { password } = req.body;
    let decPassword = await helper.passwordDecryptor(password);
    return responseManager.onSuccess('Password!', {password : decPassword}, res);
});
module.exports = router;
