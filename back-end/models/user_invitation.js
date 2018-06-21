'use strict';

module.exports = (sequelize, DataTypes) => {

    var UserInvitation = sequelize.define(
        "UserInvitation", {
            was_used: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            token: DataTypes.STRING,
            token_expiry_timestamp: DataTypes.DATE,
            first_name: DataTypes.STRING,
            last_name: DataTypes.STRING,
            email: DataTypes.STRING
        },
        modelProps(
            'user_invitation',
            'This table stores invite tokens generated to get users to sign up'
        )
    );

    UserInvitation.associate = function (models) {
        UserInvitation.belongsTo(models.Role);
        UserInvitation.belongsTo(models.User, {
            as: 'creator',
            foreignKey: 'creator_id'
        });
    };

    UserInvitation.prototype.toWeb = function() {

        let json = this.toJSON();
        json.token_expiry_timestamp = json.token_expiry_timestamp.getTime();
        return json;
    };

    return UserInvitation;
};