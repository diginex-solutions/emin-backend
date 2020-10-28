var mongoose = require('mongoose');
const spaces = [
    {
        "_id": mongoose.Types.ObjectId("5eafeb3085d7013cd85a7908"),
        "name": "Personal Space",
        "description": "My private space",
        "icon": "mdi-home",
        "hasUserDirectory": false,
        "isPrivate": true,
        "isUserDirectory": false,
        "allowInviteAll": false,
        "isCases": true,
        "isDashboard": true,
        "isForms": true,
        "isOrganization": true,
        "isChecklist": true,
        "isSupport": true,
        "userLimit": 10000
    }
]

module.exports = spaces
