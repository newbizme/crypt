const { Given, AfterAll, After } = require('cucumber');
const chai = require('chai');
const { expect } = chai;

const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const roles = [
    'Investment Manager'
];

const users = {
    investment_manager: {
        first_name: 'Investment',
        last_name: 'Manager',
        email: 'investment.manager@cryptx.io',
        password: '123',
        is_active: true,
        created_timestamp: new Date(),
        role: {
            name: 'INVESTMENT MANAGER'
        }
    }
};

Given(/^The system has (a|an) (.*)$/, async function(a, role_name) {

    if(!roles.includes(role_name)) throw new Error(`Invalid role "${role_name}" in test`);

    const permisisons_categoriy_mapping = {
        investment_manager: [PERMISSIONS_CATEGORIES.INVESTMENT_RUN]
    };

    const { User, Role, Permission, RolePermission, PermissionsCategory, sequelize } = require('../../../models');

    const user_data = users[_.snakeCase(role_name)];

    const exists = await User.count({
        where: { email: user_data.email }
    });

    if(exists) return;

    return sequelize.transaction(transaction => {
        return PermissionsCategory.findAll({
            where: { name: permisisons_categoriy_mapping[_.snakeCase(role_name)] },
            raw: true,
            transaction
        }).then(permisisons_categories => {
            return Permission.findAll({
                where: { category_id: permisisons_categories.map(p => p.id) },
                transaction
            }).then(permissions => {
                return Role.create(user_data.role, { transaction })
                    .then(role => {
                        user_data.role.id = role.id;
                        return role.setPermissions(permissions, { transaction })
                            .then(() => {
                                return new User(user_data).save({ transaction })
                                    .then(user => {
                                        user_data.id = user.id;
                                        return user.setRoles([role], { transaction }).then(() => {
                                            if(!this.users) this.users = {};
                                            user.unhashed_password = user_data.password;
                                            this.users[_.snakeCase(role_name)] = user;  //Save the user in the world to use in other tests
                                        });
                                    });
                            });
                    });
            });
        })
    });

});

//This will be called after the scenario where the @user_cleanup tag is placed.
After('@user_cleanup', async function() {
    const { User, Role, sequelize } = require('../../../models');

    const to_clean_up = {
        users: [],
        roles: []
    };

    for(let role in users) {
        const user_data = users[role];
        if(user_data.id) {
            to_clean_up.users.push(user_data.id);
            to_clean_up.roles.push(user_data.role.id);
        }
    }

    if(!to_clean_up.users.length) return;

    return sequelize.transaction(transaction => {
        return Role.destroy({
            where: { id: to_clean_up.roles },
            transaction
        }).then(() => {
            return User.destroy({
                where: { id: to_clean_up.users },
                transaction
            });
        })
    });
});